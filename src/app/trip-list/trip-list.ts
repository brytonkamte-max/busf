import { Component, EventEmitter, inject, Input, Output, signal, SimpleChanges } from '@angular/core';
import { Line, Trip } from '../model/entities';
import { BusTripService } from '../bus-trip-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PortalUserService } from '../portal-user-service';
import { BusLineService } from '../bus-line-service';
import qrcode from 'qrcode-generator';

@Component({
  selector: 'app-trip-list',
  imports: [FormsModule, CommonModule],
  templateUrl: './trip-list.html',
  styleUrl: './trip-list.css',
})
export class TripList {
  private tripService = inject(BusTripService);
  private lineService = inject(BusLineService);
  portalUserService = inject(PortalUserService);

  @Input({ required: true }) trip!: Trip;
  @Output() onDeleted = new EventEmitter<number>();

  resolvedLineName = signal<string>('—');
  private allLines: Line[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    console.log(this.portalUserService.loggedUser()?.role);
    if (changes['trip'] && this.trip) {
      this.resolveLineName();
    }
  }

  private resolveLineName(): void {
    this.resolvedLineName.set('—');

    console.log('TRIP IN TRIPLIST:', this.trip);
    console.log('TRIP.LINE:', this.trip?.line);

    // 1. se il nome linea c'è già, uso quello
    if (this.trip?.line?.name) {
      this.resolvedLineName.set(this.trip.line.name);
      return;
    }

    // 2. se ho lineId provo getLineById
    const lineId =
      this.trip?.line?.id ??
      (this.trip as any)?.lineId ??
      (this.trip as any)?.line_id ??
      null;

    if (lineId != null) {
      this.lineService.getLineById(lineId).subscribe({
        next: (line) => {
          this.resolvedLineName.set(line?.name || 'Linea sconosciuta');
        },
        error: (err) => {
          console.error('Errore getLineById:', err);
          this.resolveLineNameFromStops();
        }
      });
      return;
    }

    // 3. se non c'è né line né lineId, provo a ricostruirla dalle fermate
    this.resolveLineNameFromStops();
  }

  private resolveLineNameFromStops(): void {
    this.lineService.getLines().subscribe({
      next: (lines) => {
        this.allLines = lines;

        console.log('LINEE DISPONIBILI IN TRIPLIST:', lines);

        const matchedLine = this.findBestMatchingLine(this.trip, lines);

        if (matchedLine?.name) {
          console.log('LINEA TROVATA PER MATCH FERMATE:', matchedLine);
          this.resolvedLineName.set(matchedLine.name);
        } else {
          console.log('NESSUNA LINEA TROVATA PER QUESTO TRIP');
          this.resolvedLineName.set('Linea sconosciuta');
        }
      },
      error: (err) => {
        console.error('Errore caricamento linee:', err);
        this.resolvedLineName.set('Linea sconosciuta');
      }
    });
  }

