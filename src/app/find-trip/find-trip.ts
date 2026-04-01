import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// Servizi
import { BusTripService } from '../bus-trip-service';
import { BusLineService } from '../bus-line-service';
import { BusStopGeocodeService } from '../bus-stop-geocode-service';

// Modelli
import { Trip, Line } from '../model/entities';
import { TripList } from '../trip-list/trip-list';
import { MapComponent } from '../map-component/map-component';

@Component({
  selector: 'app-find-trip',
  standalone: true,
  imports: [FormsModule, CommonModule, TripList, MapComponent],
  templateUrl: './find-trip.html',
  styleUrl: './find-trip.css',
})
export class FindTrip implements OnInit {
  @ViewChild('mapComp') mapComp!: MapComponent;

  private tripService = inject(BusTripService);
  private lineService = inject(BusLineService);
  private http = inject(HttpClient);

  // Input ricerca
  searchPartenza = '';
  searchDestinazione = '';
  searchTime = '';
  searchDate = '';

  // Segnali UI
  filteredTrips = signal<Trip[]>([]);
  hasSearched = signal(false);
  availableCities = signal<string[]>([]);
  
  // Geolocalizzazione
  nearestStop = signal<string | null>(null);
  nearestLineName = signal<string | null>(null);
  geoLoading = signal(false);
  geoError = signal<string | null>(null);

  // Coordinate
  userLat: number | null = null;
  userLng: number | null = null;
  realUserLat: number | null = null;
  realUserLng: number | null = null;
  stopsForMap: any[] = [];

  private allStopsFromTrips: any[] = [];
  private GOOGLE_API_KEY = 'AIzaSyDq2q4u-fP_DVkliNrtczSymGwadn2O7BU';

  ngOnInit(): void {
    const now = new Date();
    this.searchDate = now.toISOString().split('T')[0];
    this.searchTime = now.toTimeString().slice(0, 5);
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.tripService.getTrips().subscribe({
      next: (trips) => {
        const cities = new Set<string>();
        const stops: any[] = [];
        
        console.log('--- DEBUG: TRIPS RICEVUTI ---', trips);

        trips.forEach(t => {
          t.stops?.forEach(s => {
            cities.add(s.city);
            
            // 🛠️ LOGICA DI RECUPERO ID (Prova tutte le varianti)
            const idTrovato = t.line?.id || (s as any).lineId || (s as any).line_id || (s as any).lineid;
            
            stops.push({ 
              ...s, 
              lineId: idTrovato // Normalizziamo tutto su lineId
            });
          });
        });

        this.availableCities.set(Array.from(cities).sort());
        this.allStopsFromTrips = stops;
        console.log('--- DEBUG: FERMATE MAPPATE ---', this.allStopsFromTrips);
      },
      error: (err) => {
        console.error('Errore caricamento Trips:', err);
        this.geoError.set('Errore collegamento server');
      }
    });
  }

  find(): void {
    this.tripService.getTrips().subscribe(allTrips => {
      const filtered = allTrips.filter(t => {
        const hasStart = t.stops?.some(s => s.city.toLowerCase().includes(this.searchPartenza.toLowerCase()));
        const hasEnd = t.stops?.some(s => s.city.toLowerCase().includes(this.searchDestinazione.toLowerCase()));
        return hasStart && hasEnd && (!this.searchDate || t.date === this.searchDate);
      });
      this.filteredTrips.set(filtered.slice(-4));
      this.hasSearched.set(true);
    });
  }

  swapCities(): void {
    [this.searchPartenza, this.searchDestinazione] = [this.searchDestinazione, this.searchPartenza];
  }

  getPosition(): void {
    if (!navigator.geolocation) {
      this.geoError.set('GPS non supportato');
      return;
    }
    this.geoLoading.set(true);
    this.geoError.set(null);
    this.nearestStop.set(null);
    this.nearestLineName.set(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => this.handlePositionSuccess(pos),
      (err) => {
        this.geoLoading.set(false);
        this.geoError.set('Permesso GPS negato');
      }
    );
  }

  private async handlePositionSuccess(position: GeolocationPosition): Promise<void> {
    const { latitude, longitude } = position.coords;
    this.realUserLat = latitude;
    this.realUserLng = longitude;

    const uniqueStops = this.extractUniqueStops(this.allStopsFromTrips);
    let nearestStopObj: any = null;
    let minDist = Infinity;
    let finalCoords: { lat: number, lng: number } | null = null;

    console.log('--- DEBUG: INIZIO GEOCODING ---');

    for (const stop of uniqueStops) {
      await new Promise(r => setTimeout(r, 400));
      const query = `${stop.address}, ${stop.city}, Italia`;
      const coords = await this.geocodeAddress(query);

      if (coords) {
        const dist = this.haversine(latitude, longitude, coords.lat, coords.lng);
        if (dist < minDist) {
          minDist = dist;
          nearestStopObj = stop;
          finalCoords = coords;
        }
      }
    }

    if (nearestStopObj && finalCoords) {
      console.log('--- DEBUG: FERMATA PIÙ VICINA ---', nearestStopObj);
      
      this.userLat = finalCoords.lat;
      this.userLng = finalCoords.lng;
      this.searchPartenza = nearestStopObj.city;
      this.nearestStop.set(`${nearestStopObj.city} - ${nearestStopObj.address} (${Math.round(minDist)} m)`);

      const idDaCercare = nearestStopObj.lineId;
      console.log('--- DEBUG: CERCO LINEA CON ID ---', idDaCercare);

      if (idDaCercare) {
        try {
          const lineData = await firstValueFrom(this.lineService.getLineById(idDaCercare));
          console.log('--- DEBUG: RISPOSTA LINE SERVICE ---', lineData);
          this.nearestLineName.set(lineData.name);
        } catch (e) {
          console.error('Errore chiamata getLineById:', e);
          this.nearestLineName.set(`Errore caricamento nome (ID: ${idDaCercare})`);
        }
        this.loadLineOnMap(idDaCercare);
      } else {
        this.nearestLineName.set('ID Linea non trovato');
      }
    } else {
      this.nearestStop.set('Nessuna fermata trovata');
    }
    this.geoLoading.set(false);
  }

  private async loadLineOnMap(lineId: number): Promise<void> {
    const fermateDellaLinea = this.allStopsFromTrips.filter(f => f.lineId === lineId);
    const mappedStops = await Promise.all(
      fermateDellaLinea.map(async (s) => {
        const c = await this.geocodeAddress(`${s.address}, ${s.city}, Italia`);
        return { ...s, latitude: c?.lat, longitude: c?.lng };
      })
    );
    this.stopsForMap = mappedStops.filter(s => s.latitude != null);
  }

  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.GOOGLE_API_KEY}`;
    try {
      const res: any = await firstValueFrom(this.http.get(url));
      if (res.results?.length > 0) return res.results[0].geometry.location;
    } catch (e) { return null; }
    return null;
  }

  private extractUniqueStops(stops: any[]): any[] {
    const res: any[] = [];
    stops.forEach(s => {
      if (!res.find(x => x.address === s.address && x.city === s.city)) res.push(s);
    });
    return res;
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const toRad = (v: number) => v * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}