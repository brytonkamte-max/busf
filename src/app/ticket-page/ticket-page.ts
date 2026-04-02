import { Component, signal } from '@angular/core';
import { TicketService } from '../ticket-service';
import { Ticket } from '../model/entities';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ticket-page',
  imports: [],
  templateUrl: './ticket-page.html',
  styleUrl: './ticket-page.css',
})
export class TicketPage {
tickets = signal<Ticket[]>([]);
  newLineName = '';
  search = '';

  constructor(
    private TicketService: TicketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.TicketService.getTickets().subscribe((tickets) => {
      this.tickets.set(tickets);
    });
  }

   addTickets(): void {
    this.TicketService.postTickets().subscribe((tickets) => {
      this.tickets.set(tickets);
    });
  }
}
