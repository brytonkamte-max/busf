import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusTripService } from '../bus-trip-service';
import { Trip } from '../model/entities';
import { TripList } from '../trip-list/trip-list';
import { firstValueFrom, last } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-find-trip',
  imports: [FormsModule,CommonModule,TripList],
  templateUrl: './find-trip.html',
  styleUrl: './find-trip.css',
})
export class FindTrip {
private tripService = inject(BusTripService);
  private http = inject(HttpClient);

  searchPartenza = '';
  searchDestinazione = '';
  searchTime = '';
  searchDate = '';
  trafficMultiplier = 0;

  filteredTrips = signal<Trip[]>([]);
  hasSearched = signal(false);
  availableCities = signal<string[]>([]);

  private GOOGLE_API_KEY = 'AIzaSyDq2q4u-fP_DVkliNrtczSymGwadn2O7BU';

  nearestStop = signal<string | null>(null);
  geoLoading = signal(false);
  geoError = signal<string | null>(null);

  get trafficLabel(): string {
    if (this.trafficMultiplier === 0) return 'Nessun traffico';
    if (this.trafficMultiplier <= 0.3) return 'Traffico lieve';
    if (this.trafficMultiplier <= 0.6) return 'Traffico medio';
    return 'Traffico intenso';
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
      this.hasSearched.set(true);
    });
  }

  swapCities() {
    let temp = this.searchPartenza;
    this.searchPartenza = this.searchDestinazione;
    this.searchDestinazione = temp;
  }

  ngOnInit() {
    let ora = new Date();
    this.searchDate = ora.toISOString().split('T')[0];
    this.searchTime = ora.toTimeString().slice(0, 5);

    this.tripService.getTrips().subscribe(trips => {
      let cities = new Set<string>();
      trips.forEach(t => {
        t.stops?.forEach(s => cities.add(s.city));
      });
      this.availableCities.set(Array.from(cities).sort());
    });
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

      let opzioni = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => this.positionFound(position),
        (error) => this.geoErrorHandler(error),
        opzioni
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
          let alreadyExists = stops.find(x => x.city === s.city && x.address === s.address);
          if (!alreadyExists) {
            stops.push({ city: s.city, address: s.address });
          }
        });
      });

      let nearest = '';
      let nearestCity = '';
      let minDist = Infinity;

      for (let stop of stops) {
        let query = `${stop.address}, ${stop.city}, Italia`;
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
        }
      }

      if (nearest) {
        this.nearestStop.set(nearest);
        this.searchPartenza = nearestCity;
      } else {
        this.nearestStop.set('Nessuna fermata trovata');
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
