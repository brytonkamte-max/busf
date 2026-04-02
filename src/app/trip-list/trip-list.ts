import { Component, EventEmitter, inject, Input, Output, signal, SimpleChanges } from '@angular/core';
import { Line, Trip } from '../model/entities';
import { BusTripService } from '../bus-trip-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PortalUserService } from '../portal-user-service';
import { BusLineService } from '../bus-line-service';

@Component({
  selector: 'app-trip-list',
  imports: [FormsModule, CommonModule],
  templateUrl: './trip-list.html',
  styleUrl: './trip-list.css',
})
export class TripList {

  private tripService = inject(BusTripService);
  private lineService = inject(BusLineService);
  portalUserService   = inject(PortalUserService);

  @Input({ required: true }) trip!: Trip;
  @Output() onDeleted = new EventEmitter<number>();

  resolvedLineName = signal<string>('—');
  private allLines: Line[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trip'] && this.trip) {
      this.resolveLineName();
    }
  }

  private resolveLineName(): void {
    this.resolvedLineName.set('—');

    if (this.trip?.line?.name) {
      this.resolvedLineName.set(this.trip.line.name);
      return;
    }

    const lineId =
      this.trip?.line?.id ??
      (this.trip as any)?.lineId ??
      (this.trip as any)?.line_id ??
      null;

    if (lineId != null) {
      this.lineService.getLineById(lineId).subscribe({
        next:  (line) => this.resolvedLineName.set(line?.name || 'Linea sconosciuta'),
        error: ()     => this.resolveLineNameFromStops()
      });
      return;
    }

    this.resolveLineNameFromStops();
  }

  private resolveLineNameFromStops(): void {
    this.lineService.getLines().subscribe({
      next: (lines) => {
        this.allLines = lines;
        const matched = this.findBestMatchingLine(this.trip, lines);
        this.resolvedLineName.set(matched?.name ?? 'Linea sconosciuta');
      },
      error: () => this.resolvedLineName.set('Linea sconosciuta')
    });
  }

  private findBestMatchingLine(trip: Trip, lines: Line[]): Line | null {
    const tripStops = [...(trip.stops || [])];
    if (!tripStops.length || !lines.length) return null;

    let bestLine: Line | null = null;
    let bestScore = 0;

    for (const line of lines) {
      const lineStops = [...(line.stops || [])];
      let score = 0;
      for (const ts of tripStops) {
        if (lineStops.find(ls =>
          this.normalize(ls.city) === this.normalize(ts.city) &&
          this.normalize(ls.address) === this.normalize(ts.address)
        )) score++;
      }
      if (score > bestScore) { bestScore = score; bestLine = line; }
    }
    return bestLine;
  }

  private normalize(v: any): string {
    return (v || '').toString().trim().toLowerCase();
  }

  // ── Calcoli orari ────────────────────────────────────────
  get delayMinutes(): number {
    return Math.round((this.trip.trafficMultiplier || 0) * 60);
  }

  public addMinutes(time: string, mins: number): string {
    if (!time) return '--:--';
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m + mins);
    return d.toTimeString().slice(0, 5);
  }

  get departureTime(): string {
    return this.trip.start ? this.trip.start.slice(0, 5) : '--:--';
  }

  get arrivalTime(): string {
    const stops = this.trip.stops || [];
    if (!stops.length) return '--:--';
    const last = [...stops].sort((a, b) => a.position - b.position).pop();
    return this.addMinutes(this.trip.start, (last?.time || 0) + this.delayMinutes);
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

  // ── Delete ───────────────────────────────────────────────
  remove(): void {
    this.tripService.deleteTrip(this.trip.id).subscribe(() => {
      this.onDeleted.emit(this.trip.id);
    });
  }
}