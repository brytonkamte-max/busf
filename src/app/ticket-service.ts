import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Ticket } from './model/entities';


@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private apiTicketsUrl = 'http://localhost:8080/api/tickets';
  
 
  constructor(private http: HttpClient) {}
 
  
  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiTicketsUrl);
  }
  postTickets(ticket:string):Observable<Ticket> {
    return this.http.post<Ticket>(this.apiTicketsUrl,ticket);
  }
}
