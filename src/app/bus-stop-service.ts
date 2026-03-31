import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Stop } from './model/entities';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BusStopService {


  private apiStopsUrl = 'https://busb-production.up.railway.app/api/stops';

  constructor(private http: HttpClient) {}


  getStops(): Observable<Stop[]> {
    return this.http.get<Stop[]>(this.apiStopsUrl);
  }
  
createStop(
  lineId: number,
  stop: Omit<Stop, 'id' | 'lineId'>
): Observable<Stop> {
  return this.http.post<Stop>(this.apiStopsUrl, {
    ...stop,
    lineId: lineId
  });
}


updateStop(id: number, stop: Partial<Omit<Stop, 'id' | 'lineId'>>): Observable<Stop> {
    return this.http.put<Stop>(`${this.apiStopsUrl}/${id}`, stop);
  }
 
  deleteStop(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiStopsUrl}/${id}`);
  }
  
}
