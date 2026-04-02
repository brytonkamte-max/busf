import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ticket, Trip } from '../model/entities';

import { BusTripService } from '../bus-trip-service';
import { PortalUserService } from '../portal-user-service';
import qrcode from 'qrcode-generator';
import { TicketService } from '../ticket-service';

@Component({
  selector: 'app-ticket-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-component.html',
  styleUrl: './ticket-component.css',
})
export class TicketComponent implements OnInit {

  private ticketService  = inject(TicketService);
  private tripService    = inject(BusTripService);
  public  portalUser     = inject(PortalUserService);

  // ── State ──────────────────────────────────────────────
  tickets  = signal<Ticket[]>([]);
  trips    = signal<Trip[]>([]);
  loading  = signal(false);
  error    = signal<string | null>(null);

  // ── Add form ───────────────────────────────────────────
  showForm     = signal(false);
  formTripId   = signal<number | null>(null);
  formDate     = signal('');
  formLoading  = signal(false);
  formError    = signal<string | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  // ── Data loading ───────────────────────────────────────
  public loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Carica sempre le corse (servono per il form e per la stampa)
    this.tripService.getTrips().subscribe({
      next: (trips) => {
        this.trips.set(trips);
        this.loadTickets();
      },
      error: () => {
        this.error.set('Errore nel caricamento delle corse.');
        this.loading.set(false);
      }
    });
  }

  private loadTickets(): void {
    const user = this.portalUser.loggedUser();

    // ADMIN vede tutti i ticket; BIGLIETTAIO vede solo i propri
    const obs$ = this.portalUser.isAdmin()
      ? this.ticketService.getAll()
      : this.ticketService.getByUser(user!.id!);

    obs$.subscribe({
      next:  (t) => { this.tickets.set(t); this.loading.set(false); },
      error: ()  => { this.error.set('Errore nel caricamento dei biglietti.'); this.loading.set(false); }
    });
  }

  // ── Form helpers ───────────────────────────────────────
  openForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.formDate.set(today);
    this.formTripId.set(null);
    this.formError.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  submitTicket(): void {
    const user   = this.portalUser.loggedUser();
    const tripId = this.formTripId();
    const date   = this.formDate();

    if (!tripId || !date) {
      this.formError.set('Seleziona una corsa e una data.');
      return;
    }
    if (!user?.id) {
      this.formError.set('Utente non autenticato.');
      return;
    }

    this.formLoading.set(true);
    this.formError.set(null);

    this.ticketService.create({ tripId, userId: user.id, date }).subscribe({
      next: (newTicket) => {
        this.tickets.update(list => [newTicket, ...list]);
        this.formLoading.set(false);
        this.showForm.set(false);
      },
      error: () => {
        this.formError.set('Errore durante la creazione del biglietto.');
        this.formLoading.set(false);
      }
    });
  }

  // ── Delete ─────────────────────────────────────────────
  removeTicket(id: number): void {
    this.ticketService.delete(id).subscribe({
      next: () => this.tickets.update(list => list.filter(t => t.id !== id)),
      error: () => this.error.set('Errore durante l\'eliminazione.')
    });
  }

  // ── Trip helpers ───────────────────────────────────────
  getTripById(id: number): Trip | undefined {
    return this.trips().find(t => t.id === id);
  }

  getTripLabel(tripId: number): string {
    const trip = this.getTripById(tripId);
    if (!trip) return `Corsa #${tripId}`;
    const dep = trip.start?.slice(0, 5) ?? '--:--';
    const first = this.getFirstCity(trip);
    const last  = this.getLastCity(trip);
    return `#${tripId} · ${dep} · ${first} → ${last}`;
  }

  private sortedStops(trip: Trip) {
    return [...(trip.stops || [])].sort((a, b) => a.position - b.position);
  }

  getFirstCity(trip: Trip): string {
    return this.sortedStops(trip)[0]?.city ?? 'N/A';
  }

  getLastCity(trip: Trip): string {
    const s = this.sortedStops(trip);
    return s[s.length - 1]?.city ?? 'N/A';
  }

  addMinutes(time: string, mins: number): string {
    if (!time) return '--:--';
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m + mins);
    return d.toTimeString().slice(0, 5);
  }

  getArrival(trip: Trip): string {
    const last  = this.sortedStops(trip).pop();
    const delay = Math.round((trip.trafficMultiplier || 0) * 60);
    return this.addMinutes(trip.start, (last?.time || 0) + delay);
  }

  // ── QR generator ─────────────────────────────────────
  private generateQRSvg(text: string): string {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const c = 5;
    let cells = '';
    for (let r = 0; r < n; r++)
      for (let k = 0; k < n; k++)
        if (qr.isDark(r, k))
          cells += `<rect x="${k*c}" y="${r*c}" width="${c}" height="${c}" fill="#000"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${n*c}" height="${n*c}" viewBox="0 0 ${n*c} ${n*c}">${cells}</svg>`;
  }

  // ── Print ──────────────────────────────────────────────
  printTicket(ticket: Ticket): void {
    const trip = this.getTripById(ticket.tripId);
    if (!trip) { alert('Dati della corsa non disponibili.'); return; }

    const stops      = this.sortedStops(trip);
    const ticketNum  = `BUS-${ticket.id}-${Date.now().toString(36).toUpperCase()}`;
    const emitDate   = new Date().toLocaleString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const delay      = Math.round((trip.trafficMultiplier || 0) * 60);
    const lineName   = trip.line?.name ?? '—';
    const dayLabel   = trip.dayType ?? '—';
    const seasonLbl  = trip.season === 'SUMMER' ? 'Estivo' : 'Invernale';
    const dep        = trip.start?.slice(0, 5) ?? '--:--';
    const arr        = this.getArrival(trip);
    const first      = this.getFirstCity(trip);
    const last       = this.getLastCity(trip);

    const delayBanner = delay > 0
      ? `<div class="delay-banner">⚠️ Ritardo stimato: <strong>+${delay} min</strong> per traffico</div>`
      : '';

    const stopsRows = stops.map(s => {
      const t = s.time != null ? this.addMinutes(trip.start, s.time) : '--:--';
      return `<tr><td>${s.position}</td><td>${s.city}</td><td>${s.address || '—'}</td><td class="tc">${t}</td></tr>`;
    }).join('');

    const qrSvg = this.generateQRSvg(JSON.stringify({ id: ticketNum, emesso: emitDate }));

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"/>
<title>Biglietto ${ticketNum}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',sans-serif;background:#f4f6f8;color:#0f1923;padding:32px 24px}
.ticket{max-width:680px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.12)}
/* header */
.hd{background:#003366;padding:22px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.brand{display:flex;align-items:center;gap:10px}
.brand-logo{height:44px;width:auto;object-fit:contain}
.brand-name{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.02em}
.brand-name span{color:#00A651}
.num-block{text-align:right}
.num-label{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.45)}
.num-value{font-size:13px;font-weight:700;color:rgba(255,255,255,.85);font-family:monospace;letter-spacing:.06em}
.trip-id{margin-top:4px;font-size:11px;font-weight:700;color:rgba(255,255,255,.85)}
/* route */
.route{background:#00A651;padding:16px 28px;display:flex;align-items:center;gap:12px}
.rcity{font-size:20px;font-weight:800;color:#fff;letter-spacing:-.02em;flex:1}
.rcity-r{text-align:right}
.rarr{display:flex;align-items:center;gap:6px;color:rgba(255,255,255,.6);flex-shrink:0}
.rline{height:2px;width:44px;background:rgba(255,255,255,.35);border-radius:1px}
/* delay */
.delay-banner{background:#fffbeb;border-bottom:1px solid #fcd34d;padding:9px 28px;font-size:12px;color:#92400e;font-weight:600}
/* meta grid */
.mg{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #dde3eb}
.mc{padding:14px 18px;border-right:1px solid #dde3eb}
.mc:last-child{border-right:none}
.mc-l{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#6b7280;margin-bottom:4px}
.mc-v{font-size:18px;font-weight:800;color:#0f1923;line-height:1}
.mc-v.green{color:#00A651}.mc-v.navy{color:#003366}.mc-v.sm{font-size:13px;margin-top:2px}
/* stops */
.sp{padding:18px 28px 8px}
.sp-title{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#6b7280;margin-bottom:10px}
table{width:100%;border-collapse:collapse}
thead th{font-size:9px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#6b7280;text-align:left;padding:5px 10px;border-bottom:1.5px solid #dde3eb}
tbody td{font-size:12px;font-weight:500;color:#0f1923;padding:8px 10px;border-bottom:1px solid #f0f2f4}
tbody tr:last-child td{border-bottom:none}
tbody tr:first-child td{color:#003366;font-weight:700}
tbody tr:last-child td{color:#007a3c;font-weight:700}
.tc{font-weight:800;font-size:13px;font-family:monospace;color:#003366}
/* footer */
.ft{display:flex;align-items:center;justify-content:space-between;padding:14px 28px;border-top:1.5px dashed #dde3eb;margin-top:8px}
.ft-note{font-size:10px;color:#6b7280;font-weight:500;line-height:1.55}
.ft-date{font-size:11px;font-weight:700;color:#003366;text-align:right;line-height:1.6}
/* qr */
.qr-wrap{display:flex;justify-content:center;padding:4px 0 22px}
.qr-box{background:#fff;padding:10px;border:1px solid #dde3eb;border-radius:8px;display:inline-block}
@media print{body{background:#fff;padding:0}.ticket{box-shadow:none;border-radius:0;max-width:100%}}
</style>
</head>
<body>
<div class="ticket">
  <div class="hd">
    <div class="brand">
      <img class="brand-logo" src="Logoo.png" alt="logo"/>
      <div class="brand-name">Brianza<span>Bus</span></div>
    </div>
    <div class="num-block">
      <div class="num-label">Biglietto N°</div>
      <div class="num-value">${ticketNum}</div>
      <div class="trip-id">Corsa #${trip.id} · Ticket #${ticket.id}</div>
    </div>
  </div>

  <div class="route">
    <div class="rcity">${first}</div>
    <div class="rarr">
      <div class="rline"></div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      <div class="rline"></div>
    </div>
    <div class="rcity rcity-r">${last}</div>
  </div>

  ${delayBanner}

  <div class="mg">
    <div class="mc"><div class="mc-l">Partenza</div><div class="mc-v navy">${dep}</div></div>
    <div class="mc"><div class="mc-l">Arrivo stimato</div><div class="mc-v green">${arr}</div></div>
    <div class="mc"><div class="mc-l">Linea</div><div class="mc-v navy sm">${lineName}</div></div>
    <div class="mc"><div class="mc-l">Giorno / Stagione</div><div class="mc-v sm">${dayLabel} · ${seasonLbl}</div></div>
  </div>

  <div class="sp">
    <div class="sp-title">Fermate del percorso</div>
    <table>
      <thead><tr><th>#</th><th>Città</th><th>Indirizzo</th><th>Orario</th></tr></thead>
      <tbody>${stopsRows}</tbody>
    </table>
  </div>

  <div class="ft">
    <div class="ft-note">Biglietto valido per la data indicata: ${ticket.date}.<br/>Conservare per tutta la durata del viaggio.</div>
    <div class="ft-date">Emesso il ${emitDate}<br/>Data corsa: ${ticket.date}<br/>Durata: 90 min</div>
  </div>

  <div class="qr-wrap"><div class="qr-box">${qrSvg}</div></div>
</div>
<script>window.print();window.onafterprint=()=>window.close();</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=760,height=920');
    if (win) { win.document.write(html); win.document.close(); }
  }
}