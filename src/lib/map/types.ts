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

export interface DroneFlightTelemetry {
  isPlaying: boolean;
  speedMultiplier: 1 | 2 | 5;
  currentDistanceMeters: number;
  totalDistanceMeters: number;
  progressRatio: number; // 0.0 to 1.0
  currentPosition: GeoPoint;
  currentAltitudeMeters: number;
  remainingDistanceKm: number;
  currentSpeedKmh: number;
  headingDegrees: number;
  pitchDegrees: number;
  slopePercent: number;
  nextLandmark?: {
    name: string;
    distanceKm: number;
    etaSeconds: number;
  };
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

  // Drone flight simulator controls and telemetry
  startDroneFlight?(options?: { speedMultiplier?: 1 | 2 | 5; initialDistanceMeters?: number }): void;
  pauseDroneFlight?(): void;
  resumeDroneFlight?(): void;
  setDroneFlightSpeed?(multiplier: 1 | 2 | 5): void;
  seekDroneFlight?(distanceMetersOrRatio: number): void;
  stopDroneFlight?(): void;
  onDroneTelemetry?(listener: (telemetry: DroneFlightTelemetry) => void): () => void;
  onMarkerClick?(listener: (markerId: string) => void): () => void;
}

