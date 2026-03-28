import { Component, OnInit, signal } from '@angular/core';
import { Line, Stop} from '../model/entities';
import { ActivatedRoute, Router } from '@angular/router';
import { BusLineService } from '../bus-line-service';
import { BusStopService } from '../bus-stop-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-line-detail',
  imports: [FormsModule,CommonModule],
  templateUrl: './line-detail.html',
  styleUrl: './line-detail.css',
})
export class LineDetail  implements OnInit {

  line = signal<Line | null>(null);
  stops = signal<Stop[]>([]);
  errorMessage = '';
successMessage = '';

  newStop = {
    position: null as number | null,
    city: '',
    address: '',
    time: null as number | null,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private busLineService: BusLineService,
    private busStopService: BusStopService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadLine(id);
  }

  loadLine(id: number): void {
    this.busLineService.getLineById(id).subscribe((line) => {
      this.line.set(line);
      this.stops.set((line.stops ?? []).sort((a, b) => a.position - b.position));
    });
  }

  addStop(): void {
    const currentLine = this.line();
    if (!currentLine) return;

    // 1. Validazione rigorosa
    // Verifichiamo che i numeri siano presenti e > 0, e che le stringhe non siano vuote
    const isPositionInvalid = this.newStop.position === null || this.newStop.position <= 0;
    const isTimeInvalid = this.newStop.time === null || this.newStop.time <= 0;
    const isTextInvalid = !this.newStop.city.trim() || !this.newStop.address.trim();

    if (isPositionInvalid || isTimeInvalid || isTextInvalid) {
      this.errorMessage = 'Tutti i campi sono obbligatori. Posizione e minuti devono essere maggiori di 0.';
      this.successMessage = '';
      return;
    }

    // 2. Chiamata al servizio
    this.busStopService.createStop(currentLine.id, {
      position: this.newStop.position!, // Usiamo l'operatore ! perché abbiamo appena validato che non è null
      city: this.newStop.city,
      address: this.newStop.address,
      time: this.newStop.time!
    }).subscribe({
      next: (stop) => {
        // Aggiorniamo la lista locale delle fermate
        this.stops.update((list) =>
          [...list, stop].sort((a, b) => a.position - b.position)
        );

        // Reset del form
        this.newStop = { position: null, city: '', address: '', time: null };

        this.successMessage = 'Fermata inserita correttamente!';
        this.errorMessage = '';
      },
      error: (err) => {
        console.error('Errore durante il salvataggio:', err);

        if (err.status === 400) {
          this.errorMessage = 'Errore: la posizione o l\'indirizzo sono già presenti per questa linea.';
        } else if (err.status === 403) {
          this.errorMessage = 'Errore 403: Non hai i permessi per aggiungere fermate.';
        } else {
          this.errorMessage = 'Si è verificato un errore imprevisto.';
        }

        this.successMessage = '';
      }
    });
  }

  deleteStop(stopId: number): void {
  const currentLine = this.line();
  if (!currentLine) return;

  this.busStopService.deleteStop(stopId).subscribe(() => {
    this.loadLine(currentLine.id);
  });
}

  goBack(): void {
    this.router.navigate(['/lines']);
  }

}
