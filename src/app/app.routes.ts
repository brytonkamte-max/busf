import { Routes } from '@angular/router';
import { BusLine } from './bus-line/bus-line';
import { HomePage } from './home-page/home-page';

import { LineDetail } from './line-detail/line-detail';
import { TripComponent } from './trip-component/trip-component';
import { FindTrip } from './find-trip/find-trip';
import { Authentication } from './authentication/authentication';
import { authGuard } from './guards/authGuards';



export const routes: Routes = [

  { path: '', component: HomePage },

  { path: 'authentication', component: Authentication },

  { path: 'lines', component: BusLine },
  { path: 'lines/:id', component: LineDetail },
 
  //Solo admin (Loggato) può accedere a questa rotta
  { path: 'trips', component: TripComponent, canActivate: [authGuard] },
  
  { path: 'Findtrips', component: FindTrip },

];
