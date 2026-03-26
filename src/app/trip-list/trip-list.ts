import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { Trip } from '../model/entities';
import { BusLineService } from '../bus-line-service';
import { BusTripService } from '../bus-trip-service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TripComponent } from '../trip-component/trip-component';

@Component({
  selector: 'app-trip-list',
  imports: [FormsModule,CommonModule],
  templateUrl: './trip-list.html',
  styleUrl: './trip-list.css',
})
export class TripList {
// Iniettiamo il servizio qui dentro
  private tripService = inject(BusTripService);

  @Input({ required: true }) trip!: Trip;
  
  // Notifichiamo comunque il padre che l'ID è stato eliminato con successo
  @Output() onDeleted = new EventEmitter<number>();

 get firstStop(): string {
  // Ora leggiamo direttamente da this.trip.stops come da tuo JSON
  const stops = this.trip.stops; 
  if (stops && stops.length > 0) {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    return `${sorted[0].city} - ${sorted[0].address}`;
  }
  return 'Partenza non trovata';
}

get lastStop(): string {
  const stops = this.trip.stops;
  if (stops && stops.length > 0) {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    return `${sorted[sorted.length - 1].city} - ${sorted[sorted.length - 1].address}`;
  }
  return 'Arrivo non trovato';
}

  // Funzione di cancellazione "Diretta"
  remove() {
  // 1. Chiamata immediata al servizio usando l'ID univoco di QUESTO trip
  this.tripService.deleteTrip(this.trip.id).subscribe({
    next: () => {
      // 2. Notifichiamo il padre passandogli l'ID esatto da rimuovere dalla vista
      this.onDeleted.emit(this.trip.id);
    },
    error: (err) => console.error("Errore server:", err)
  });
}
}
