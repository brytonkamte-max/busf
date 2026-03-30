import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusTripService } from '../bus-trip-service';
import { Trip } from '../model/entities';
import { TripList } from '../trip-list/trip-list';
import { last } from 'rxjs';

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


}
