export interface GeoPoint {
  lat: number;
  lng: number;
  altitude?: number;
}

export interface MapMarker {
  id: string;
  position: GeoPoint;
  title: string;
  category?: string;
  elevation?: number;
  iconUrl?: string;
}

export interface MapPolyline {
  id: string;
  points: GeoPoint[];
  color?: string;
  weight?: number;
}

export interface MapViewOptions {
  center: GeoPoint;
  zoom: number;
  pitch?: number;
  heading?: number;
}

export interface IMapController {
  readonly engineType: 'leaflet' | 'cesium';
  readonly isInitialized: boolean;

  init(container: HTMLElement, options?: Partial<MapViewOptions>): Promise<void>;
  flyTo(point: GeoPoint, altitudeOrZoom?: number, durationSeconds?: number): void;
  setTrailPolyline(polyline: MapPolyline): void;
  clearTrailPolyline(): void;
  addMarkers(markers: MapMarker[]): void;
  clearMarkers(): void;
  setScrubberPosition(point: GeoPoint | null): void;
  destroy(): void;
}
