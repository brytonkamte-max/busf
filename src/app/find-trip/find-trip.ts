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

  searchPartenza = '';
  searchDestinazione = '';
  searchTime = '';
  searchDate = '';

  filteredTrips = signal<Trip[]>([]);
  hasSearched = signal(false);
  availableCities = signal<string[]>([]);
  lines = signal<Line[]>([]);

  nearestStop = signal<string | null>(null);
  nearestLineName = signal<string | null>(null);
  geoLoading = signal(false);
  geoError = signal<string | null>(null);

  userLat: number | null = null;
  userLng: number | null = null;
  realUserLat: number | null = null;
  realUserLng: number | null = null;
  stopsForMap: any[] = [];

  private allTrips: Trip[] = [];
  private allStopsFromTrips: any[] = [];
  private GOOGLE_API_KEY = 'AIzaSyDq2q4u-fP_DVkliNrtczSymGwadn2O7BU';

  ngOnInit(): void {
    let now = new Date();
    this.searchDate = now.toISOString().split('T')[0];
    this.searchTime = now.toTimeString().slice(0, 5);

    this.loadInitialData();
    this.loadLines();
  }

  private loadInitialData(): void {
    this.tripService.getTrips().subscribe({
      next: (trips) => {
        this.allTrips = trips;

        let cities = new Set<string>();
        let stops: any[] = [];

        console.log('--- DEBUG: TRIPS RICEVUTI ---', trips);

        trips.forEach(t => {
          console.log('--- DEBUG: TRIP ---', t);
          console.log('--- DEBUG: LINE DEL TRIP ---', t.line);

          t.stops?.forEach(s => {
            cities.add(s.city);

            const idTrovato =
              t.line?.id ||
              (s as any).lineId ||
              (s as any).line_id ||
              (s as any).lineid ||
              null;

            stops.push({
              ...s,
              lineId: idTrovato,
              lineName: t.line?.name || null
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

  private loadLines(): void {
    this.lineService.getLines().subscribe({
      next: (lines) => {
        this.lines.set(lines);
        console.log('--- DEBUG: LINEE CARICATE ---', lines);
      },
      error: (err) => {
        console.error('Errore caricamento linee:', err);
      }
    });
  }

  find(): void {
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

        return !!hasStart && !!hasEnd && matchesDate && matchesTime;
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
      (err) => this.handleGeoError(err),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
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
    let finalCoords: { lat: number; lng: number } | null = null;
    let nearestLineNameFound: string | null = null;
    let nearestLineIdFound: number | null = null;

    console.log('--- DEBUG: INIZIO GEOCODING ---');
    console.log('--- DEBUG: ALL TRIPS ---', this.allTrips);
    console.log('--- DEBUG: ALL LINES ---', this.lines());

    for (let stop of uniqueStops) {
      await new Promise(r => setTimeout(r, 400));

      const query = `${stop.address}, ${stop.city}, Italia`;
      const coords = await this.geocodeAddress(query);

      if (!coords) {
        continue;
      }

      const dist = this.haversine(latitude, longitude, coords.lat, coords.lng);

      if (dist < minDist) {
        minDist = dist;
        nearestStopObj = stop;
        finalCoords = coords;

        console.log('--- DEBUG: NUOVA FERMATA PIÙ VICINA ---', stop);

        const tripWithStop = this.allTrips.find(t =>
          t.stops?.some(s =>
            this.normalizeString(s.city) === this.normalizeString(stop.city) &&
            this.normalizeString(s.address) === this.normalizeString(stop.address)
          )
        );

        console.log('--- DEBUG: TRIP CON FERMATA ---', tripWithStop);

        if (tripWithStop?.line?.name) {
          nearestLineNameFound = tripWithStop.line.name;
          nearestLineIdFound = tripWithStop.line.id ?? null;
          console.log('--- DEBUG: LINEA TROVATA DAL TRIP ---', nearestLineNameFound);
        } else {
          const foundLine = this.lines().find(line =>
            line.stops?.some((s: any) =>
              this.normalizeString(s.city) === this.normalizeString(stop.city) &&
              this.normalizeString(s.address) === this.normalizeString(stop.address)
            )
          );

          console.log('--- DEBUG: LINEA TROVATA NELLE LINES() ---', foundLine);

          if (foundLine?.name) {
            nearestLineNameFound = foundLine.name;
            nearestLineIdFound = foundLine.id ?? null;
          } else if (stop.lineName) {
            nearestLineNameFound = stop.lineName;
            nearestLineIdFound = stop.lineId ?? null;
          } else if (stop.lineId) {
            nearestLineIdFound = stop.lineId;
            nearestLineNameFound = null;
          } else {
            nearestLineNameFound = null;
            nearestLineIdFound = null;
            console.log('--- DEBUG: NESSUNA LINEA TROVATA PER QUESTA FERMATA ---');
          }
        }
      }
    }

    if (nearestStopObj && finalCoords) {
      this.userLat = finalCoords.lat;
      this.userLng = finalCoords.lng;
      this.searchPartenza = nearestStopObj.city;

      this.nearestStop.set(
        `${nearestStopObj.city} - ${nearestStopObj.address} (${Math.round(minDist)} m)`
      );

      if (nearestLineNameFound) {
        this.nearestLineName.set(nearestLineNameFound);
      } else if (nearestLineIdFound) {
        try {
          const lineData = await firstValueFrom(this.lineService.getLineById(nearestLineIdFound));
          console.log('--- DEBUG: RISPOSTA getLineById ---', lineData);
          this.nearestLineName.set(lineData?.name || 'Linea sconosciuta');
        } catch (e) {
          console.error('Errore getLineById:', e);
          this.nearestLineName.set('Linea sconosciuta');
        }
      } else {
        this.nearestLineName.set('Linea sconosciuta');
      }

      if (nearestLineIdFound) {
        await this.loadLineOnMap(nearestLineIdFound);
      }
    } else {
      this.nearestStop.set('Nessuna fermata trovata');
      this.nearestLineName.set(null);
    }

    this.geoLoading.set(false);
  }

  private handleGeoError(error: GeolocationPositionError): void {
    this.geoLoading.set(false);

    if (error.code === 1) {
      this.geoError.set('Permesso posizione negato');
    } else if (error.code === 2) {
      this.geoError.set('Posizione non disponibile');
    } else if (error.code === 3) {
      this.geoError.set('Timeout nella richiesta della posizione');
    } else {
      this.geoError.set('Errore geolocalizzazione');
    }

    console.error('Errore geolocalizzazione:', error);
  }

  private async loadLineOnMap(lineId: number): Promise<void> {
    const fermateDellaLinea = this.allStopsFromTrips.filter(f => f.lineId === lineId);

    const mappedStops = await Promise.all(
      fermateDellaLinea.map(async (s) => {
        const c = await this.geocodeAddress(`${s.address}, ${s.city}, Italia`);
        return {
          ...s,
          latitude: c?.lat,
          longitude: c?.lng
        };
      })
    );

    this.stopsForMap = mappedStops.filter(s => s.latitude != null && s.longitude != null);
  }

  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.GOOGLE_API_KEY}`;

    try {
      const res: any = await firstValueFrom(this.http.get(url));
      console.log('--- DEBUG: GEOCODING ---', address, res);

      if (res.results?.length > 0) {
        return res.results[0].geometry.location;
      }
    } catch (e) {
      console.error('Errore geocoding:', address, e);
    }

    return null;
  }

  private extractUniqueStops(stops: any[]): any[] {
    let res: any[] = [];

    stops.forEach(s => {
      let found = res.find(x =>
        this.normalizeString(x.address) === this.normalizeString(s.address) &&
        this.normalizeString(x.city) === this.normalizeString(s.city)
      );

      if (!found) {
        res.push(s);
      }
    });

    return res;
  }

  private normalizeString(value: any): string {
    return (value || '').toString().trim().toLowerCase();
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const toRad = (v: number) => v * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

