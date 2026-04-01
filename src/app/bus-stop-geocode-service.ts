import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BusStopGeocodeService {
  private nominatimUrl = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) { }

  getCoordinates(address: string, city: string): Observable<{ lat: number; lng: number } | null> {
    // Pulizia stringhe per evitare caratteri speciali che rompono l'URL
    const cleanAddress = address.trim();
    const cleanCity = city.trim();
    const searchQuery = `${cleanAddress}, ${cleanCity}, Italia`;

    // Nominatim richiede parametri specifici per non bloccare le richieste (CORS)
    const params = new HttpParams()
      .set('format', 'json')
      .set('q', searchQuery)
      .set('limit', '1')
      .set('addressdetails', '1')
      .set('email', 'tuamail@esempio.com'); // Opzionale, ma aiuta a evitare blocchi

    return this.http.get<any[]>(this.nominatimUrl, { params }).pipe(
      map(results => {
        if (results && results.length > 0) {
          return {
            lat: parseFloat(results[0].lat),
            lng: parseFloat(results[0].lon) // Nota: Nominatim usa 'lon', non 'lng'
          };
        }
        return null;
      }),
      catchError(error => {
        // Se vedi ancora 403, è perché Nominatim vuole un User-Agent (difficile da settare lato browser)
        // o hai superato il limite di 1 richiesta al secondo.
        console.error('Errore Geocodifica:', error);
        return of(null);
      })
    );
  }
}