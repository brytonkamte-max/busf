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


searchLines(): void {
  if (!this.search.trim()) {
    this.loadLines();
    return;
  }


  this.busLineService.searchLines(this.search).subscribe((lines) => {
    this.lines.set(lines);
  });
}
}

