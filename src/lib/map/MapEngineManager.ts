import type { IMapController, GeoPoint, MapMarker, MapPolyline, MapViewOptions } from './types';
import { LeafletController } from './LeafletController';
import { CesiumController } from './CesiumController';

export type MapEngineChoice = 'leaflet' | 'cesium';

export class MapEngineManager {
  private activeController: IMapController | null = null;
  private currentEngine: MapEngineChoice = 'leaflet';
  private container: HTMLElement | null = null;
  private lastPolyline: MapPolyline | null = null;
  private lastMarkers: MapMarker[] = [];
  private lastScrubberPoint: GeoPoint | null = null;

  get currentController(): IMapController | null {
    return this.activeController;
  }

  get activeEngineType(): MapEngineChoice {
    return this.currentEngine;
  }

  async switchEngine(
    targetEngine: MapEngineChoice,
    container: HTMLElement,
    options?: Partial<MapViewOptions>
  ): Promise<IMapController> {
    if (this.activeController) {
      this.activeController.destroy();
      this.activeController = null;
    }

    this.container = container;
    this.currentEngine = targetEngine;

    // Factory instantiation
    if (targetEngine === 'cesium') {
      this.activeController = new CesiumController();
    } else {
      this.activeController = new LeafletController();
    }

    await this.activeController.init(container, options);

    // Restore state if available
    if (this.lastPolyline) {
      this.activeController.setTrailPolyline(this.lastPolyline);
    }
    if (this.lastMarkers.length > 0) {
      this.activeController.addMarkers(this.lastMarkers);
    }
    if (this.lastScrubberPoint) {
      this.activeController.setScrubberPosition(this.lastScrubberPoint);
    }

    return this.activeController;
  }

  flyTo(point: GeoPoint, altitudeOrZoom?: number, durationSeconds?: number): void {
    this.activeController?.flyTo(point, altitudeOrZoom, durationSeconds);
  }

  setTrailPolyline(polyline: MapPolyline): void {
    this.lastPolyline = polyline;
    this.activeController?.setTrailPolyline(polyline);
  }

  addMarkers(markers: MapMarker[]): void {
    this.lastMarkers = markers;
    this.activeController?.addMarkers(markers);
  }

  setScrubberPosition(point: GeoPoint | null): void {
    this.lastScrubberPoint = point;
    this.activeController?.setScrubberPosition(point);
  }

  startDroneFlight(options?: { speedMultiplier?: 1 | 2 | 5; initialDistanceMeters?: number; cameraMode?: 'chase' | 'cockpit' }): void {
    this.activeController?.startDroneFlight?.(options);
  }

  pauseDroneFlight(): void {
    this.activeController?.pauseDroneFlight?.();
  }

  resumeDroneFlight(): void {
    this.activeController?.resumeDroneFlight?.();
  }

  setDroneFlightSpeed(multiplier: 1 | 2 | 5): void {
    this.activeController?.setDroneFlightSpeed?.(multiplier);
  }

  setDroneCameraMode(mode: 'chase' | 'cockpit'): void {
    this.activeController?.setDroneCameraMode?.(mode);
  }

  seekDroneFlight(distanceMetersOrRatio: number): void {
    this.activeController?.seekDroneFlight?.(distanceMetersOrRatio);
  }

  stopDroneFlight(): void {
    this.activeController?.stopDroneFlight?.();
  }

  onDroneTelemetry(listener: (telemetry: import('./types').DroneFlightTelemetry) => void): (() => void) | undefined {
    return this.activeController?.onDroneTelemetry?.(listener);
  }

  destroy(): void {
    if (this.activeController) {
      this.activeController.destroy();
      this.activeController = null;
    }
    this.container = null;
  }
}
