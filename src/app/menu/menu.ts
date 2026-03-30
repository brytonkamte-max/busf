import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
  imports: [RouterLink, CommonModule, RouterLinkActive],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  portalUserService = inject(PortalUserService);

  isDropdownOpen = false;

  menuItems: MenuItem[] = [
    { label: 'Home', route: '/', icon: '🚌' },
    { label: 'Dashboard', route: '/trips', icon: '📊', requiresAuth: true },
  ];

  get user() {
    return this.portalUserService.loggedUser();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout() {
    this.portalUserService.doLogout();
    this.isDropdownOpen = false;
  }
}
