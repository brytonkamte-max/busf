import { Component, OnInit, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-component',
  standalone: true,
  template: '<div id="map" style="height: 100%; width: 100%; border-radius: 15px;"></div>',
  styles: [`
    #map { min-height: 400px; width: 100%; }
  `]
})
export class MapComponent implements OnInit, OnChanges, AfterViewInit {
  // Posizione della fermata (marker rosso)
  @Input() lat: number | null = null;
  @Input() lng: number | null = null;
  @Input() label: string = 'Fermata selezionata';

  // Posizione reale dell'utente (pallino blu)
  @Input() userLat: number | null = null;
  @Input() userLng: number | null = null;

  // Tutte le fermate della linea (per il percorso blu)
  @Input() stops: any[] = []; 

  private map: any;
  private markersLayer = L.layerGroup();
  private userLayer = L.layerGroup(); // Layer separato per l'utente
  private routeLine: any;

  constructor() { }

  ngOnInit(): void {
    this.fixDefaultIcons();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    // Se cambiano le coordinate della fermata o dell'utente, aggiorniamo i marker
    if (changes['lat'] || changes['lng'] || changes['userLat'] || changes['userLng']) {
      this.updateMarkers();
    }

    // Se cambia la lista fermate (clic su linea), disegniamo il percorso
    if (changes['stops']) {
      this.drawFullRoute();
    }
  }

  private initMap(): void {
    // Centro di default su Monza se non c'è nulla
    const baseLat = this.lat || this.userLat || 45.5845;
    const baseLng = this.lng || this.userLng || 9.2744;

    this.map = L.map('map', {
      center: [baseLat, baseLng],
      zoom: 14
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
    this.userLayer.addTo(this.map);
  }

  /**
   * Aggiorna sia il marker della fermata che il pallino blu dell'utente
   */
  private updateMarkers(): void {
    this.markersLayer.clearLayers();
    this.userLayer.clearLayers();

    // 1. Aggiungi Pallino Blu per l'utente
    if (this.userLat && this.userLng) {
      const userIcon = L.divIcon({
        className: 'user-icon',
        html: '<div style="background-color: #007bff; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>',
        iconSize: [14, 14]
      });
      L.marker([this.userLat, this.userLng], { icon: userIcon })
        .addTo(this.userLayer)
        .bindPopup("La tua posizione attuale");
    }

    // 2. Aggiungi Marker per la fermata più vicina
    if (this.lat && this.lng) {
      L.marker([this.lat, this.lng])
        .addTo(this.markersLayer)
        .bindPopup(`<b>${this.label}</b>`)
        .openPopup();
      
      // Spostiamo la visuale sulla fermata quando viene trovata
      this.map.flyTo([this.lat, this.lng], 15);
    }
  }

  /**
   * Disegna il percorso blu tra tutte le fermate della linea
   */
  private drawFullRoute(): void {
    if (!this.stops || this.stops.length === 0) return;

    this.markersLayer.clearLayers();
    if (this.routeLine) this.map.removeLayer(this.routeLine);

    const latLngs: L.LatLngExpression[] = [];

    this.stops.forEach(stop => {
      const lat = stop.latitude || stop.lat; // Supporta entrambi i nomi campo
      const lng = stop.longitude || stop.lng;
      
      if (lat && lng) {
        const point: L.LatLngExpression = [lat, lng];
        latLngs.push(point);
        L.marker(point).addTo(this.markersLayer)
          .bindPopup(`<b>Fermata:</b> ${stop.address}`);
      }
    });

    if (latLngs.length > 1) {
      this.routeLine = L.polyline(latLngs, { color: '#003366', weight: 5, opacity: 0.7 }).addTo(this.map);
      this.map.fitBounds(this.routeLine.getBounds(), { padding: [30, 30] });
    }
  }

  // --- METODI PUBBLICI PER I PULSANTI ---

  public focusUser() {
    if (this.userLat && this.userLng) {
      this.map.flyTo([this.userLat, this.userLng], 17);
    } else {
      alert("Posizione utente non disponibile");
    }
  }

  public focusStop() {
    if (this.lat && this.lng) {
      this.map.flyTo([this.lat, this.lng], 17);
    } else {
      alert("Nessuna fermata selezionata");
    }
  }

  private fixDefaultIcons() {
    const iconDefault = L.icon({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }
}