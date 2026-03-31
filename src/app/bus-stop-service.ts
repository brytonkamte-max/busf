import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Stop } from './model/entities';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BusStopService {


 // private apiLinesUrl = 'http://192.168.0.100:8080/api/lines';
  private apiStopsUrl = 'http://localhost:8080/api/stops';

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
