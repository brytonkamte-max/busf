import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BusLine } from '../bus-line/bus-line';


interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-menu',
  imports: [RouterLink,CommonModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {

   menuItems: MenuItem[] = [
    { label: 'Lines',    icon: '🚌', route: 'lines'    },

    { label: 'Trip',    icon: '✈️', route: 'trips'    },
  
    
    { label: 'FindTrip', icon: '🔍', route: 'Findtrips' },
  ];

}
