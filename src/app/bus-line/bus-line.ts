import { Component, effect, OnInit,signal } from '@angular/core';
import { Line, Stop } from '../model/entities';
import { BusLineService } from '../bus-line-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BusStopService } from '../bus-stop-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bus-line',
  imports: [FormsModule,CommonModule],
  templateUrl: './bus-line.html',
  styleUrl: './bus-line.css',
})
export class BusLine implements OnInit {
  lines = signal<Line[]>([]);
  newLineName = '';
  search = '';

  constructor(
    private busLineService: BusLineService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLines();
  }

  loadLines(): void {
    this.busLineService.getLines().subscribe((lines) => {
      this.lines.set(lines);
    });
  }

  getFirstCity(line: Line): string {
  if (!line.stops || line.stops.length === 0) return 'Origine non definita';
  return [...line.stops].sort((a, b) => a.position - b.position)[0].city;
}

getLastCity(line: Line): string {
  if (!line.stops || line.stops.length === 0) return 'Destinazione non definita';
  const sorted = [...line.stops].sort((a, b) => a.position - b.position);
  return sorted[sorted.length - 1].city;
}


  openLine(line: Line): void {
    this.router.navigate(['/lines', line.id]);
  }

  addLine(): void {
    if (!this.newLineName.trim()) return;


    this.busLineService.createLine(this.newLineName).subscribe(() => {
      this.newLineName = '';
      this.loadLines();
    });
  }
// modificare questo metodo con cercare per indirizzo.
  searchLines(): void {
    if (!this.search.trim()) {
      this.loadLines();
      return;
    }

    this.busLineService.searchLines(this.search).subscribe((lines) => {
      this.lines.set(lines);
    });
  }

  deleteLine(id: number): void {
    if (confirm('Sei sicuro di voler eliminare questa linea e tutte le sue fermate?')) {
      this.busLineService.deleteLine(id).subscribe({
        next: () => {
          // Aggiorniamo il signal delle linee rimuovendo quella eliminata
          this.lines.update(currentLines => currentLines.filter(l => l.id !== id));
          // Se hai dei messaggi di successo:
          // this.successMessage = 'Linea eliminata correttamente';
        },
        error: (err) => {
          console.error(err);
          // Gestione errore 403 se non hai aggiornato SecurityConfig
          if(err.status === 403) {
            alert("Non hai i permessi per eliminare linee.");
          }
        }
      });
    }
  }
}