  private findBestMatchingLine(trip: Trip, lines: Line[]): Line | null {
    const tripStops = [...(trip.stops || [])];

    if (!tripStops.length || !lines.length) {
      return null;
    }

    let bestLine: Line | null = null;
    let bestScore = 0;

    for (let line of lines) {
      const lineStops = [...(line.stops || [])];
      let score = 0;

      for (let tripStop of tripStops) {
        const match = lineStops.find((lineStop: any) =>
          this.normalizeString(lineStop.city) === this.normalizeString(tripStop.city) &&
          this.normalizeString(lineStop.address) === this.normalizeString(tripStop.address)
        );

        if (match) {
          score++;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestLine = line;
      }
    }

    return bestLine;
  }

  private normalizeString(value: any): string {
    return (value || '').toString().trim().toLowerCase();
  }

  // ── Calcoli ritardo ─────────────────────────────────────
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

  get allStopsSorted() {
    return [...(this.trip.stops || [])].sort((a, b) => a.position - b.position);
  }

  remove(): void {
    this.tripService.deleteTrip(this.trip.id).subscribe(() => {
      this.onDeleted.emit(this.trip.id);
    });
  }

  generateQRSvg(text: string): string {
  // Usa la libreria qrcode-generator (npm install qrcode-generator)
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const cellSize = 5;
  const size = moduleCount * cellSize;

  let cells = '';
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        cells += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${cells}</svg>`;
}

  // ── Stampa biglietto ─────────────────────────────────────
  printTicket(): void {
    const stops = this.allStopsSorted;
    const ticketNumber = `BUS-${this.trip.id}-${Date.now().toString(36).toUpperCase()}`;
    const today = new Date().toLocaleString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'
    });
      const qrData = JSON.stringify({
        id: ticketNumber,
        date:today
 
      });

const qrSvg = this.generateQRSvg(qrData);


    const stopsRows = stops.map(s => {
      const stopTime = s.time != null
        ? this.addMinutes(this.trip.start, s.time)
        : '--:--';
      return `
        <tr>
          <td>${s.position}</td>
          <td>${s.city}</td>
          <td>${s.address || '—'}</td>
          <td class="time-cell">${stopTime}</td>
        </tr>`;
    }).join('');

    const lineName = this.resolvedLineName();
    const dayLabel = this.trip.dayType ?? '—';
    const seasonLabel = this.trip.season === 'SUMMER' ? 'Estivo' : 'Invernale';
    const delayNote = this.delayMinutes > 0
      ? `<div class="delay-banner">⚠️ Ritardo stimato: <strong>+${this.delayMinutes} min</strong> per traffico</div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8"/>
  <title>Biglietto Corsa #${this.trip.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #f4f6f8;
      color: #0f1923;
      padding: 32px 24px;
    }

    .ticket {
      position: relative;
      background: #fff;
      border-radius: 20px;
      overflow: hidden;

      background-image: url('img/tuo-file.png');
      background-repeat: no-repeat;
      background-position: right bottom;
      background-size: 320px;
    }

    .ticket__header {
      background: #003366;
      padding: 24px 28px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .ticket__brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .ticket__logo {
      height: 50px;
      width: auto;
      object-fit: contain;
      display: block;
    }

    .ticket__brand-name {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
    }

    .ticket__brand-name span { color: #00A651; }

    .ticket__number {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .ticket__number-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: rgba(255,255,255,.50);
    }

    .ticket__number-value {
      font-size: 13px;
      font-weight: 700;
      color: rgba(255,255,255,.85);
      font-family: monospace;
      letter-spacing: .06em;
    }
    .ticket__trip-id {
      margin-top: 6px;
      font-size: 11px;
      font-weight: 700;
      color: rgba(255,255,255,.92);
    }

    .route-strip {
      background: #00A651;
      padding: 16px 28px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .route-city {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
      flex: 1;
    }

    .route-city--dest { text-align: right; }

    .route-arrow-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      color: rgba(255,255,255,.70);
      flex-shrink: 0;
    }

    .route-line {
      height: 2px;
      width: 48px;
      background: rgba(255,255,255,.40);
      border-radius: 1px;
    }

    .delay-banner {
      background: #fffbeb;
      border-bottom: 1px solid #fcd34d;
      padding: 10px 28px;
      font-size: 12px;
      color: #92400e;
      font-weight: 600;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      border-bottom: 1px solid #dde3eb;
    }

    .meta-cell {
      padding: 16px 20px;
      border-right: 1px solid #dde3eb;
    }

    .meta-cell:last-child { border-right: none; }

    .meta-cell__label {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .meta-cell__value {
      font-size: 18px;
      font-weight: 800;
      color: #0f1923;
      line-height: 1;
    }

    .meta-cell__value--green { color: #00A651; }
    .meta-cell__value--navy  { color: #003366; }
    .meta-cell__value--small { font-size: 13px; margin-top: 2px; }

    .stops-section {
      padding: 20px 28px 8px;
    }

    .stops-title {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 12px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead th {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .10em;
      text-transform: uppercase;
      color: #6b7280;
      text-align: left;
      padding: 6px 10px;
      border-bottom: 1.5px solid #dde3eb;
    }

    tbody td {
      font-size: 12px;
      font-weight: 500;
      color: #0f1923;
      padding: 9px 10px;
      border-bottom: 1px solid #f0f2f4;
    }

    tbody tr:last-child td { border-bottom: none; }

    tbody tr:first-child td { color: #003366; font-weight: 700; }
    tbody tr:last-child  td { color: #007a3c; font-weight: 700; }

    .time-cell {
      font-weight: 800;
      font-size: 13px;
      font-family: monospace;
      color: #003366;
    }

    .ticket__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 28px;
      border-top: 1.5px dashed #dde3eb;
      margin-top: 8px;
    }

    .ticket__footer-note {
      font-size: 10px;
      color: #6b7280;
      font-weight: 500;
      line-height: 1.5;
    }

    .ticket__footer-date {
      font-size: 11px;
      font-weight: 700;
      color: #003366;
      text-align: right;
    }

    .barcode {
      display: flex;
      justify-content: center;
      padding: 0 28px 24px;
      gap: 2px;
    }

    .barcode__bar {
      background: #0f1923;
      border-radius: 1px;
    }

    @media print {
      body { background: white; padding: 0; }
      .ticket { box-shadow: none; border-radius: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
<div class="ticket">

  <div class="ticket__header">
    <div class="ticket__brand">
      <img class="ticket__logo" src="Logoo.png" alt="logo" />
      <div class="ticket__brand-name">Brianza<span>Bus</span></div>
    </div>

    <div class="ticket__number">
      <div class="ticket__number-label">Biglietto N°</div>
      <div class="ticket__number-value">${ticketNumber}</div>
      <div class="ticket__trip-id">Corsa #${this.trip.id}</div>
    </div>
  </div> 

  <div class="route-strip">
    <div class="route-city">${this.firstStop}</div>
    <div class="route-arrow-wrap">
      <div class="route-line"></div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
      <div class="route-line"></div>
    </div>
    <div class="route-city route-city--dest">${this.lastStop}</div>
  </div>

  ${delayNote}

  <div class="meta-grid">
    <div class="meta-cell">
      <div class="meta-cell__label">Partenza</div>
      <div class="meta-cell__value meta-cell__value--navy">${this.departureTime}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-cell__label">Arrivo stimato</div>
      <div class="meta-cell__value meta-cell__value--green">${this.arrivalTime}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-cell__label">Linea</div>
      <div class="meta-cell__value meta-cell__value--navy meta-cell__value--small">${lineName}</div>
    </div>
    <div class="meta-cell">
      <div class="meta-cell__label">Giorno / Stagione</div>
      <div class="meta-cell__value meta-cell__value--small">${dayLabel} · ${seasonLabel}</div>
    </div>
  </div>

  <div class="stops-section">
    <div class="stops-title">Fermate del percorso</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Città</th>
          <th>Indirizzo</th>
          <th>Orario</th>
        </tr>
      </thead>
      <tbody>${stopsRows}</tbody>
    </table>
  </div>

  <div class="ticket__footer">
    <div class="ticket__footer-note">
      Biglietto valido per la data indicata: ${this.trip.date ?? '—'}.<br/>
      Conservare per tutta la durata del viaggio.
    </div>
    <div class="ticket__footer-date">
      Emesso il ${today}<br/>
      Data corsa: ${this.trip.date ?? '—'}<br/>
      Durata biglietto: 90 min
    </div>
  </div>

  <div class="barcode" style="display:flex; justify-content:center; padding: 0 28px 24px;">
  <div style="background:white; padding:12px; border:1px solid #dde3eb; border-radius:8px; display:inline-block;">
    ${qrSvg}
  </div>
</div>

</div>
<script>window.print(); window.onafterprint = () => window.close();</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=760,height=900');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }
}
