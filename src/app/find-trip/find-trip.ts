import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusTripService } from '../bus-trip-service';
import { Trip } from '../model/entities';
import { TripList } from '../trip-list/trip-list';
import { last } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-find-trip',
  imports: [FormsModule,CommonModule,TripList],
  templateUrl: './find-trip.html',
  styleUrl: './find-trip.css',
})
export class FindTrip {
private tripService = inject(BusTripService);
  
  searchPartenza = '';
  searchDestinazione = '';

  // Inizializziamo con valori vuoti o stringhe
  searchTime = ''; 
  searchDate = '';
  // Moltiplicatore traffico (0 = nessun traffico, 1 = 100%)
  trafficMultiplier = 0;

  // Creiamo un segnale interno per gestire la lista dei risultati
  filteredTrips = signal<Trip[]>([]);
  // Per gestire lo stato "nessun risultato trovato"
  hasSearched = signal(false);
  availableCities = signal<string[]>([]);

  // inserimento della KEY di GeoCodingAPI che ci permette di trasformare le vie in coordinate
  private GOOGLE_API_KEY = 'AIzaSyDq2q4u-fP_DVkliNrtczSymGwadn2O7BU';

  nearestStop = signal<string | null>(null);
  geoLoading = signal(false);
  geoError = signal<string | null>(null);

  private http = inject(HttpClient);

  // Etichetta leggibile per lo slide
  get trafficLabel(): string {
  if (this.trafficMultiplier === 0) return 'Nessun traffico';
  if (this.trafficMultiplier <= 0.3) return 'traffico lieve';
  if (this.trafficMultiplier <= 0.6) return 'traffico medio';
  return 'Traffico intenso';
}

 find() {
    this.tripService.getTrips().subscribe(allTrips => {
      
      const filtered = allTrips.filter(t => {
        // 1. Filtro Città
        const hasStart = t.stops?.some(s => s.city.toLowerCase().includes(this.searchPartenza.toLowerCase()));
        const hasEnd = t.stops?.some(s => s.city.toLowerCase().includes(this.searchDestinazione.toLowerCase()));
        
        // 2. Filtro Data (se l'utente l'ha scelta)
        // t.date deve essere in formato YYYY-MM-DD per combaciare con l'input date
        const matchesDate = this.searchDate ? t.date === this.searchDate : true;

        // 3. Filtro Orario (se l'utente l'ha scelto)
        // t.start (HH:mm:ss) >= searchTime (HH:mm)
        const matchesTime = this.searchTime ? t.start >= (this.searchTime + ":00") : true;

        return hasStart && hasEnd && matchesDate && matchesTime;
      });

      // Prendiamo solo le ultime 4 (come indicato nel tuo header)
      const lastFour = filtered.slice(-4);
      this.filteredTrips.set(lastFour);
      this.hasSearched.set(true);

     
    });
  }

  swapCities() {
    const temp = this.searchPartenza;
    this.searchPartenza = this.searchDestinazione;
    this.searchDestinazione = temp;
  }

  

ngOnInit() {

  const ora = new Date();
  this.searchDate = ora.toISOString().split('T')[0]; // Imposta oggi
  this.searchTime = ora.toTimeString().slice(0, 5);  // Imposta ora attuale (HH:mm)
  
  // Carichiamo le città uniche presenti nel database
  this.tripService.getTrips().subscribe(trips => {
    const cities = new Set<string>();
    trips.forEach(t => {
      t.stops?.forEach(s => cities.add(s.city));
    });
    // Ordiniamo alfabeticamente
    this.availableCities.set(Array.from(cities).sort());
  });
}

  // Metodo cella possizione trami il GPS
  Geolocator = {
    getPosition: () => {
      if (!navigator.geolocation){
        this.geoError.set('Geologalizzazione non supporta il browser')
        return;
      }
      this.geoLoading.set(true);
      this.geoError.set(null);
      this.nearestStop.set(null);

      const opzioni = {
        enableHighAccuracy: true,
        timeout: 5000,
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
  const userLat = position.coords.latitude;
  const userLng = position.coords.longitude;

  // Prendi tutte le fermate uniche
  this.tripService.getTrips().subscribe(async trips => {
    const stops: { city: string, address: string }[] = [];
    trips.forEach(t => {
      t.stops?.forEach(s => {
        if (!stops.find(x => x.city === s.city && x.address === s.address)) {
          stops.push({ city: s.city, address: s.address });
        }
      });
    });
    
    // Geocodifica ogni fermata e calcola la distanza 
    let nearest = '';
    let minDist= Infinity;

    for(const stop of stops) {
      const coords = await this.geocodeAddress(`${stop.address}, ${stop.city}`);
      if (!coords) continue;

      const dist = this.haversine(userLat, userLng, coords.lat, coords.lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = `${stop.city} - ${stop.address} (&{Math.round(dist)} m)`;
      }
    }
    this.nearestStop.set(nearest || 'Nessuna fermata trovata');
    this.geoLoading.set(false);

      if (nearest) {
        this.searchPartenza = nearest.split(' - ')[0];
      }
    });
  }

  private async geocodeAddress(address: string): Promise<{lat: number, lng: number} | null> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.GOOGLE_API_KEY}`;
    try {
      const res: any = await this.http.get(url).toPromise();
      if(res.results?.length>0) {
        const loc = res.results[0].geometry.location;
        return {lat: loc.lat, lng: loc.lng};
      }
    }catch (e) {}
    return null;
  }
  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 +
              Math.cos(lat1* Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLng/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  private geoErrorHandler(error: GeolocationPositionError) {
    this.geoLoading.set(false);
    this.geoError.set('Impossibile ottenere la posizione. Controlla i permessi.');
  }
}
