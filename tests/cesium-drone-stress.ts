import { CesiumController } from '../src/lib/map/CesiumController';
import type { MapPolyline, DroneFlightTelemetry } from '../src/lib/map/types';

// Create a realistic Cesium mock environment for node testing
class MockEntity {
  id: string;
  name?: string;
  position?: any;
  point?: any;
  label?: any;
  polyline?: any;

  constructor(options: any) {
    this.id = options.id;
    this.name = options.name;
    this.position = options.position;
    this.point = options.point;
    this.label = options.label;
    this.polyline = options.polyline;
  }
}

class MockEntityCollection {
  private entities: Map<string, MockEntity> = new Map();

  add(options: any): MockEntity {
    const entity = new MockEntity(options);
    this.entities.set(options.id, entity);
    return entity;
  }

  remove(entity: MockEntity): boolean {
    if (!entity) return false;
    return this.entities.delete(entity.id);
  }

  getById(id: string): MockEntity | undefined {
    return this.entities.get(id);
  }

  get values(): MockEntity[] {
    return Array.from(this.entities.values());
  }

  get size(): number {
    return this.entities.size;
  }
}

class MockClock {
  currentTime: any = {};
  onTick = {
    listeners: new Set<() => void>(),
    addEventListener: (fn: () => void) => {
      this.onTick.listeners.add(fn);
    },
    removeEventListener: (fn: () => void) => {
      this.onTick.listeners.delete(fn);
    },
  };

  tick() {
    for (const listener of Array.from(this.onTick.listeners)) {
      listener();
    }
  }
}

class MockScene {
  requestRenderMode = true;
  renderRequestedCount = 0;
  globe = {
    enableLighting: false,
    depthTestAgainstTerrain: false,
    maximumScreenSpaceError: 2.0,
  };

  requestRender() {
    this.renderRequestedCount++;
  }
}

class MockCamera {
  heading = 0;
  pitch = 0;
  roll = 0;
  positionCartographic = { latitude: 0.488, longitude: 1.517, height: 9000 };
  viewCalls: any[] = [];
  flyToCalls: any[] = [];

  setView(opts: any) {
    this.viewCalls.push(opts);
  }

  flyTo(opts: any) {
    this.flyToCalls.push(opts);
    if (opts.complete) opts.complete();
  }

  cancelFlight() {}
  lookAt() {}
  lookAtTransform() {}
}

class MockCesiumViewer {
  entities = new MockEntityCollection();
  clock = new MockClock();
  scene = new MockScene();
  camera = new MockCamera();
  resolutionScale = 1.0;
  private _destroyed = false;

  destroy() {
    this._destroyed = true;
    this.entities = new MockEntityCollection();
    this.clock.onTick.listeners.clear();
  }

  isDestroyed() {
    return this._destroyed;
  }
}

const MockCesium = {
  Viewer: MockCesiumViewer,
  Cartesian3: {
    fromDegrees: (lng: number, lat: number, alt: number) => ({ lng, lat, alt }),
  },
  Cartesian2: class {
    constructor(public x: number, public y: number) {}
  },
  Color: {
    fromCssColorString: (c: string) => ({ color: c }),
    BLACK: { color: 'black' },
    WHITE: { color: 'white' },
  },
  LabelStyle: {
    FILL_AND_OUTLINE: 'FILL_AND_OUTLINE',
  },
  Math: {
    toRadians: (deg: number) => (deg * Math.PI) / 180,
    toDegrees: (rad: number) => (rad * 180) / Math.PI,
  },
  Matrix4: {
    IDENTITY: {},
  },
  SkyAtmosphere: class {},
  EllipsoidTerrainProvider: class {},
  ImageryLayer: class {
    constructor(public provider: any) {}
  },
  UrlTemplateImageryProvider: class {
    constructor(public opts: any) {}
  },
};

// Global setup
(global as any).window = {
  Cesium: MockCesium,
  devicePixelRatio: 1,
};
(global as any).document = {
  createElement: () => ({}),
  getElementById: () => null,
  head: { appendChild: () => {} },
};

