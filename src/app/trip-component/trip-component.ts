import { Component, inject, OnInit, signal } from '@angular/core';
import { BusLineService } from '../bus-line-service';
import { BusTripService } from '../bus-trip-service';
import { Line, Trip } from '../model/entities';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TripList } from "../trip-list/trip-list";
import { dateTimestampProvider } from 'rxjs/internal/scheduler/dateTimestampProvider';

@Component({
  selector: 'app-trip-component',
  imports: [FormsModule, CommonModule, TripList],
  templateUrl: './trip-component.html',
  styleUrl: './trip-component.css',
})
export class TripComponent implements OnInit {
  private lineService = inject(BusLineService);
  private tripService = inject(BusTripService);
  
  lines = signal<Line[]>([]);
  trips = signal<Trip[]>([]);

  // AGGIUNGI QUESTE RIGHE: Dichiarazione messaggi
  errorMessage: string | null = null;
  successMessage: string | null = null;
  successMessage2: string | null = null;


  newLineName: string = '';

 newTrip = {
  start: '',
  daytype: 'FERIALE', // Era FERIAL, ora è FERIALE
  season: 'SUMMER',  // Verifica se il backend vuole WINTER o INVERNO
  line: null as Line | null,
  date: '' // Aggiunta data se necessaria
 
};

  ngOnInit(): void {
    this.loadData();
  }

 loadData(): void {
  this.lineService.getLines().subscribe(linesData => {
    this.lines.set(linesData);

    this.tripService.getTrips().subscribe(tripsData => {
      
      const enrichedTrips: Trip[] = tripsData.map(trip => {
        // 1. Cerchiamo la linea
      const fullLine = linesData.find(l => l.id === trip.line?.id || (trip as any).lineId === l.id);
        
        // 2. Se non esiste (fallback), ne creiamo una fittizia o usiamo quella parziale
        // L'operatore 'as Line' rassicura TypeScript
        return {
          ...trip,
          line: fullLine || (trip.line as Line) 
        };
      });

      this.trips.set(enrichedTrips);
    });
  });
}

 addTrip(): void {
  this.errorMessage = null;
  this.successMessage = null;

  const selectedLine = this.newTrip.line;

  if (!this.newTrip.start || !selectedLine) {
    this.errorMessage = "Seleziona linea e orario";
    return;
  }

  const tripPayload = {
    start: this.newTrip.start,    
    dayType: this.newTrip.daytype, // Invia al backend (CamelCase)
    season: this.newTrip.season,
    lineId: selectedLine.id ,

    // Trasforma la data in stringa 'YYYY-MM-DD'
  date: new Date(this.newTrip.date).toISOString().split('T')[0]
};
    
 

  this.tripService.createTrip(tripPayload).subscribe({
   next: (savedTripFromBackend) => {
  const enrichedTrip: Trip = {
    ...savedTripFromBackend,
    // Se il server risponde correttamente, dayType è già dentro savedTripFromBackend
    line: selectedLine 
  };

  this.trips.update(currentList => [...currentList, enrichedTrip]);
  this.successMessage = "Trip salvato con successo!";
  this.resetForm();
},
    error: (err) => {
      console.error("Errore:", err);
      this.errorMessage = "Errore nel salvataggio";
    }
  });
}

addLine(): void {
    this.errorMessage = null;
  this.successMessage2 = null;
  // Se il nome è vuoto, non fare nulla
  if (!this.newLineName.trim()) return;

  this.lineService.createLine(this.newLineName).subscribe({
    next: () => {
      // 1. Pulisce il campo input
      this.newLineName = ''; 
      // 2. Messaggio di successo
      this.successMessage2 = "Linea creata con successo!";
      // 3. RICARICA i dati per aggiornare la tendina (select)
      this.loadData();
    },
    error: (err) => {
      console.error("Errore creazione linea:", err);
      this.errorMessage = "Impossibile creare la linea";
    }
  });
}

removeLocally(id: number): void {
  // .filter crea un nuovo array senza l'elemento rimosso. 
  // Angular vedrà il cambiamento e grazie al 'track t.id' toglierà la riga giusta.
  this.trips.update(current => current.filter(trip => trip.id !== id));
}

  private resetForm() {
  this.newTrip = { 
    start: '', 
    daytype: 'FERIALE', 
    season: 'SUMMER', 
    line: null ,
    date: '' // Aggiunta data se necessaria
  };
}
}
