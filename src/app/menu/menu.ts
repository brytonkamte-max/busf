import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BusLine } from '../bus-line/bus-line';


interface MenuItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-menu',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {

   menuItems: MenuItem[] = [
    { label: 'Home', route: '/', icon: '🏠', exact: true },

    { label: 'Linee',    icon: '🚌', route: 'lines'    },

    { label: 'Corse',    icon: '🔀', route: 'trips'    },

    { label: 'Cerca corse', icon: '🔍', route: 'Findtrips' },
  ];

}
