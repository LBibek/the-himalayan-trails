import type { IMapController, GeoPoint, MapMarker, MapPolyline, MapViewOptions } from './types';

export class LeafletController implements IMapController {
  readonly engineType = 'leaflet' as const;
  private map: any = null;
  private L: any = null;
  private markersLayer: any = null;
  private polylineLayer: any = null;
  private scrubberMarker: any = null;
  private _isInitialized = false;

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  async init(container: HTMLElement, options?: Partial<MapViewOptions>): Promise<void> {
    if (typeof window === 'undefined') return;

    // Dynamically import Leaflet to support Next.js SSR
    const leafletModule = await import('leaflet');
    this.L = leafletModule.default || leafletModule;

    const defaultCenter = options?.center || { lat: 27.9881, lng: 86.9250 };
    const defaultZoom = options?.zoom || 10;

    // Fix default marker icon assets
    delete (this.L.Icon.Default.prototype as any)._getIconUrl;
    this.L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    this.map = this.L.map(container, {
      center: [defaultCenter.lat, defaultCenter.lng],
      zoom: defaultZoom,
      zoomControl: false,
    });

    // High-resolution OpenTopoMap layer suitable for Himalayan terrain
    this.L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
    }).addTo(this.map);

    this.L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.markersLayer = this.L.layerGroup().addTo(this.map);
    this.polylineLayer = this.L.layerGroup().addTo(this.map);

    this._isInitialized = true;
  }

  flyTo(point: GeoPoint, altitudeOrZoom = 12, durationSeconds = 1.5): void {
    if (!this.map) return;
    this.map.flyTo([point.lat, point.lng], altitudeOrZoom, {
      duration: durationSeconds,
      easeLinearity: 0.25
    });
  }

  setTrailPolyline(polyline: MapPolyline): void {
    if (!this.map || !this.L || !this.polylineLayer) return;
    this.polylineLayer.clearLayers();

    const latLngs = polyline.points.map((p) => [p.lat, p.lng]);
    const line = this.L.polyline(latLngs, {
      color: polyline.color || '#B68D40',
      weight: polyline.weight || 4,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    });

    line.addTo(this.polylineLayer);

    if (latLngs.length > 0) {
      this.map.fitBounds(line.getBounds(), { padding: [40, 40] });
    }
  }

  clearTrailPolyline(): void {
    if (this.polylineLayer) {
      this.polylineLayer.clearLayers();
    }
  }

  addMarkers(markers: MapMarker[]): void {
    if (!this.map || !this.L || !this.markersLayer) return;

    markers.forEach((m) => {
      const customIcon = this.L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="background: rgba(0,0,0,0.85); border: 2px solid #B68D40; border-radius: 9999px; padding: 4px 8px; color: #fff; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.6);">
            ${m.title} ${m.elevation ? `<span style="color:#B68D40;">${m.elevation}m</span>` : ''}
          </div>
        `,
        iconSize: [100, 30],
        iconAnchor: [50, 15]
      });

      const marker = this.L.marker([m.position.lat, m.position.lng], { icon: customIcon });
      marker.bindPopup(`<strong>${m.title}</strong><br/>Category: ${m.category || 'Landmark'}`);
      marker.addTo(this.markersLayer);
    });
  }

  clearMarkers(): void {
    if (this.markersLayer) {
      this.markersLayer.clearLayers();
    }
  }

  setScrubberPosition(point: GeoPoint | null): void {
    if (!this.map || !this.L) return;

    if (!point) {
      if (this.scrubberMarker) {
        this.map.removeLayer(this.scrubberMarker);
        this.scrubberMarker = null;
      }
      return;
    }

    const scrubberIcon = this.L.divIcon({
      className: 'scrubber-pin',
      html: `
        <div style="width: 16px; height: 16px; border-radius: 9999px; background: #fbbf24; border: 3px solid #000; box-shadow: 0 0 12px #fbbf24; animation: pulse 1.5s infinite;"></div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    if (this.scrubberMarker) {
      this.scrubberMarker.setLatLng([point.lat, point.lng]);
    } else {
      this.scrubberMarker = this.L.marker([point.lat, point.lng], { icon: scrubberIcon, zIndexOffset: 1000 });
      this.scrubberMarker.addTo(this.map);
    }
  }

  private weatherLayer: any = null;

  setWeatherOverlay(mode: 'none' | 'radar' | 'clouds', customUrl?: string): void {
    if (!this.map || !this.L) return;

    if (this.weatherLayer) {
      this.map.removeLayer(this.weatherLayer);
      this.weatherLayer = null;
    }

    if (mode === 'none') return;

    let url = customUrl || '';
    let attribution = '';
    if (mode === 'radar') {
      if (!url) url = 'https://tilecache.rainviewer.com/v2/radar/5f8646ca4f2d/256/{z}/{x}/{y}/2/1_1.png';
      attribution = 'RainViewer Live Radar';
    } else if (mode === 'clouds') {
      if (!url) url = 'https://tilecache.rainviewer.com/v2/coverage/0/256/{z}/{x}/{y}/0/0_0.png';
      attribution = 'RainViewer Atmospheric Coverage';
    }

    try {
      this.weatherLayer = this.L.tileLayer(url, {
        opacity: mode === 'radar' ? 0.7 : 0.65,
        zIndex: 400,
        attribution
      }).addTo(this.map);
    } catch (err) {
      console.warn('Failed to set Leaflet weather layer:', err);
    }
  }

  destroy(): void {
    if (this.weatherLayer && this.map) {
      try {
        this.map.removeLayer(this.weatherLayer);
      } catch {}
      this.weatherLayer = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this._isInitialized = false;
  }
}
