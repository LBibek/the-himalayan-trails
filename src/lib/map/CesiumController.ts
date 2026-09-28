import type { IMapController, GeoPoint, MapMarker, MapPolyline, MapViewOptions, DroneFlightTelemetry } from './types';
import type { HimalayanRange, Landmark } from '@/types';

function computeHaversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class CesiumController implements IMapController {
  readonly engineType = 'cesium' as const;
  private viewer: any = null;
  private Cesium: any = null;
  private polylinesEntity: any = null;
  private routeEntities: any[] = [];
  private markersEntities: any[] = [];
  private rangeEntities: any[] = [];
  private scrubberEntity: any = null;
  private _isInitialized = false;

  // Drone flight simulator state
  private droneFlightPath: GeoPoint[] = [];
  private droneSegments: Array<{
    p1: GeoPoint;
    p2: GeoPoint;
    startDistance: number;
    endDistance: number;
    length: number;
  }> = [];
  private droneTotalDistanceMeters = 0;
  private droneCurrentDistanceMeters = 0;
  private droneSpeedMultiplier: 1 | 2 | 5 = 1;
  private droneCameraMode: 'chase' | 'cockpit' = 'chase';
  private isDroneFlying = false;
  private droneBeaconEntity: any = null;
  private droneTickListener: any = null;
  private droneTelemetryListeners: Set<(telemetry: DroneFlightTelemetry) => void> = new Set();
  private droneLandmarkCheckpoints: Array<{ id: string; name: string; distanceMeters: number }> = [];
  private lastDroneTickTime = 0;
  private lastPolylineObj: MapPolyline | null = null;
  private markerClickListeners: Set<(markerId: string) => void> = new Set();
  private clickHandler: any = null;

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
    if (ionToken && ionToken.trim().length > 20 && !ionToken.includes('placeholder') && !ionToken.includes('your-token')) {
      if (this.Cesium.Ion) {
        this.Cesium.Ion.defaultAccessToken = ionToken.trim();
      }
    }

    // 2. High-resolution satellite base layer (Esri World Imagery)
    let baseLayer: any;
    try {
      baseLayer = new this.Cesium.ImageryLayer(
        new this.Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19,
          credit: 'Esri World Imagery',
        })
      );
    } catch (imgError) {
      console.warn('Esri World Imagery creation notice:', imgError);
    }

    // 3. 3D World Terrain matching Cesium Sandcastle: https://sandcastle.cesium.com/?id=terrain
    let terrain: any = undefined;
    let terrainProvider: any = undefined;

    if (this.Cesium.Terrain && typeof this.Cesium.Terrain.fromWorldTerrain === 'function') {
      try {
        terrain = this.Cesium.Terrain.fromWorldTerrain({
          requestWaterMask: true,
          requestVertexNormals: true,
        });
      } catch (terrainError) {
        console.warn('Cesium.Terrain.fromWorldTerrain notice:', terrainError);
      }
    }

    if (!terrain && typeof this.Cesium.createWorldTerrainAsync === 'function') {
      try {
        terrainProvider = await this.Cesium.createWorldTerrainAsync({
          requestWaterMask: true,
          requestVertexNormals: true,
        });
      } catch (terrainError) {
        console.warn('Cesium.createWorldTerrainAsync notice:', terrainError);
      }
    }

    const defaultCenter = options?.center || { lat: 27.9881, lng: 86.9250, altitude: 9000 };

    // 4. Initialize Cesium Viewer with authentic 3D World Terrain
    const viewerOptions: any = {
      baseLayer,
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
    };

    if (terrain) {
      viewerOptions.terrain = terrain;
    } else if (terrainProvider) {
      viewerOptions.terrainProvider = terrainProvider;
    }

    this.viewer = new this.Cesium.Viewer(container, viewerOptions);

    // Asynchronous terrain fallback if not set during constructor
    if (!terrain && !this.viewer.terrainProvider && typeof this.Cesium.createWorldTerrainAsync === 'function') {
      this.Cesium.createWorldTerrainAsync({
        requestWaterMask: true,
        requestVertexNormals: true,
      }).then((tp: any) => {
        if (this.viewer && !this.viewer.isDestroyed()) {
          this.viewer.terrainProvider = tp;
          this.viewer.scene.requestRender();
        }
      }).catch((e: any) => console.warn('Delayed createWorldTerrainAsync notice:', e));
    }

    // Suppress raw Cesium developer error popups & acceleration notices in production
    if (this.viewer?.cesiumWidget) {
      this.viewer.cesiumWidget.showErrorPanel = (title: string, message: string, error: any) => {
        console.warn('Cesium Notice (suppressed raw dialog):', title, message, error);
      };
    }

    // 5. Himalayan Lighting & Topographic 3D Depth Tuning
    const scene = this.viewer.scene;
    scene.globe.enableLighting = true;
    scene.globe.depthTestAgainstTerrain = true;
    scene.globe.maximumScreenSpaceError = 1.33; // High terrain polygon density for Himalayan summits and ridges

    // Initial camera placement over default Himalayan center
    this.flyTo(defaultCenter, defaultCenter.altitude || 12000, 2);

    // 6. Interactive Marker Click Handler
    if (this.Cesium.ScreenSpaceEventHandler && this.viewer.scene?.canvas) {
      this.clickHandler = new this.Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
      this.clickHandler.setInputAction((click: any) => {
        try {
          const pickedObject = this.viewer.scene.pick(click.position);
          if (this.Cesium.defined(pickedObject) && pickedObject.id && typeof pickedObject.id.id === 'string') {
            const id = pickedObject.id.id;
            this.markerClickListeners.forEach((fn) => {
              try {
                fn(id);
              } catch (e) {
                console.error('Marker click listener error:', e);
              }
            });
          }
        } catch (err) {
          console.warn('Click pick error in Cesium:', err);
        }
      }, this.Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

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

    this.lastPolylineObj = polyline;

    const positions = polyline.points.map((p) =>
      this.Cesium.Cartesian3.fromDegrees(p.lng, p.lat, (p.altitude || 3000) + 15)
    );

    const polyId = polyline.id || 'himalayan-3d-trail';
    const existing = this.viewer.entities.getById(polyId);
    if (existing) {
      this.viewer.entities.remove(existing);
    }

    this.polylinesEntity = this.viewer.entities.add({
      id: polyId,
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

    this.setupDroneFlightPath(polyline);
    this.viewer.scene.requestRender();
  }

  clearTrailPolyline(): void {
    this.stopDroneFlight();
    this.lastPolylineObj = null;
    this.droneFlightPath = [];
    this.droneSegments = [];
    this.droneTotalDistanceMeters = 0;
    this.droneCurrentDistanceMeters = 0;

    if (this.viewer) {
      if (this.polylinesEntity) {
        try {
          if (this.viewer.entities.contains(this.polylinesEntity)) {
            this.viewer.entities.remove(this.polylinesEntity);
          }
        } catch {}
        this.polylinesEntity = null;
      }
      const existingTrail = this.viewer.entities.getById('himalayan-3d-trail');
      if (existingTrail) {
        this.viewer.entities.remove(existingTrail);
      }
      const existingPlanner = this.viewer.entities.getById('planner-3d-route');
      if (existingPlanner) {
        this.viewer.entities.remove(existingPlanner);
      }
      this.viewer.scene.requestRender();
    }
  }

  setAllRouteTracks(
    tracks: Record<string, { coords: [number, number][]; color: string; name: string }>,
    activeTrackId?: string
  ): void {
    if (!this.viewer || !this.Cesium) return;
    this.clearAllRouteTracks();

    Object.entries(tracks).forEach(([key, route]) => {
      const isHighlighted = activeTrackId === key;
      const positions = route.coords.map((c) =>
        this.Cesium.Cartesian3.fromDegrees(c[1], c[0], 3500)
      );

      const entityId = `route-3d-${key}`;
      const existing = this.viewer.entities.getById(entityId);
      if (existing) {
        this.viewer.entities.remove(existing);
      }

      const entity = this.viewer.entities.add({
        id: entityId,
        name: route.name,
        polyline: {
          positions,
          width: isHighlighted ? 6 : 3.5,
          material: this.Cesium.Color.fromCssColorString(isHighlighted ? '#f59e0b' : route.color),
          clampToGround: true,
        },
      });

      this.routeEntities.push(entity);
    });

    this.viewer.scene.requestRender();
  }

  clearAllRouteTracks(): void {
    if (!this.viewer) return;
    this.routeEntities.forEach((entity) => {
      try {
        if (this.viewer.entities.contains(entity)) {
          this.viewer.entities.remove(entity);
        }
      } catch {}
    });
    this.routeEntities = [];
    this.viewer.scene.requestRender();
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

      const entityId = `range-bound-${range.name.toLowerCase()}`;
      const existing = this.viewer.entities.getById(entityId);
      if (existing) {
        this.viewer.entities.remove(existing);
      }

      const entity = this.viewer.entities.add({
        id: entityId,
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
    this.rangeEntities.forEach((entity) => {
      try {
        if (this.viewer.entities.contains(entity)) {
          this.viewer.entities.remove(entity);
        }
      } catch {}
    });
    this.rangeEntities = [];
    this.viewer.scene.requestRender();
  }

  addMarkers(markers: MapMarker[]): void {
    if (!this.viewer || !this.Cesium) return;

    markers.forEach((m) => {
      // 1. Remove existing entity with identical ID to guarantee idempotency and avoid Cesium DeveloperError
      const existing = this.viewer.entities.getById(m.id);
      if (existing) {
        this.viewer.entities.remove(existing);
      }

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

    if (this.droneSegments.length > 0) {
      this.updateLandmarkCheckpoints(markers);
    }

    this.viewer.scene.requestRender();
  }

  clearMarkers(): void {
    if (!this.viewer) return;
    this.markersEntities.forEach((entity) => {
      try {
        if (this.viewer.entities.contains(entity)) {
          this.viewer.entities.remove(entity);
        }
      } catch {}
    });
    this.markersEntities = [];

    // Also purge any lingering planner or landmark markers by prefix
    try {
      const allEntities = this.viewer.entities.values;
      if (Array.isArray(allEntities)) {
        for (let i = allEntities.length - 1; i >= 0; i--) {
          const ent = allEntities[i];
          if (ent && typeof ent.id === 'string' && (ent.id.startsWith('planner-marker-') || ent.id.startsWith('landmark-marker-'))) {
            this.viewer.entities.remove(ent);
          }
        }
      }
    } catch {}

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

  flyToTourWaypoint(
    waypoint: {
      coords: GeoPoint;
      cameraHeading?: number;
      cameraPitch?: number;
      cameraRangeMeters?: number;
      durationSeconds?: number;
    },
    options?: { duration?: number; onComplete?: () => void }
  ): void {
    if (!this.viewer || !this.Cesium) return;
    this.stopTour();

    const targetCartesian = this.Cesium.Cartesian3.fromDegrees(
      waypoint.coords.lng,
      waypoint.coords.lat,
      waypoint.coords.altitude || 6000
    );

    const heading = this.Cesium.Math.toRadians(waypoint.cameraHeading ?? 0);
    const pitch = this.Cesium.Math.toRadians(waypoint.cameraPitch ?? -30);
    const range = waypoint.cameraRangeMeters ?? 3000;

    this.viewer.camera.flyToBoundingSphere(
      new this.Cesium.BoundingSphere(targetCartesian, 100),
      {
        offset: new this.Cesium.HeadingPitchRange(heading, pitch, range),
        duration: options?.duration ?? waypoint.durationSeconds ?? 4,
        complete: () => {
          options?.onComplete?.();
          this.viewer.scene.requestRender();
        },
      }
    );
  }

  setTimeOfDayLighting(preset: 'sunrise' | 'midday' | 'sunset' | 'night'): void {
    if (!this.viewer || !this.Cesium) return;

    const date = new Date(2026, 4, 15); // May 15, 2026 (peak spring climbing season)
    switch (preset) {
      case 'sunrise':
        date.setUTCHours(0, 15, 0); // ~6:00 AM Nepal Time (UTC+5:45)
        break;
      case 'midday':
        date.setUTCHours(6, 15, 0); // ~12:00 PM Nepal Time
        break;
      case 'sunset':
        date.setUTCHours(12, 45, 0); // ~6:30 PM Nepal Time
        break;
      case 'night':
        date.setUTCHours(16, 30, 0); // ~10:15 PM Nepal Time
        break;
    }

    if (this.Cesium.JulianDate) {
      this.viewer.clock.currentTime = this.Cesium.JulianDate.fromDate(date);
    }
    this.viewer.scene.globe.enableLighting = true;
    this.viewer.scene.requestRender();
  }

  startOrbitalRotation(center: GeoPoint, radius: number = 3500, speedRps: number = 0.05): void {
    if (!this.viewer || !this.Cesium) return;
    this.stopTour();

    const target = this.Cesium.Cartesian3.fromDegrees(
      center.lng,
      center.lat,
      center.altitude || 8000
    );

    let heading = this.viewer.camera.heading;

    const orbitListener = () => {
      heading += speedRps * 0.015;
      this.viewer.camera.lookAt(
        target,
        new this.Cesium.HeadingPitchRange(
          heading,
          this.Cesium.Math.toRadians(-35),
          radius
        )
      );
    };

    this.viewer.clock.onTick.addEventListener(orbitListener);
    (this as any)._orbitListener = orbitListener;
  }

  stopTour(): void {
    if (!this.viewer) return;
    if ((this as any)._orbitListener) {
      this.viewer.clock.onTick.removeEventListener((this as any)._orbitListener);
      (this as any)._orbitListener = null;
      this.viewer.camera.lookAtTransform(this.Cesium.Matrix4.IDENTITY);
    }
    this.viewer.camera.cancelFlight();
  }

  setupDroneFlightPath(
    polyline?: MapPolyline,
    landmarks?: Array<{ id: string; name?: string; title?: string; coordinates?: { lat: number; lng: number }; position?: { lat: number; lng: number }; elevation?: number }>
  ): void {
    const poly = polyline || this.lastPolylineObj;
    if (!poly || !poly.points || poly.points.length < 2) return;
    this.lastPolylineObj = poly;

    this.droneFlightPath = [...poly.points];
    this.droneSegments = [];
    let accum = 0;

    for (let i = 0; i < poly.points.length - 1; i++) {
      const p1 = poly.points[i];
      const p2 = poly.points[i + 1];
      const len = computeHaversineMeters(p1.lat, p1.lng, p2.lat, p2.lng);
      this.droneSegments.push({
        p1,
        p2,
        startDistance: accum,
        endDistance: accum + len,
        length: len,
      });
      accum += len;
    }

    this.droneTotalDistanceMeters = accum;
    this.droneCurrentDistanceMeters = 0;

    if (landmarks && landmarks.length > 0) {
      this.updateLandmarkCheckpoints(landmarks);
    }
  }

  updateLandmarkCheckpoints(
    landmarks: Array<{ id: string; name?: string; title?: string; coordinates?: { lat: number; lng: number }; position?: { lat: number; lng: number }; elevation?: number }>
  ): void {
    if (!this.droneSegments.length || !landmarks.length) return;

    this.droneLandmarkCheckpoints = [];

    landmarks.forEach((lm) => {
      const lat = lm.coordinates?.lat ?? lm.position?.lat;
      const lng = lm.coordinates?.lng ?? lm.position?.lng;
      const name = lm.name ?? lm.title;
      if (lat === undefined || lng === undefined || !name) return;

      let bestDistMeters = 0;
      let minDistanceToTrail = Infinity;

      for (const seg of this.droneSegments) {
        const d1 = computeHaversineMeters(lat, lng, seg.p1.lat, seg.p1.lng);
        const d2 = computeHaversineMeters(lat, lng, seg.p2.lat, seg.p2.lng);
        const minDist = Math.min(d1, d2);
        if (minDist < minDistanceToTrail) {
          minDistanceToTrail = minDist;
          bestDistMeters = d1 < d2 ? seg.startDistance : seg.endDistance;
        }
      }

      this.droneLandmarkCheckpoints.push({
        id: lm.id,
        name,
        distanceMeters: bestDistMeters,
      });
    });

    this.droneLandmarkCheckpoints.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  private getDroneStateAtDistance(distanceMeters: number): {
    point: GeoPoint;
    bearingRad: number;
    bearingDeg: number;
    slopePercent: number;
    slopeAngleRad: number;
    dynamicPitchAdjustment: number;
    pitchDeg: number;
    rollDeg: number;
  } {
    if (this.droneSegments.length === 0) {
      return {
        point: { lat: 27.9881, lng: 86.9250, altitude: 5000 },
        bearingRad: 0,
        bearingDeg: 0,
        slopePercent: 0,
        slopeAngleRad: 0,
        dynamicPitchAdjustment: 0,
        pitchDeg: -20,
        rollDeg: 0,
      };
    }

    const clampedDist = Math.max(0, Math.min(distanceMeters, this.droneTotalDistanceMeters));

    let seg = this.droneSegments[0];
    let low = 0;
    let high = this.droneSegments.length - 1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const s = this.droneSegments[mid];
      if (clampedDist < s.startDistance) {
        high = mid - 1;
      } else if (clampedDist > s.endDistance) {
        low = mid + 1;
      } else {
        seg = s;
        break;
      }
    }

    if (clampedDist >= this.droneTotalDistanceMeters) {
      seg = this.droneSegments[this.droneSegments.length - 1];
    }

    const u = seg.length > 0 ? Math.max(0, Math.min(1, (clampedDist - seg.startDistance) / seg.length)) : 0;
    const curLat = seg.p1.lat + u * (seg.p2.lat - seg.p1.lat);
    const curLng = seg.p1.lng + u * (seg.p2.lng - seg.p1.lng);
    const alt1 = seg.p1.altitude ?? 3500;
    const alt2 = seg.p2.altitude ?? 3500;
    const curAlt = alt1 + u * (alt2 - alt1);
    const currentPoint: GeoPoint = { lat: curLat, lng: curLng, altitude: curAlt };

    // Lookahead sampling for tangent bearing & slope gradient (50 meters forward)
    const lookaheadDist = Math.min(clampedDist + 50, this.droneTotalDistanceMeters);
    let aheadPoint: GeoPoint;

    if (lookaheadDist > clampedDist) {
      let aheadSeg = seg;
      if (lookaheadDist > seg.endDistance) {
        let aLow = 0;
        let aHigh = this.droneSegments.length - 1;
        while (aLow <= aHigh) {
          const aMid = (aLow + aHigh) >> 1;
          const aS = this.droneSegments[aMid];
          if (lookaheadDist < aS.startDistance) {
            aHigh = aMid - 1;
          } else if (lookaheadDist > aS.endDistance) {
            aLow = aMid + 1;
          } else {
            aheadSeg = aS;
            break;
          }
        }
      }
      const aU = aheadSeg.length > 0 ? Math.max(0, Math.min(1, (lookaheadDist - aheadSeg.startDistance) / aheadSeg.length)) : 1;
      const aLat = aheadSeg.p1.lat + aU * (aheadSeg.p2.lat - aheadSeg.p1.lat);
      const aLng = aheadSeg.p1.lng + aU * (aheadSeg.p2.lng - aheadSeg.p1.lng);
      const aAlt1 = aheadSeg.p1.altitude ?? 3500;
      const aAlt2 = aheadSeg.p2.altitude ?? 3500;
      aheadPoint = { lat: aLat, lng: aLng, altitude: aAlt1 + aU * (aAlt2 - aAlt1) };
    } else {
      aheadPoint = seg.p2;
    }

    const dLng = ((aheadPoint.lng - currentPoint.lng) * Math.PI) / 180;
    const lat1 = (currentPoint.lat * Math.PI) / 180;
    const lat2 = (aheadPoint.lat * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    let bearingRad = Math.atan2(y, x);
    let bearingDeg = ((bearingRad * 180) / Math.PI + 360) % 360;

    // Sample further ahead to compute cornering banking roll
    let rollDeg = 0;
    const turnDist = Math.min(clampedDist + 110, this.droneTotalDistanceMeters);
    if (turnDist > lookaheadDist) {
      let turnSeg = seg;
      if (turnDist > seg.endDistance) {
        let tLow = 0;
        let tHigh = this.droneSegments.length - 1;
        while (tLow <= tHigh) {
          const tMid = (tLow + tHigh) >> 1;
          const tS = this.droneSegments[tMid];
          if (turnDist < tS.startDistance) {
            tHigh = tMid - 1;
          } else if (turnDist > tS.endDistance) {
            tLow = tMid + 1;
          } else {
            turnSeg = tS;
            break;
          }
        }
      }
      const tU = turnSeg.length > 0 ? Math.max(0, Math.min(1, (turnDist - turnSeg.startDistance) / turnSeg.length)) : 1;
      const tLat = turnSeg.p1.lat + tU * (turnSeg.p2.lat - turnSeg.p1.lat);
      const tLng = turnSeg.p1.lng + tU * (turnSeg.p2.lng - turnSeg.p1.lng);
      const tdLng = ((tLng - aheadPoint.lng) * Math.PI) / 180;
      const tLat1 = (aheadPoint.lat * Math.PI) / 180;
      const tLat2 = (tLat * Math.PI) / 180;
      const ty = Math.sin(tdLng) * Math.cos(tLat2);
      const tx = Math.cos(tLat1) * Math.sin(tLat2) - Math.sin(tLat1) * Math.cos(tLat2) * Math.cos(tdLng);
      const turnBearingDeg = ((Math.atan2(ty, tx) * 180) / Math.PI + 360) % 360;
      const bearingDelta = ((turnBearingDeg - bearingDeg + 540) % 360) - 180;
      rollDeg = Math.max(-20, Math.min(20, bearingDelta * 0.45));
    }

    const deltaH = (aheadPoint.altitude ?? curAlt) - curAlt;
    const deltaD = computeHaversineMeters(currentPoint.lat, currentPoint.lng, aheadPoint.lat, aheadPoint.lng);
    const slopePercent = deltaD > 0.5 ? (deltaH / deltaD) * 100 : 0;
    const slopeAngleRad = Math.atan2(deltaH, Math.max(deltaD, 1));
    const basePitch = -20;
    const dynamicPitchAdjustment = ((slopeAngleRad * 180) / Math.PI) * 0.45;
    const pitchDeg = Math.max(-45, Math.min(10, basePitch + dynamicPitchAdjustment));

    return {
      point: currentPoint,
      bearingRad,
      bearingDeg,
      slopePercent,
      slopeAngleRad,
      dynamicPitchAdjustment,
      pitchDeg,
      rollDeg,
    };
  }

  private applyDroneState(distanceMeters: number): DroneFlightTelemetry {
    const state = this.getDroneStateAtDistance(distanceMeters);
    const { point, bearingRad, bearingDeg, slopePercent, slopeAngleRad, dynamicPitchAdjustment, pitchDeg, rollDeg } = state;

    if (this.viewer && this.Cesium) {
      const isCockpit = this.droneCameraMode === 'cockpit';
      const beaconPos = this.Cesium.Cartesian3.fromDegrees(
        point.lng,
        point.lat,
        (point.altitude || 3500) + 15
      );

      let beacon = this.droneBeaconEntity || this.viewer.entities.getById('cesium-drone-beacon');
      if (beacon) {
        beacon.position = beaconPos;
        beacon.show = !isCockpit;
        this.droneBeaconEntity = beacon;
      } else if (!isCockpit) {
        this.droneBeaconEntity = this.viewer.entities.add({
          id: 'cesium-drone-beacon',
          name: 'Himalayan Drone Simulator',
          position: beaconPos,
          point: {
            pixelSize: 18,
            color: this.Cesium.Color.fromCssColorString('#fbbf24'),
            outlineColor: this.Cesium.Color.BLACK,
            outlineWidth: 3,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: 'DRONE 3D',
            font: 'bold 11px sans-serif',
            fillColor: this.Cesium.Color.fromCssColorString('#fbbf24'),
            outlineColor: this.Cesium.Color.BLACK,
            outlineWidth: 3,
            style: this.Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new this.Cesium.Cartesian2(0, -22),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      }

      let cameraPos: any;
      let cameraPitchDeg: number;
      let cameraRollDeg: number;

      if (isCockpit) {
        // Cockpit mode: First-person pilot perspective looking directly ahead along trajectory
        const cockpitAlt = (point.altitude || 3500) + 20;
        cameraPos = this.Cesium.Cartesian3.fromDegrees(point.lng, point.lat, cockpitAlt);
        cameraPitchDeg = Math.max(-30, Math.min(15, -6 + dynamicPitchAdjustment * 0.7));
        cameraRollDeg = Math.max(-20, Math.min(20, rollDeg));
      } else {
        // Chase mode: Third-person camera trailing ~180m behind and ~110m above
        const chaseDistanceMeters = 180;
        const latRad = (point.lat * Math.PI) / 180;
        const dLat = (-chaseDistanceMeters * Math.cos(bearingRad)) / 111320;
        const dLng = (-chaseDistanceMeters * Math.sin(bearingRad)) / (111320 * Math.cos(latRad));
        const chaseLat = point.lat + dLat;
        const chaseLng = point.lng + dLng;
        const chaseAlt = (point.altitude || 3500) + 110;

        cameraPos = this.Cesium.Cartesian3.fromDegrees(chaseLng, chaseLat, chaseAlt);
        cameraPitchDeg = Math.max(-40, Math.min(5, -20 + dynamicPitchAdjustment * 0.3));
        cameraRollDeg = Math.max(-12, Math.min(12, rollDeg * 0.5));
      }

      this.viewer.camera.setView({
        destination: cameraPos,
        orientation: {
          heading: bearingRad,
          pitch: this.Cesium.Math.toRadians(cameraPitchDeg),
          roll: this.Cesium.Math.toRadians(cameraRollDeg),
        },
      });

      this.viewer.scene.requestRender();
    }

    const speedKmh = 50 * this.droneSpeedMultiplier;
    const speedMps = (speedKmh * 1000) / 3600;
    const verticalSpeedMps = Math.round(speedMps * Math.sin(slopeAngleRad) * 10) / 10;
    const remainingDistanceKm = Math.max(
      0,
      Math.round(((this.droneTotalDistanceMeters - distanceMeters) / 1000) * 10) / 10
    );

    let nextLandmark: { name: string; distanceKm: number; etaSeconds: number } | undefined;
    const upcoming = this.droneLandmarkCheckpoints.find((lm) => lm.distanceMeters > distanceMeters + 15);
    if (upcoming) {
      const distM = upcoming.distanceMeters - distanceMeters;
      nextLandmark = {
        name: upcoming.name,
        distanceKm: Math.round((distM / 1000) * 10) / 10,
        etaSeconds: Math.max(1, Math.round(distM / speedMps)),
      };
    }

    const telemetry: DroneFlightTelemetry = {
      isPlaying: this.isDroneFlying,
      speedMultiplier: this.droneSpeedMultiplier,
      cameraMode: this.droneCameraMode,
      currentDistanceMeters: Math.round(distanceMeters),
      totalDistanceMeters: Math.round(this.droneTotalDistanceMeters),
      progressRatio: this.droneTotalDistanceMeters > 0 ? distanceMeters / this.droneTotalDistanceMeters : 0,
      currentPosition: point,
      currentAltitudeMeters: Math.round(point.altitude || 0),
      remainingDistanceKm,
      currentSpeedKmh: speedKmh,
      verticalSpeedMps,
      headingDegrees: Math.round(bearingDeg),
      pitchDegrees: Math.round(pitchDeg),
      rollDegrees: Math.round(rollDeg),
      slopePercent: Math.round(slopePercent * 10) / 10,
      nextLandmark,
    };

    return telemetry;
  }

  private handleDroneClockTick = (): void => {
    if (!this.isDroneFlying) return;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const rawDt = this.lastDroneTickTime > 0 ? (now - this.lastDroneTickTime) / 1000 : 0.016;
    // Clamp between 16ms (minimum 60fps frame — keeps synchronous test ticks working) and 100ms
    const dt = Math.max(0.016, Math.min(rawDt, 0.1));
    this.lastDroneTickTime = now;

    const speedMps = ((50 * this.droneSpeedMultiplier) * 1000) / 3600;
    this.droneCurrentDistanceMeters += speedMps * dt;

    if (this.droneCurrentDistanceMeters >= this.droneTotalDistanceMeters) {
      this.droneCurrentDistanceMeters = this.droneTotalDistanceMeters;
      this.isDroneFlying = false;
      if (this.viewer?.scene) {
        this.viewer.scene.requestRenderMode = true;
      }
    }

    const telemetry = this.applyDroneState(this.droneCurrentDistanceMeters);
    this.emitDroneTelemetry(telemetry);
  };

  startDroneFlight(options?: { speedMultiplier?: 1 | 2 | 5; initialDistanceMeters?: number; cameraMode?: 'chase' | 'cockpit' }): void {
    if (!this.viewer || !this.Cesium) return;

    if (this.droneSegments.length === 0 && this.lastPolylineObj) {
      this.setupDroneFlightPath(this.lastPolylineObj);
    }
    if (this.droneSegments.length === 0) return;

    this.stopTour();

    if (options?.speedMultiplier) {
      this.droneSpeedMultiplier = options.speedMultiplier;
    }
    if (options?.cameraMode) {
      this.droneCameraMode = options.cameraMode;
    }
    if (options?.initialDistanceMeters !== undefined) {
      this.droneCurrentDistanceMeters = Math.max(0, Math.min(options.initialDistanceMeters, this.droneTotalDistanceMeters));
    } else if (this.droneCurrentDistanceMeters >= this.droneTotalDistanceMeters) {
      this.droneCurrentDistanceMeters = 0;
    }

    this.isDroneFlying = true;
    this.lastDroneTickTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    // Disable requestRenderMode during flight so frames update continuously at 60 FPS
    this.viewer.scene.requestRenderMode = false;

    if (!this.droneTickListener) {
      this.droneTickListener = this.handleDroneClockTick;
      this.viewer.clock.onTick.addEventListener(this.droneTickListener);
    }

    const initialTelemetry = this.applyDroneState(this.droneCurrentDistanceMeters);
    this.emitDroneTelemetry(initialTelemetry);
  }

  setDroneCameraMode(mode: 'chase' | 'cockpit'): void {
    this.droneCameraMode = mode;
    if (this.droneBeaconEntity) {
      this.droneBeaconEntity.show = mode === 'chase';
    }
    const telemetry = this.applyDroneState(this.droneCurrentDistanceMeters);
    this.emitDroneTelemetry(telemetry);
  }

  pauseDroneFlight(): void {
    this.isDroneFlying = false;
    if (this.viewer?.scene) {
      this.viewer.scene.requestRenderMode = true;
      this.viewer.scene.requestRender();
    }
    const telemetry = this.applyDroneState(this.droneCurrentDistanceMeters);
    this.emitDroneTelemetry({ ...telemetry, isPlaying: false });
  }

  resumeDroneFlight(): void {
    if (!this.viewer || !this.Cesium || this.droneSegments.length === 0) return;

    if (this.droneCurrentDistanceMeters >= this.droneTotalDistanceMeters) {
      this.droneCurrentDistanceMeters = 0;
    }

    this.isDroneFlying = true;
    this.lastDroneTickTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    this.viewer.scene.requestRenderMode = false;

    if (!this.droneTickListener) {
      this.droneTickListener = this.handleDroneClockTick;
      this.viewer.clock.onTick.addEventListener(this.droneTickListener);
    }

    const telemetry = this.applyDroneState(this.droneCurrentDistanceMeters);
    this.emitDroneTelemetry({ ...telemetry, isPlaying: true });
  }

  setDroneFlightSpeed(multiplier: 1 | 2 | 5): void {
    this.droneSpeedMultiplier = multiplier;
    const telemetry = this.applyDroneState(this.droneCurrentDistanceMeters);
    this.emitDroneTelemetry(telemetry);
  }

  seekDroneFlight(distanceMetersOrRatio: number): void {
    if (this.droneSegments.length === 0 && this.lastPolylineObj) {
      this.setupDroneFlightPath(this.lastPolylineObj);
    }
    if (this.droneSegments.length === 0) return;

    let targetMeters = distanceMetersOrRatio;
    if (distanceMetersOrRatio >= 0 && distanceMetersOrRatio <= 1 && this.droneTotalDistanceMeters > 10) {
      targetMeters = distanceMetersOrRatio * this.droneTotalDistanceMeters;
    }

    this.droneCurrentDistanceMeters = Math.max(0, Math.min(targetMeters, this.droneTotalDistanceMeters));
    const telemetry = this.applyDroneState(this.droneCurrentDistanceMeters);
    this.emitDroneTelemetry(telemetry);
  }

  stopDroneFlight(): void {
    this.isDroneFlying = false;

    if (this.viewer && this.droneTickListener) {
      this.viewer.clock.onTick.removeEventListener(this.droneTickListener);
      this.droneTickListener = null;
    }

    if (this.viewer) {
      const existingBeacon = this.droneBeaconEntity || this.viewer.entities.getById('cesium-drone-beacon');
      if (existingBeacon) {
        this.viewer.entities.remove(existingBeacon);
      }
      this.droneBeaconEntity = null;
    }

    if (this.viewer?.scene) {
      this.viewer.scene.requestRenderMode = true;
      this.viewer.scene.requestRender();
    }

    if (this.droneSegments.length > 0) {
      const telemetry = this.applyDroneState(this.droneCurrentDistanceMeters);
      this.emitDroneTelemetry({ ...telemetry, isPlaying: false });
    }
  }

  onDroneTelemetry(listener: (telemetry: DroneFlightTelemetry) => void): () => void {
    this.droneTelemetryListeners.add(listener);
    if (this.droneSegments.length > 0) {
      const snap = this.applyDroneState(this.droneCurrentDistanceMeters);
      listener(snap);
    }
    return () => {
      this.droneTelemetryListeners.delete(listener);
    };
  }

  private emitDroneTelemetry(telemetry: DroneFlightTelemetry): void {
    this.droneTelemetryListeners.forEach((listener) => {
      try {
        listener(telemetry);
      } catch (err) {
        console.error('Error in drone telemetry listener:', err);
      }
    });
  }

  onMarkerClick(listener: (markerId: string) => void): () => void {
    this.markerClickListeners.add(listener);
    return () => {
      this.markerClickListeners.delete(listener);
    };
  }

  destroy(): void {
    this.stopTour();
    this.stopDroneFlight();
    this.droneTelemetryListeners.clear();
    if (this.clickHandler) {
      try {
        this.clickHandler.destroy();
      } catch {}
      this.clickHandler = null;
    }
    this.markerClickListeners.clear();
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.destroy();
      this.viewer = null;
    }
    this._isInitialized = false;
  }
}

