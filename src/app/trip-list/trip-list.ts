import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { Trip } from '../model/entities';
import { BusLineService } from '../bus-line-service';
import { BusTripService } from '../bus-trip-service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TripComponent } from '../trip-component/trip-component';
import { PortalUserService } from '../portal-user-service';

@Component({
  selector: 'app-trip-list',
  imports: [FormsModule,CommonModule],
  templateUrl: './trip-list.html',
  styleUrl: './trip-list.css',
})
export class TripList {
  
  private tripService = inject(BusTripService);
  portalUserService = inject(PortalUserService);
  @Input({ required: true }) trip!: Trip;
  @Output() onDeleted = new EventEmitter<number>();

  // Calcola i minuti di ritardo (es. 0.5 traffico = 30 min)
  get delayMinutes(): number {
    return Math.round((this.trip.trafficMultiplier || 0) * 60);
  }

  // Funzione di utilità per sommare minuti a "HH:mm"
  public addMinutes(time: string, mins: number): string {
    if (!time) return '--:--';
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m + mins);
    return d.toTimeString().slice(0, 5);
  }

  // Partenza: SEMPRE PUNTUALE (non aggiungiamo delayMinutes qui)
  get departureTime(): string {
    return this.trip.start ? this.trip.start.slice(0, 5) : '--:--';
  }

  // Arrivo: Sommiamo tempo di percorrenza dell'ultima fermata + RITARDO traffico
  get arrivalTime(): string {
    const stops = this.trip.stops || [];
    if (stops.length === 0) return '--:--';
    
    const lastStop = [...stops].sort((a, b) => a.position - b.position).pop();
    const totalMinutesToAdd = (lastStop?.time || 0) + this.delayMinutes;
    
    return this.addMinutes(this.trip.start, totalMinutesToAdd);
  }

  get firstStop(): string {
    if (!this.trip.stops?.length) return 'N/A';
    return [...this.trip.stops].sort((a, b) => a.position - b.position)[0].city;
  }

  get lastStop(): string {
    if (!this.trip.stops?.length) return 'N/A';
    const sorted = [...this.trip.stops].sort((a, b) => a.position - b.position);
    return sorted[sorted.length - 1].city;
  }

  remove() {
    this.tripService.deleteTrip(this.trip.id).subscribe(() => {
      this.onDeleted.emit(this.trip.id);
    });
  }



}