async function createInitializedController(): Promise<{ controller: CesiumController; viewer: MockCesiumViewer }> {
  const controller = new CesiumController();
  await controller.init({} as HTMLElement);
  const viewer = controller.getViewer() as MockCesiumViewer;
  return { controller, viewer };
}

const samplePolyline: MapPolyline = {
  id: 'test-everest-trail',
  points: [
    { lat: 27.9881, lng: 86.9250, altitude: 2860 },
    { lat: 27.9950, lng: 86.9300, altitude: 3440 },
    { lat: 28.0050, lng: 86.9400, altitude: 4200 },
    { lat: 28.0150, lng: 86.9500, altitude: 4900 },
    { lat: 28.0250, lng: 86.9600, altitude: 5364 },
  ],
  color: '#B68D40',
  weight: 5,
};

async function runAdversarialSuite() {
  console.log('=== RUNNING CESIUM DRONE ADVERSARIAL CHALLENGE SUITE ===\n');

  let passedChecks = 0;
  let failedChecks = 0;
  const issues: string[] = [];

  function assertCheck(name: string, condition: boolean, details: string) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passedChecks++;
    } else {
      console.error(`[FAIL] ${name} -> ${details}`);
      failedChecks++;
      issues.push(`${name}: ${details}`);
    }
  }

  // TEST 1: Initial Render Mode
  {
    const { controller, viewer } = await createInitializedController();
    assertCheck(
      'T1.1: Initial requestRenderMode is true',
      viewer.scene.requestRenderMode === true,
      `Expected true, got ${viewer.scene.requestRenderMode}`
    );
    controller.destroy();
  }

  // TEST 2: Start Flight -> requestRenderMode toggles to false and listener is registered
  {
    const { controller, viewer } = await createInitializedController();
    controller.setTrailPolyline(samplePolyline);
    controller.startDroneFlight({ speedMultiplier: 1 });

    assertCheck(
      'T2.1: Flight start disables requestRenderMode for 60 FPS',
      viewer.scene.requestRenderMode === false,
      `Expected false, got ${viewer.scene.requestRenderMode}`
    );

    assertCheck(
      'T2.2: Clock onTick listener registered exactly once',
      viewer.clock.onTick.listeners.size === 1,
      `Expected 1 listener, got ${viewer.clock.onTick.listeners.size}`
    );

    assertCheck(
      'T2.3: Drone beacon entity created in viewer',
      viewer.entities.getById('cesium-drone-beacon') !== undefined,
      'Drone beacon entity missing'
    );
    controller.destroy();
  }

  // TEST 3: Pause Flight -> requestRenderMode restored to true
  {
    const { controller, viewer } = await createInitializedController();
    controller.setTrailPolyline(samplePolyline);
    controller.startDroneFlight();
    controller.pauseDroneFlight();

    assertCheck(
      'T3.1: Pause restores requestRenderMode to true',
      viewer.scene.requestRenderMode === true,
      `Expected true, got ${viewer.scene.requestRenderMode}`
    );

    assertCheck(
      'T3.2: Pause keeps beacon entity in viewer',
      viewer.entities.getById('cesium-drone-beacon') !== undefined,
      'Drone beacon entity should remain visible when paused'
    );
    controller.destroy();
  }

  // TEST 4: Stop Flight -> Does stopDroneFlight cleanly remove beacon entity and clock listener?
  {
    const { controller, viewer } = await createInitializedController();
    controller.setTrailPolyline(samplePolyline);
    controller.startDroneFlight();

    // Call stopDroneFlight()
    controller.stopDroneFlight();

    assertCheck(
      'T4.1: Stop restores requestRenderMode to true',
      viewer.scene.requestRenderMode === true,
      `Expected true, got ${viewer.scene.requestRenderMode}`
    );

    assertCheck(
      'T4.2: Stop removes clock tick listener',
      viewer.clock.onTick.listeners.size === 0,
      `Expected 0 listeners, got ${viewer.clock.onTick.listeners.size}`
    );

    // CRITICAL ADVERSARIAL CHECK: Did stopDroneFlight remove the beacon entity from viewer?
    const beaconAfterStop = viewer.entities.getById('cesium-drone-beacon');
    assertCheck(
      'T4.3: Stop cleanly removes drone beacon entity from Cesium viewer',
      beaconAfterStop === undefined,
      `Beacon entity still present in viewer.entities after stopDroneFlight()! Value: ${JSON.stringify(beaconAfterStop)}`
    );

    controller.destroy();
  }

  // TEST 5: Natural flight completion -> Listener cleanup & render mode restore
  {
    const { controller, viewer } = await createInitializedController();
    controller.setTrailPolyline(samplePolyline);
    let lastTelemetry: DroneFlightTelemetry | null = null;
    controller.onDroneTelemetry((t) => { lastTelemetry = t; });

    let mockNow = 1000;
    const origNow = performance.now;
    performance.now = () => mockNow;

    controller.startDroneFlight({ speedMultiplier: 5, initialDistanceMeters: 0 });

    // Advance clock and time
    for (let i = 0; i < 2000; i++) {
      mockNow += 50; // 50ms per frame
      viewer.clock.tick();
      if ((lastTelemetry as DroneFlightTelemetry | null) && !(lastTelemetry as unknown as DroneFlightTelemetry).isPlaying) break;
    }
    performance.now = origNow;

    assertCheck(
      'T5.1: Flight completion halts playing state',
      (lastTelemetry as DroneFlightTelemetry | null)?.isPlaying === false,
      `Expected isPlaying=false, got ${(lastTelemetry as DroneFlightTelemetry | null)?.isPlaying}`
    );

    assertCheck(
      'T5.2: Flight completion restores requestRenderMode to true',
      viewer.scene.requestRenderMode === true,
      `Expected requestRenderMode=true, got ${viewer.scene.requestRenderMode}`
    );

    // CRITICAL ADVERSARIAL CHECK: Does clock onTick listener detach when flight completes on its own?
    assertCheck(
      'T5.3: Flight completion detaches clock tick listener from Cesium clock',
      viewer.clock.onTick.listeners.size === 0,
      `Clock onTick listener NOT removed on natural flight completion! Listener count: ${viewer.clock.onTick.listeners.size}`
    );

    controller.destroy();
  }

  // TEST 6: Rapid Toggling Stress Harness (10,000 rapid cycles)
  {
    const { controller, viewer } = await createInitializedController();
    controller.setTrailPolyline(samplePolyline);

    let errorCount = 0;
    let telemetryCount = 0;
    let nanDetected = false;

    controller.onDroneTelemetry((t) => {
      telemetryCount++;
      if (
        Number.isNaN(t.currentDistanceMeters) ||
        Number.isNaN(t.currentAltitudeMeters) ||
        Number.isNaN(t.remainingDistanceKm) ||
        Number.isNaN(t.headingDegrees) ||
        Number.isNaN(t.pitchDegrees) ||
        Number.isNaN(t.slopePercent) ||
        Number.isNaN(t.currentPosition.lat) ||
        Number.isNaN(t.currentPosition.lng)
      ) {
        nanDetected = true;
      }
    });

    const startMs = Date.now();
    for (let i = 0; i < 10000; i++) {
      try {
        const action = i % 7;
        switch (action) {
          case 0:
            controller.startDroneFlight();
            break;
          case 1:
            controller.pauseDroneFlight();
            break;
          case 2:
            controller.resumeDroneFlight();
            break;
          case 3:
            controller.seekDroneFlight(Math.random());
            break;
          case 4:
            controller.setDroneFlightSpeed((i % 3 === 0 ? 1 : i % 3 === 1 ? 2 : 5) as any);
            break;
          case 5:
            viewer.clock.tick();
            break;
          case 6:
            controller.stopDroneFlight();
            break;
        }
      } catch (err: any) {
        errorCount++;
      }
    }
    const durationMs = Date.now() - startMs;

    assertCheck(
      'T6.1: 10,000 rapid cycles executed without throwing exceptions',
      errorCount === 0,
      `Encountered ${errorCount} exceptions during rapid toggling`
    );

    assertCheck(
      'T6.2: No NaN or corrupted telemetry produced during 10k rapid toggles',
      !nanDetected,
      'NaN values detected in telemetry payload!'
    );

    assertCheck(
      'T6.3: Clock listeners do not multiply infinitely',
      viewer.clock.onTick.listeners.size <= 1,
      `Clock listeners multiplied to ${viewer.clock.onTick.listeners.size}`
    );

    console.log(`      (10,000 actions completed in ${durationMs}ms, ${telemetryCount} telemetries emitted)`);
    controller.destroy();
  }

  // TEST 7: Single-point and Degenerate Polyline Boundaries
  {
    const { controller, viewer } = await createInitializedController();
    let crashed = false;
    try {
      // 1 point polyline
      controller.setTrailPolyline({
        id: 'single-pt',
        points: [{ lat: 27.9881, lng: 86.9250, altitude: 4000 }],
        color: '#fff',
      });
      controller.startDroneFlight();
    } catch {
      crashed = true;
    }

    assertCheck(
      'T7.1: Single-point degenerate polyline does not crash startDroneFlight',
      !crashed,
      'Controller threw unhandled exception on 1-point polyline'
    );

    // Duplicate points with distance 0
    let nanOnZeroDist = false;
    try {
      controller.setTrailPolyline({
        id: 'dup-pts',
        points: [
          { lat: 27.9881, lng: 86.9250, altitude: 4000 },
          { lat: 27.9881, lng: 86.9250, altitude: 4000 },
        ],
        color: '#fff',
      });
      controller.onDroneTelemetry((t) => {
        if (Number.isNaN(t.slopePercent) || Number.isNaN(t.pitchDegrees)) {
          nanOnZeroDist = true;
        }
      });
      controller.startDroneFlight();
      viewer.clock.tick();
    } catch {
      nanOnZeroDist = true;
    }

    assertCheck(
      'T7.2: Duplicate points (0 distance) do not produce NaN slope/pitch',
      !nanOnZeroDist,
      'Zero distance produced NaN slope or pitch'
    );

    controller.destroy();
  }

  // TEST 8: Controller Destroy Lifecycle
  {
    const { controller, viewer } = await createInitializedController();
    controller.setTrailPolyline(samplePolyline);
    controller.startDroneFlight();

    controller.destroy();

    assertCheck(
      'T8.1: Destroy marks viewer as destroyed',
      viewer.isDestroyed() === true,
      `Expected isDestroyed()=true, got ${viewer.isDestroyed()}`
    );

    assertCheck(
      'T8.2: Destroy cleans up clock onTick listeners',
      viewer.clock.onTick.listeners.size === 0,
      `Clock onTick listeners left behind after destroy: ${viewer.clock.onTick.listeners.size}`
    );
  }

  // TEST 9: Cross-mode interaction: Does starting a tour / orbit stop drone flight?
  {
    const { controller, viewer } = await createInitializedController();
    controller.setTrailPolyline(samplePolyline);
    controller.startDroneFlight();

    // Now start orbital tour
    controller.startOrbitalRotation({ lat: 27.9881, lng: 86.9250, altitude: 8848 });

    assertCheck(
      'T9.1: Starting orbital rotation must stop active drone flight',
      viewer.clock.onTick.listeners.size === 1,
      `Both drone flight tick listener AND orbit listener active simultaneously! Listener count: ${viewer.clock.onTick.listeners.size}`
    );
    controller.destroy();
  }

  console.log('\n=== ADVERSARIAL TEST RESULTS SUMMARY ===');
  console.log(`Passed Checks: ${passedChecks}`);
  console.log(`Failed Checks: ${failedChecks}`);
  if (issues.length > 0) {
    console.log('\nDiscovered Issues:');
    issues.forEach((iss, i) => console.log(` ${i + 1}. ${iss}`));
  }
}

runAdversarialSuite().catch(console.error);
