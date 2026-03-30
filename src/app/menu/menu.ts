import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BusLine } from '../bus-line/bus-line';
import { PortalUserService } from '../portal-user-service';


interface MenuItem {
  label: string;
  icon: string;
  route: string;
  requiresAuth?: boolean;
}

@Component({
  selector: 'app-menu',
  imports: [RouterLink, CommonModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  
  portalUserService = inject(PortalUserService);
  
   menuItems: MenuItem[] = [
    { label: 'Home', route: '/', icon: '🏠'},

    { label: 'Trip',    icon: '✈️', route: 'trips', requiresAuth: true },
  
    { label: 'FindTrip', icon: '🔍', route: 'Findtrips' },
  ];

}
