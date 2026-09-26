import type { IMapController, GeoPoint, MapMarker, MapPolyline, MapViewOptions } from './types';

export class CesiumController implements IMapController {
  readonly engineType = 'cesium' as const;
  private viewer: any = null;
  private Cesium: any = null;
  private polylinesEntity: any = null;
  private markersEntities: any[] = [];
  private scrubberEntity: any = null;
  private _isInitialized = false;

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  async init(container: HTMLElement, options?: Partial<MapViewOptions>): Promise<void> {
    if (typeof window === 'undefined') return;

    // Load Cesium dynamically via browser window / CDN or dynamic import
    if (!(window as any).Cesium) {
      await this.loadCesiumScript();
    }
    this.Cesium = (window as any).Cesium;

    if (!this.Cesium) {
      throw new Error('Cesium 3D engine failed to load');
    }

    const defaultCenter = options?.center || { lat: 27.9881, lng: 86.9250, altitude: 8000 };

    // Initialize Cesium Viewer with high-performance 3D settings
    this.viewer = new this.Cesium.Viewer(container, {
      terrainProvider: await this.Cesium.createWorldTerrainAsync({
        requestWaterMask: false,
        requestVertexNormals: true,
      }).catch(() => undefined),
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      skyAtmosphere: new this.Cesium.SkyAtmosphere(),
    });

    // Atmospheric & lighting tuning for Himalayan topography
    this.viewer.scene.globe.enableLighting = true;
    this.viewer.scene.globe.depthTestAgainstTerrain = true;

    // Fly camera to initial Himalayan coordinates
    this.flyTo(defaultCenter, defaultCenter.altitude || 12000, 2);

    this._isInitialized = true;
  }

  private loadCesiumScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Cesium) {
        resolve();
        return;
      }

      // Inject Cesium CSS
      if (!document.getElementById('cesium-css')) {
        const link = document.createElement('link');
        link.id = 'cesium-css';
        link.rel = 'stylesheet';
        link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.121/Build/Cesium/Widgets/widgets.css';
        document.head.appendChild(link);
      }

      // Inject Cesium JS
      const script = document.createElement('script');
      script.id = 'cesium-script';
      script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.121/Build/Cesium/Cesium.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Cesium script from CDN'));
      document.head.appendChild(script);
    });
  }

  flyTo(point: GeoPoint, altitudeOrZoom = 10000, durationSeconds = 2.5): void {
    if (!this.viewer || !this.Cesium) return;

    this.viewer.camera.flyTo({
      destination: this.Cesium.Cartesian3.fromDegrees(
        point.lng,
        point.lat,
        altitudeOrZoom > 100 ? altitudeOrZoom : altitudeOrZoom * 800
      ),
      orientation: {
        heading: this.Cesium.Math.toRadians(0),
        pitch: this.Cesium.Math.toRadians(-35),
        roll: 0.0,
      },
      duration: durationSeconds,
    });
  }

  setTrailPolyline(polyline: MapPolyline): void {
    if (!this.viewer || !this.Cesium) return;
    this.clearTrailPolyline();

    const positions = polyline.points.map((p) =>
      this.Cesium.Cartesian3.fromDegrees(p.lng, p.lat, (p.altitude || 3000) + 20)
    );

    this.polylinesEntity = this.viewer.entities.add({
      id: polyline.id || 'himalayan-3d-trail',
      polyline: {
        positions,
        width: polyline.weight || 5,
        material: this.Cesium.Color.fromCssColorString(polyline.color || '#B68D40'),
        clampToGround: true,
      },
    });

    if (polyline.points.length > 0) {
      const mid = polyline.points[Math.floor(polyline.points.length / 2)];
      this.flyTo(mid, 14000, 3);
    }
  }

  clearTrailPolyline(): void {
    if (this.viewer && this.polylinesEntity) {
      this.viewer.entities.remove(this.polylinesEntity);
      this.polylinesEntity = null;
    }
  }

  addMarkers(markers: MapMarker[]): void {
    if (!this.viewer || !this.Cesium) return;

    markers.forEach((m) => {
      const entity = this.viewer.entities.add({
        id: m.id,
        position: this.Cesium.Cartesian3.fromDegrees(m.position.lng, m.position.lat, (m.elevation || 3500) + 15),
        point: {
          pixelSize: 10,
          color: this.Cesium.Color.fromCssColorString('#B68D40'),
          outlineColor: this.Cesium.Color.BLACK,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${m.title}${m.elevation ? ` (${m.elevation}m)` : ''}`,
          font: 'bold 12px sans-serif',
          fillColor: this.Cesium.Color.WHITE,
          outlineColor: this.Cesium.Color.BLACK,
          outlineWidth: 3,
          style: this.Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new this.Cesium.Cartesian2(0, -20),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      this.markersEntities.push(entity);
    });
  }

  clearMarkers(): void {
    if (!this.viewer) return;
    this.markersEntities.forEach((entity) => this.viewer.entities.remove(entity));
    this.markersEntities = [];
  }

  setScrubberPosition(point: GeoPoint | null): void {
    if (!this.viewer || !this.Cesium) return;

    if (!point) {
      if (this.scrubberEntity) {
        this.viewer.entities.remove(this.scrubberEntity);
        this.scrubberEntity = null;
      }
      return;
    }

    const cartesianPos = this.Cesium.Cartesian3.fromDegrees(
      point.lng,
      point.lat,
      (point.altitude || 4000) + 30
    );

    if (this.scrubberEntity) {
      this.scrubberEntity.position = cartesianPos;
    } else {
      this.scrubberEntity = this.viewer.entities.add({
        id: 'cesium-scrubber-beacon',
        position: cartesianPos,
        point: {
          pixelSize: 16,
          color: this.Cesium.Color.fromCssColorString('#fbbf24'),
          outlineColor: this.Cesium.Color.BLACK,
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
  }

  destroy(): void {
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.destroy();
      this.viewer = null;
    }
    this._isInitialized = false;
  }
}
