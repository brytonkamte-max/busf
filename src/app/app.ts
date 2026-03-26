import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BusLine } from './bus-line/bus-line';
import { Menu } from "./menu/menu";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BusLine, Menu],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('busF');
}
