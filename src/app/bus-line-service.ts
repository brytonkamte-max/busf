import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Line, Stop } from './model/entities';
import { map } from 'rxjs/internal/operators/map';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BusLineService {

 private apiLinesUrl = 'http://192.168.0.100:8080/api/lines';
  
 
  constructor(private http: HttpClient) {}
 
  // ── Lines ──────────────────────────────────────────────
 
  getLines(): Observable<Line[]> {
    return this.http.get<Line[]>(this.apiLinesUrl);
  }
 
  getLineById(id: number): Observable<Line> {
    return this.http.get<Line>(`${this.apiLinesUrl}/${id}`);
  }
 
  createLine(name: string): Observable<Line> {
    return this.http.post<Line>(this.apiLinesUrl, { name });
  }
 
  updateLine(id: number, name: string): Observable<Line> {
    return this.http.put<Line>(`${this.apiLinesUrl}/${id}`, { name });
  }
 
  deleteLine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiLinesUrl}/${id}`);
  }
 
  // ── Stops ──────────────────────────────────────────────
 
  getStopsByLine(lineId: number): Observable<Stop[]> {
    return this.http.get<Stop[]>(`${this.apiLinesUrl}/${lineId}/stops`);
  }
 /*
  getStopById(id: number): Observable<Stop> {
    return this.http.get<Stop>(`${this.apiStopsUrl}/${id}`);
  }
 
  /*createStop(lineId: number, stop: Omit<Stop, 'id' | 'lineId'>): Observable<Stop> {
    return this.http.post<Stop>(`${this.apiLinesUrl}/${lineId}/stops`, stop);
  }
 */

searchLines(term: string) {
  return this.http.get<Line[]>(
    `${this.apiLinesUrl}/search?query=${encodeURIComponent(term)}`
  );
}
  

 
}