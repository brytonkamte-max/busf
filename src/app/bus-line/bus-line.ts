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

