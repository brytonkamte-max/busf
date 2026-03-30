import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BusLine } from '../bus-line/bus-line';
import { AuthService } from '../auth-service';


interface MenuItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
  adminOnly?: boolean; // <-- Nuova proprietà per il controllo accessi
}

@Component({
  selector: 'app-menu',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {

  // Iniettiamo il servizio per leggere il ruolo dell'utente
  constructor(public authService: AuthService) {}

  menuItems: MenuItem[] = [
    { label: 'Home', route: '/', icon: '🏠', exact: true },

    { label: 'Linee',    icon: '🚌', route: 'lines'    },

    // Impostiamo 'Nuova corsa' come visibile solo agli admin
    { label: 'Nuova corsa', icon: '➕', route: 'trips', adminOnly: true },

    { label: 'Cerca corse', icon: '🔍', route: 'Findtrips' },
  ];

}
