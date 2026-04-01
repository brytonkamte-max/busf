import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
<<<<<<< HEAD
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
=======
import { BusTripService } from '../bus-trip-service';
import { Line, Trip } from '../model/entities';
import { TripList } from '../trip-list/trip-list';
import { firstValueFrom, last } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BusLineService } from '../bus-line-service';
>>>>>>> f61907d7980d3db7b4e8fb2bb8bea2e2975a807a

@Component({
  selector: 'app-find-trip',
  standalone: true,
  imports: [FormsModule, CommonModule, TripList, MapComponent],
  templateUrl: './find-trip.html',
  styleUrl: './find-trip.css',
})
<<<<<<< HEAD
export class FindTrip implements OnInit {
  @ViewChild('mapComp') mapComp!: MapComponent;

=======
export class FindTrip {
>>>>>>> f61907d7980d3db7b4e8fb2bb8bea2e2975a807a
  private tripService = inject(BusTripService);
  private lineService = inject(BusLineService);
  private http = inject(HttpClient);

<<<<<<< HEAD
  // Input ricerca
=======
>>>>>>> f61907d7980d3db7b4e8fb2bb8bea2e2975a807a
  searchPartenza = '';
  searchDestinazione = '';
  searchTime = '';
  searchDate = '';
<<<<<<< HEAD

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
=======
  trafficMultiplier = 0;

  filteredTrips = signal<Trip[]>([]);
  hasSearched = signal(false);
  availableCities = signal<string[]>([]);
  lines = signal<Line[]>([]);

  private GOOGLE_API_KEY = 'AIzaSyDq2q4u-fP_DVkliNrtczSymGwadn2O7BU';

  nearestStop = signal<string | null>(null);
  nearestLine = signal<string | null>(null);
  geoLoading = signal(false);
  geoError = signal<string | null>(null);

  get trafficLabel(): string {
    if (this.trafficMultiplier === 0) return 'Nessun traffico';
    if (this.trafficMultiplier <= 0.3) return 'Traffico lieve';
    if (this.trafficMultiplier <= 0.6) return 'Traffico medio';
    return 'Traffico intenso';
  }

  ngOnInit() {
    let now = new Date();
    this.searchDate = now.toISOString().split('T')[0];
    this.searchTime = now.toTimeString().slice(0, 5);

    this.tripService.getTrips().subscribe(trips => {
      let cities = new Set<string>();

      trips.forEach(t => {
        t.stops?.forEach(s => cities.add(s.city));
      });

      this.availableCities.set(Array.from(cities).sort());
    });

    this.loadLines();
  }

  loadLines(): void {
    this.lineService.getLines().subscribe((lines) => {
      this.lines.set(lines);
      console.log('LINEE CARICATE:', lines);
    });
  }

  find() {
    this.tripService.getTrips().subscribe(allTrips => {
      let filtered = allTrips.filter(t => {
        let hasStart = t.stops?.some(s =>
          s.city.toLowerCase().includes(this.searchPartenza.toLowerCase())
        );

        let hasEnd = t.stops?.some(s =>
          s.city.toLowerCase().includes(this.searchDestinazione.toLowerCase())
        );

        let matchesDate = this.searchDate ? t.date === this.searchDate : true;
        let matchesTime = this.searchTime ? t.start >= (this.searchTime + ':00') : true;

        return hasStart && hasEnd && matchesDate && matchesTime;
      });

      let lastFour = filtered.slice(-4);
      this.filteredTrips.set(lastFour);
>>>>>>> f61907d7980d3db7b4e8fb2bb8bea2e2975a807a
      this.hasSearched.set(true);
    });
  }

<<<<<<< HEAD
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
=======
  swapCities() {
    let temp = this.searchPartenza;
    this.searchPartenza = this.searchDestinazione;
    this.searchDestinazione = temp;
  }

  Geolocator = {
    getPosition: () => {
      if (!navigator.geolocation) {
        this.geoError.set('Geolocalizzazione non supportata dal browser');
        return;
      }

      this.geoLoading.set(true);
      this.geoError.set(null);
      this.nearestStop.set(null);
      this.nearestLine.set(null);

      let options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => this.positionFound(position),
        (error) => this.geoErrorHandler(error),
        options
      );
    }
  };

  private positionFound(position: GeolocationPosition) {
    let userLat = position.coords.latitude;
    let userLng = position.coords.longitude;

    this.tripService.getTrips().subscribe(async trips => {
      let stops: { city: string; address: string }[] = [];

      trips.forEach(t => {
        t.stops?.forEach(s => {
          let alreadyExists = stops.find(
            x => x.city === s.city && x.address === s.address
          );

          if (!alreadyExists) {
            stops.push({
              city: s.city,
              address: s.address
            });
          }
        });
      });

      let nearest = '';
      let nearestCity = '';
      let nearestLineName = '';
      let minDist = Infinity;

      for (let stop of stops) {
        let query = stop.address.toLowerCase().includes(stop.city.toLowerCase())
          ? `${stop.address}, Italia`
          : `${stop.address}, ${stop.city}, Italia`;

        console.log('Geocodifico:', query);

        let coords = await this.geocodeAddress(query);
        console.log('Coordinate trovate per', query, coords);

        if (!coords) continue;

        let dist = this.haversine(userLat, userLng, coords.lat, coords.lng);
        console.log('Distanza da', stop.address, ':', dist);

        if (dist < minDist) {
          minDist = dist;
          nearest = `${stop.city} - ${stop.address} (${Math.round(dist)} m)`;
          nearestCity = stop.city;

          let tripWithStop = trips.find(t =>
            t.stops?.some(s => s.city === stop.city && s.address === stop.address)
          );

          console.log('TRIP TROVATO:', tripWithStop);
          console.log('LINEE DISPONIBILI:', this.lines());

          if (tripWithStop && tripWithStop.line && tripWithStop.line.name) {
            nearestLineName = tripWithStop.line.name;
          } else {
            let foundLine = this.lines().find(l =>
              l.stops?.some(s => s.city === stop.city && s.address === stop.address)
            );

            if (foundLine) {
              nearestLineName = foundLine.name;
            } else {
              nearestLineName = 'Linea sconosciuta';
            }
          }
        }
      }

      if (nearest) {
        this.nearestStop.set(nearest);
        this.nearestLine.set(nearestLineName);
        this.searchPartenza = nearestCity;
      } else {
        this.nearestStop.set('Nessuna fermata trovata');
        this.nearestLine.set(null);
      }

      this.geoLoading.set(false);
    });
  }

  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.GOOGLE_API_KEY}`;

    try {
      let res: any = await firstValueFrom(this.http.get(url));
      console.log('Risposta geocoding per', address, res);

      if (res.results && res.results.length > 0) {
        let loc = res.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng };
      }
    } catch (e) {
      console.error('Errore geocoding per', address, e);
    }

    return null;
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    let R = 6371000;
    let dLat = (lat2 - lat1) * Math.PI / 180;
    let dLng = (lon2 - lon1) * Math.PI / 180;

    let a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private geoErrorHandler(error: GeolocationPositionError) {
    this.geoLoading.set(false);

    if (error.code === 1) {
      this.geoError.set('Permesso posizione negato dal browser.');
    } else if (error.code === 2) {
      this.geoError.set('Posizione non disponibile.');
    } else if (error.code === 3) {
      this.geoError.set('Timeout nella richiesta della posizione.');
    } else {
      this.geoError.set('Errore sconosciuto nella geolocalizzazione.');
    }

    console.log('Errore geolocalizzazione:', error);
  }
}
>>>>>>> f61907d7980d3db7b4e8fb2bb8bea2e2975a807a
