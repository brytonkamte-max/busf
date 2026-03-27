import { Routes } from '@angular/router';
import { BusLine } from './bus-line/bus-line';
import { HomePage } from './home-page/home-page';

import { LineDetail } from './line-detail/line-detail';
import { TripComponent } from './trip-component/trip-component';
import { FindTrip } from './find-trip/find-trip';



export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'lines', component: BusLine },
  { path: 'lines/:id', component: LineDetail },

  { path: 'trips', component: TripComponent },
  { path: 'Findtrips', component: FindTrip },

  // Opzionale: Wildcard per gestire il 404 (rimanda alla home se l'URL è sbagliato)
  { path: '**', redirectTo: 'Homepage' }
];
