import type { IMapController, GeoPoint, MapMarker, MapPolyline, MapViewOptions } from './types';
import type { HimalayanRange } from '@/types';

export class CesiumController implements IMapController {
  readonly engineType = 'cesium' as const;
  private viewer: any = null;
  private Cesium: any = null;
  private polylinesEntity: any = null;
  private markersEntities: any[] = [];
  private rangeEntities: any[] = [];
  private scrubberEntity: any = null;
  private _isInitialized = false;

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  getViewer(): any {
    return this.viewer;
  }

  async init(container: HTMLElement, options?: Partial<MapViewOptions>): Promise<void> {
    if (typeof window === 'undefined') return;

    // 1. Ensure window.CESIUM_BASE_URL is set BEFORE loading Cesium script to prevent worker/asset 404s
    const CESIUM_CDN_BASE = 'https://cesium.com/downloads/cesiumjs/releases/1.121/Build/Cesium/';
    (window as any).CESIUM_BASE_URL = CESIUM_CDN_BASE;

    // 2. Load Cesium dynamically via browser script tag if not already on window
    if (!(window as any).Cesium) {
      await this.loadCesiumScript(CESIUM_CDN_BASE);
    }
    this.Cesium = (window as any).Cesium;

    if (!this.Cesium) {
      throw new Error('Cesium 3D engine failed to initialize');
    }

    // Configure Cesium Ion Access Token if provided in env
    const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
    if (ionToken && this.Cesium.Ion) {
      this.Cesium.Ion.defaultAccessToken = ionToken;
    }

    const defaultCenter = options?.center || { lat: 27.9881, lng: 86.9250, altitude: 9000 };

    // 3. Terrain Provider with safe fallback to EllipsoidTerrainProvider
    let terrainProvider: any;
    try {
      terrainProvider = await this.Cesium.createWorldTerrainAsync({
        requestWaterMask: false,
        requestVertexNormals: true,
      });
    } catch (terrainError) {
      console.warn('Cesium World Terrain offline or unauthenticated, falling back to standard EllipsoidTerrainProvider:', terrainError);
      terrainProvider = new this.Cesium.EllipsoidTerrainProvider();
    }

    // 4. Initialize Cesium Viewer with high-performance 3D settings
    this.viewer = new this.Cesium.Viewer(container, {
      terrainProvider,
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
      // Suppress default watermark overlay to keep UI pristine
      creditContainer: document.createElement('div'),
      // Optimization: Only render when camera moves or scene changes (dramatically cuts GPU/CPU usage)
      requestRenderMode: true,
      maximumRenderTimeChange: Number.POSITIVE_INFINITY,
      msaaSamples: 2,
      skyAtmosphere: new this.Cesium.SkyAtmosphere(),
    });

    // 5. Himalayan Lighting & Topographic Depth Tuning
    const scene = this.viewer.scene;
    scene.globe.enableLighting = true;
    scene.globe.depthTestAgainstTerrain = true;
    scene.globe.maximumScreenSpaceError = 2.0;

    // Limit resolution scale on high-DPI displays to maintain 60 FPS
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    this.viewer.resolutionScale = Math.min(dpr, 1.5);

    // Initial camera placement over default Himalayan center
    this.flyTo(defaultCenter, defaultCenter.altitude || 12000, 2);

    this._isInitialized = true;
    scene.requestRender();
  }

  private loadCesiumScript(cdnBase: string): Promise<void> {
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
        link.href = `${cdnBase}Widgets/widgets.css`;
        document.head.appendChild(link);
      }

      // Inject Cesium JS
      const script = document.createElement('script');
      script.id = 'cesium-script';
      script.src = `${cdnBase}Cesium.js`;
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
      complete: () => {
        this.viewer?.scene?.requestRender();
      }
    });
  }

  setPerspective(preset: 'topo' | 'ridge' | 'summit'): void {
    if (!this.viewer || !this.Cesium) return;

    const currentPos = this.viewer.camera.positionCartographic;
    const lat = this.Cesium.Math.toDegrees(currentPos.latitude);
    const lng = this.Cesium.Math.toDegrees(currentPos.longitude);

    let pitch = -35;
    let height = currentPos.height;

    if (preset === 'topo') {
      pitch = -85; // Bird's Eye view
      height = Math.max(height, 25000);
    } else if (preset === 'ridge') {
      pitch = -30; // 45-degree dramatic ridge profile
      height = Math.min(height, 12000);
    } else if (preset === 'summit') {
      pitch = -15; // Low-angle summit horizon view
      height = Math.min(height, 8500);
    }

    this.viewer.camera.flyTo({
      destination: this.Cesium.Cartesian3.fromDegrees(lng, lat, height),
      orientation: {
        heading: this.viewer.camera.heading,
        pitch: this.Cesium.Math.toRadians(pitch),
        roll: 0.0,
      },
      duration: 1.5,
      complete: () => {
        this.viewer?.scene?.requestRender();
      }
    });
  }

  setTrailPolyline(polyline: MapPolyline): void {
    if (!this.viewer || !this.Cesium) return;
    this.clearTrailPolyline();

    const positions = polyline.points.map((p) =>
      this.Cesium.Cartesian3.fromDegrees(p.lng, p.lat, (p.altitude || 3000) + 15)
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
      this.flyTo(mid, 14000, 2.5);
    }

    this.viewer.scene.requestRender();
  }

  clearTrailPolyline(): void {
    if (this.viewer && this.polylinesEntity) {
      this.viewer.entities.remove(this.polylinesEntity);
      this.polylinesEntity = null;
      this.viewer.scene.requestRender();
    }
  }

  setRangeBoundaries(ranges: HimalayanRange[], activeRangeName?: string): void {
    if (!this.viewer || !this.Cesium) return;
    this.clearRangeBoundaries();

    ranges.forEach((range) => {
      const isActive = activeRangeName && range.name.toLowerCase() === activeRangeName.toLowerCase();
      const colorString = isActive ? '#B68D40' : 'rgba(182, 141, 64, 0.45)';
      const positions = range.bounds.map((b) =>
        this.Cesium.Cartesian3.fromDegrees(b[0], b[1], (b[2] || 4000) + 20)
      );

      // Close polygon loop
      if (positions.length > 0) {
        positions.push(positions[0]);
      }

      const entity = this.viewer.entities.add({
        id: `range-bound-${range.name.toLowerCase()}`,
        name: `${range.name} Range Boundary`,
        polyline: {
          positions,
          width: isActive ? 4 : 2,
          material: this.Cesium.Color.fromCssColorString(colorString),
          clampToGround: true,
        },
      });

      this.rangeEntities.push(entity);
    });

    this.viewer.scene.requestRender();
  }

  clearRangeBoundaries(): void {
    if (!this.viewer) return;
    this.rangeEntities.forEach((entity) => this.viewer.entities.remove(entity));
    this.rangeEntities = [];
    this.viewer.scene.requestRender();
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

    this.viewer.scene.requestRender();
  }

  clearMarkers(): void {
    if (!this.viewer) return;
    this.markersEntities.forEach((entity) => this.viewer.entities.remove(entity));
    this.markersEntities = [];
    this.viewer.scene.requestRender();
  }

  setScrubberPosition(point: GeoPoint | null): void {
    if (!this.viewer || !this.Cesium) return;

    if (!point) {
      if (this.scrubberEntity) {
        this.viewer.entities.remove(this.scrubberEntity);
        this.scrubberEntity = null;
        this.viewer.scene.requestRender();
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

    this.viewer.scene.requestRender();
  }

  destroy(): void {
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.destroy();
      this.viewer = null;
    }
    this._isInitialized = false;
  }
}
