export interface Stop {
  id: number;
  lineId: string;

  position: number;
  
  city: string;
  address: string;
  time: number | null;
}
 
export interface Line {
  id: number;
  name: string;
  stops?: Stop[];
}

export interface Trip {
  id: number;
  start: string;
  dayType: string; // Uniformiamo con la T maiuscola
  season: string;
  stops: Stop[];
  line?: any;
  date: string; // Aggiunta della proprietà date
  trafficMultiplier: number;
}

export interface PortalUser {
  id?: number;
  firstName: string;
  lastName: string;
  username: string;
  dob?: string;
  email: string;
  role: string;
}

export interface Ticket{
 id?: number;
  date: string;
  tripId: number;
  userId: number;
  // Campi extra se il backend facesse un "join"
  trip?: Trip; 
  user?: PortalUser;
  
}
 