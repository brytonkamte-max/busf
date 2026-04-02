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
  role?: string;
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
    { label: 'Dashboard', route: '/trips', icon: '📊', requiresAuth: true, role: 'ADMIN' },
    { label: 'My Tickets', route: '/tickets', icon: '🎟️', requiresAuth: true, role: 'BIGLIETTAIO' },
    { label: 'Tickets', route: '/tickets', icon: '🎟️', requiresAuth: true, role: 'ADMIN' }
  ];

  get user() {
    return this.portalUserService.loggedUser();
  }

  get visibleMenuItems(): MenuItem[] {
    const user = this.user;

    return this.menuItems.filter(item => {
      if (!item.role) return true;
      return user?.role === item.role;
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout() {
    this.portalUserService.doLogout();
    this.isDropdownOpen = false;
  }
}
