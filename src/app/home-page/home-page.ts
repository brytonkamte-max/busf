import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BusLineService } from '../bus-line-service'; // Import corretto
import { Line } from '../model/entities';

@Component({
  selector: 'app-home-page',
  standalone: true, // Assicurati che sia standalone se usi imports
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements OnInit {
  // Valori visualizzati (iniziano a 0 per l'animazione)
  activeLinesCount: number = 0;
  totalStopsCount: number = 0;
  driversCount: number = 0;

  constructor(
    private busLineService: BusLineService, // CamelCase per l'istanza
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDataAndAnimate();
  }

  private loadDataAndAnimate() {
    // Chiamiamo il service una sola volta
    this.busLineService.getLines().subscribe({
      next: (allLines: Line[]) => {
        // 1. Calcoliamo i target finali
        const targetLines = allLines.length;
        const targetStops = allLines.reduce((acc: number, line: Line) => {
          return acc + (line.stops ? line.stops.length : 0);
        }, 0);
        const targetDrivers = targetLines * 2; // Logica: 2 autisti per linea

        // 2. Facciamo partire le animazioni verso i target calcolati
        this.animateValue('activeLinesCount', targetLines, 1200);
        this.animateValue('totalStopsCount', targetStops, 1800);
        this.animateValue('driversCount', targetDrivers, 1200);
      },
      error: (err) => {
        console.error("Errore nel caricamento dati dashboard", err);
      }
    });
  }

  // Funzione per l'animazione fluida dei numeri
  animateValue(prop: 'activeLinesCount' | 'totalStopsCount' | 'driversCount', target: number, duration: number) {
    if (target === 0) return;

    const startTime = performance.now();

    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Calcolo del valore intermedio
      this[prop] = Math.floor(progress * target);

      // Forza il refresh del template
      this.cdr.detectChanges();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        this[prop] = target;
        this.cdr.detectChanges();
      }
    };

    requestAnimationFrame(update);
  }
}
