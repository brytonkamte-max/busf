import { inject, Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip } from './model/entities';

@Injectable({
  providedIn: 'root',
})
export class BusTripService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/trips';

  // Ottiene i trip filtrati per la linea specifica
  getTripsByLine(lineId: number) {
    return this.http.get<Trip[]>(`${this.apiUrl}?line.id=${lineId}`);
  }

  // Questo è il metodo che mancava
  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.apiUrl);
  }

  createTrip(trip: any): Observable<Trip> {
  return this.http.post<Trip>(this.apiUrl, trip);
}

  deleteTrip(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  
}
