import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusTripService } from '../bus-trip-service';
import { Trip } from '../model/entities';
import { TripList } from '../trip-list/trip-list';

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

  // Creiamo un segnale interno per gestire la lista dei risultati
  filteredTrips = signal<Trip[]>([]);
  // Per gestire lo stato "nessun risultato trovato"
  hasSearched = signal(false);

  find() {
    this.tripService.getTrips().subscribe(allTrips => {
      const now = new Date();
      const limit = new Date(now.getTime() + 60 * 60 * 1000);
      const limitStr = limit.toTimeString().split(' ')[0];

      const filtered = allTrips.filter(t => {
        const hasStart = t.stops?.some(s => s.city.toLowerCase().includes(this.searchPartenza.toLowerCase()));
        const hasEnd = t.stops?.some(s => s.city.toLowerCase().includes(this.searchDestinazione.toLowerCase()));
        const isAfter = t.start >= limitStr;
        return hasStart && hasEnd && isAfter;
      });

      // Aggiorniamo i segnali interni invece di emettere verso il padre
      this.filteredTrips.set(filtered);
      this.hasSearched.set(true);
    });
  }

  availableCities = signal<string[]>([]);

ngOnInit() {
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
