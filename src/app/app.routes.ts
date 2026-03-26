import { Routes } from '@angular/router';
import { BusLine } from './bus-line/bus-line';


import { LineDetail } from './line-detail/line-detail';
import { TripComponent } from './trip-component/trip-component';
import { FindTrip } from './find-trip/find-trip';



export const routes: Routes = [   
     { path: '', redirectTo: 'Findtrips', pathMatch: 'full' },
  { path: 'lines', component: BusLine },
  { path: 'lines/:id', component: LineDetail },
 
  { path: 'trips', component: TripComponent },
  { path: 'Findtrips', component: FindTrip },

];
