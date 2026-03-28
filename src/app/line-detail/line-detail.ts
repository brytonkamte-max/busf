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

  if (!this.newStop.position || !this.newStop.city || !this.newStop.address) return;

  this.busStopService.createStop(currentLine.id, {
    position: this.newStop.position,
    city: this.newStop.city,
    address: this.newStop.address,
    time: this.newStop.time
  }).subscribe({
    next: (stop) => {
      this.stops.update((list) =>
        [...list, stop].sort((a, b) => a.position - b.position)
      );

      this.newStop = { position: null, city: '', address: '', time: null };

      this.successMessage = 'Fermata inserita correttamente!';
      this.errorMessage = '';
    },

    error: (err) => {
      console.log(err);

      // messaggio personalizzato
      if (err.status === 400) {
        this.errorMessage = 'Errore: posizione o indirizzo già esistente!';
      } else {
        this.errorMessage = 'Errore durante l\'inserimento della fermata.';
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
