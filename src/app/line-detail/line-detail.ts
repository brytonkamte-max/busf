import { Component, OnInit, signal, computed } from '@angular/core';
import { Line, Stop} from '../model/entities';
import { ActivatedRoute, Router } from '@angular/router';
import { BusLineService } from '../bus-line-service';
import { BusStopService } from '../bus-stop-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-line-detail',
  standalone: true, // Assicurati che sia standalone se non usi i moduli
  imports: [FormsModule, CommonModule],
  templateUrl: './line-detail.html',
  styleUrl: './line-detail.css',
})
export class LineDetail implements OnInit {

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

  // Calcola le opzioni della select basandosi sul numero attuale di fermate
  availablePositions = computed(() => {
    const currentStopsCount = this.stops().length;
    return Array.from({ length: currentStopsCount + 1 }, (_, i) => i + 1);
  });

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
    this.busLineService.getLineById(id).subscribe({
      next: (line) => {
        this.line.set(line);
        // Ordiniamo le fermate per posizione per sicurezza
        const sortedStops = (line.stops ?? []).sort((a, b) => a.position - b.position);
        this.stops.set(sortedStops);
      },
      error: () => this.errorMessage = 'Errore nel caricamento dei dati.'
    });
  }

  addStop(): void {
    const currentLine = this.line();
    const selectedPos = this.newStop.position;

    if (!currentLine || selectedPos === null) return;

    // 1. Validazione
    const isTimeInvalid = this.newStop.time === null || this.newStop.time <= 0;
    const isTextInvalid = !this.newStop.city.trim() || !this.newStop.address.trim();

    if (isTimeInvalid || isTextInvalid) {
      this.errorMessage = 'Compila tutti i campi correttamente. I minuti devono essere > 0.';
      this.successMessage = '';
      return;
    }

    // 2. Chiamata al servizio
    this.busStopService.createStop(currentLine.id, {
      position: selectedPos,
      city: this.newStop.city,
      address: this.newStop.address,
      time: this.newStop.time!
    }).subscribe({
      next: () => {
        // Poiché il backend ha fatto lo shift, la cosa più sicura è
        // ricaricare l'intera linea. Così tutte le posizioni saranno allineate al DB.
        this.loadLine(currentLine.id);

        // Reset del form
        this.newStop = { position: null, city: '', address: '', time: null };
        this.successMessage = 'Fermata inserita con successo!';
        this.errorMessage = '';
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.status === 400
          ? 'Errore: indirizzo già presente.'
          : 'Errore durante il salvataggio.';
        this.successMessage = '';
      }
    });
  }

  deleteStop(stopId: number): void {
    const currentLine = this.line();
    if (!currentLine) return;

    if (confirm('Sei sicuro di voler eliminare questa fermata?')) {
      this.busStopService.deleteStop(stopId).subscribe({
        next: () => {
          // Anche qui ricarichiamo per avere le posizioni ricalcolate (senza buchi)
          this.loadLine(currentLine.id);
          this.successMessage = 'Fermata eliminata e lista aggiornata.';
          this.errorMessage = '';
        },
        error: () => {
          this.errorMessage = 'Errore durante l\'eliminazione.';
          this.successMessage = '';
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/lines']);
  }
}
