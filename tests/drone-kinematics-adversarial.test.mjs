import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CesiumController } from '../src/lib/map/CesiumController.ts';

// Helper to create a lightweight mock Cesium environment for controller testing
function createMockCesiumController() {
  const ctrl = new CesiumController();
  let tickCallback = null;

  ctrl.viewer = {
    clock: {
      onTick: {
        addEventListener: (fn) => {
          tickCallback = fn;
        },
        removeEventListener: (fn) => {
          if (tickCallback === fn) tickCallback = null;
        },
      },
    },
    scene: {
      requestRenderMode: true,
      requestRender: () => {},
    },
    camera: {
      setView: () => {},
      cancelFlight: () => {},
    },
    entities: {
      add: (opts) => ({ id: opts?.id || 'mock-entity' }),
      getById: () => null,
      remove: () => {},
    },
  };

  ctrl.Cesium = {
    Cartesian3: {
      fromDegrees: (lng, lat, alt) => ({ x: lng, y: lat, z: alt }),
    },
    Color: {
      BLACK: { r: 0, g: 0, b: 0, a: 1 },
      fromCssColorString: () => ({ r: 1, g: 0.8, b: 0, a: 1 }),
    },
    LabelStyle: { FILL_AND_OUTLINE: 0 },
    Cartesian2: function (x, y) {
      return { x, y };
    },
    Math: {
      toRadians: (d) => (d * Math.PI) / 180,
    },
  };

  return {
    ctrl,
    triggerTick: () => {
      if (tickCallback) tickCallback();
    },
    isTickListenerAttached: () => Boolean(tickCallback),
  };
}

describe('Adversarial Challenge: 3D Cesium Drone Kinematics & Speed Scaling', () => {
  // =========================================================================
  // SUITE 1: Geodesic Distance Formulas & Accumulation Mechanics
  // =========================================================================
  describe('1. Geodesic Distance Formulas & Accumulation Mechanics', () => {
    test('Calculates geodesic distances across major Himalayan routes within 2% expected tolerance', () => {
      const { ctrl } = createMockCesiumController();

      // Namche Bazaar (27.8069, 86.7140) -> Tengboche (27.8358, 86.7644)
      ctrl.setupDroneFlightPath({
        id: 'namche-tengboche',
        points: [
          { lat: 27.8069, lng: 86.7140, altitude: 3440 },
          { lat: 27.8358, lng: 86.7644, altitude: 3867 },
        ],
      });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });
      ctrl.seekDroneFlight(0);

      // Expected great-circle distance is ~5.91 - 5.95 km
      const distKm = snap.totalDistanceMeters / 1000;
      assert.ok(
        Math.abs(distKm - 5.91) < 0.15,
        `Expected ~5.91 km between Namche and Tengboche, got ${distKm.toFixed(3)} km`
      );
    });

    test('Boundary invariants: Coincident coordinates (zero distance) return 0 without NaN', () => {
      const { ctrl } = createMockCesiumController();

      ctrl.setupDroneFlightPath({
        id: 'coincident-points',
        points: [
          { lat: 27.9881, lng: 86.9250, altitude: 8848 },
          { lat: 27.9881, lng: 86.9250, altitude: 8848 },
        ],
      });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });
      ctrl.seekDroneFlight(0);

      assert.equal(snap.totalDistanceMeters, 0);
      assert.equal(snap.currentDistanceMeters, 0);
      assert.ok(!Number.isNaN(snap.progressRatio), 'Progress ratio must not be NaN');
      assert.ok(!Number.isNaN(snap.pitchDegrees), 'Pitch must not be NaN');
      assert.ok(!Number.isNaN(snap.headingDegrees), 'Heading must not be NaN');
    });

    test('Strict monotonic accumulation across multi-point trail polyline', () => {
      const { ctrl } = createMockCesiumController();

      // 4-point segment
      const points = [
        { lat: 27.80, lng: 86.70, altitude: 3000 },
        { lat: 27.81, lng: 86.71, altitude: 3200 },
        { lat: 27.82, lng: 86.72, altitude: 3400 },
        { lat: 27.83, lng: 86.73, altitude: 3600 },
      ];

      ctrl.setupDroneFlightPath({ id: 'monotonic-check', points });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });

      ctrl.seekDroneFlight(0);
      const total = snap.totalDistanceMeters;
      assert.ok(total > 3000, `Total distance should be substantial, got ${total}m`);

      // Verify intermediate points have non-decreasing distances
      ctrl.seekDroneFlight(total * 0.33);
      const d1 = snap.currentDistanceMeters;

      ctrl.seekDroneFlight(total * 0.66);
      const d2 = snap.currentDistanceMeters;

      ctrl.seekDroneFlight(total);
      const d3 = snap.currentDistanceMeters;

      assert.ok(0 < d1 && d1 < d2 && d2 < d3 && d3 === total, 'Distances must be strictly increasing');
    });
  });

  // =========================================================================
  // SUITE 2: Segment Interpolation & Edge Boundaries (s=0, s=total, s>total, s<0)
  // =========================================================================
  describe('2. Segment Interpolation & Edge Boundaries', () => {
    test('Boundary s = 0: Returns exact initial coordinate, altitude, and progress ratio 0', () => {
      const { ctrl } = createMockCesiumController();
      const pStart = { lat: 27.7000, lng: 86.5000, altitude: 2800 };
      const pEnd = { lat: 27.7500, lng: 86.5500, altitude: 3500 };

      ctrl.setupDroneFlightPath({ id: 'boundary-start', points: [pStart, pEnd] });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });
      ctrl.seekDroneFlight(0);

      assert.equal(snap.currentDistanceMeters, 0);
      assert.equal(snap.progressRatio, 0);
      assert.equal(snap.currentPosition.lat, pStart.lat);
      assert.equal(snap.currentPosition.lng, pStart.lng);
      assert.equal(snap.currentAltitudeMeters, pStart.altitude);
      assert.equal(snap.remainingDistanceKm, Math.round((snap.totalDistanceMeters / 1000) * 10) / 10);
    });

    test('Boundary s = D_total: Returns exact final coordinate, altitude, and progress ratio 1.0', () => {
      const { ctrl } = createMockCesiumController();
      const pStart = { lat: 27.7000, lng: 86.5000, altitude: 2800 };
      const pEnd = { lat: 27.7500, lng: 86.5500, altitude: 3500 };

      ctrl.setupDroneFlightPath({ id: 'boundary-end', points: [pStart, pEnd] });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });

      // Seek using progress ratio 1.0
      ctrl.seekDroneFlight(1.0);

      assert.equal(snap.currentDistanceMeters, snap.totalDistanceMeters);
      assert.equal(snap.progressRatio, 1);
      assert.equal(snap.remainingDistanceKm, 0);
      assert.equal(snap.currentPosition.lat, pEnd.lat);
      assert.equal(snap.currentPosition.lng, pEnd.lng);
      assert.equal(snap.currentAltitudeMeters, pEnd.altitude);
    });

    test('Boundary s > D_total (overshoot): Clamps cleanly to total distance without overflow', () => {
      const { ctrl } = createMockCesiumController();
      ctrl.setupDroneFlightPath({
        id: 'overshoot',
        points: [
          { lat: 27.0, lng: 86.0, altitude: 2000 },
          { lat: 27.01, lng: 86.0, altitude: 2500 },
        ],
      });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });

      // Overshoot by seeking 100,000 meters on a ~1112m trail
      ctrl.seekDroneFlight(100000);

      assert.equal(snap.currentDistanceMeters, snap.totalDistanceMeters);
      assert.equal(snap.progressRatio, 1);
      assert.equal(snap.remainingDistanceKm, 0);
      assert.equal(snap.currentAltitudeMeters, 2500);
    });

    test('Boundary s < 0 (undershoot): Clamps cleanly to 0 without underflow', () => {
      const { ctrl } = createMockCesiumController();
      ctrl.setupDroneFlightPath({
        id: 'undershoot',
        points: [
          { lat: 27.0, lng: 86.0, altitude: 2000 },
          { lat: 27.01, lng: 86.0, altitude: 2500 },
        ],
      });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });

      ctrl.seekDroneFlight(-9999);

      assert.equal(snap.currentDistanceMeters, 0);
      assert.equal(snap.progressRatio, 0);
      assert.equal(snap.currentPosition.lat, 27.0);
      assert.equal(snap.currentAltitudeMeters, 2000);
    });

    test('Degenerate routes (empty, single point) handle safely without crashes', () => {
      const { ctrl } = createMockCesiumController();

      // Empty points
      ctrl.setupDroneFlightPath({ id: 'empty', points: [] });
      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });
      ctrl.seekDroneFlight(0);

      // Single point
      ctrl.setupDroneFlightPath({ id: 'single', points: [{ lat: 27.5, lng: 86.5 }] });
      ctrl.seekDroneFlight(0);

      assert.ok(snap !== null, 'Telemetry snapshot should be created without crashing');
    });
  });

  // =========================================================================
  // SUITE 3: Slope Gradient Pitch Clamping & Dynamic Tilt
  // =========================================================================
  describe('3. Slope Gradient Pitch Clamping & Dynamic Tilt', () => {
    test('Extreme vertical ascent (+5000m cliff) is strictly clamped to +10 degrees pitch', () => {
      const { ctrl } = createMockCesiumController();

      // 5000m vertical climb over ~2.2 meters horizontal
      ctrl.setupDroneFlightPath({
        id: 'extreme-ascent',
        points: [
          { lat: 27.00000, lng: 86.00000, altitude: 2000 },
          { lat: 27.00002, lng: 86.00000, altitude: 7000 },
        ],
      });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });
      ctrl.seekDroneFlight(0);

      assert.equal(snap.pitchDegrees, 10, 'Ascent pitch must be clamped to +10 degrees max');
      assert.ok(snap.slopePercent > 100000, 'Slope percentage should reflect extreme vertical grade');
    });

    test('Extreme vertical descent (-5000m abyss) is strictly clamped to -45 degrees pitch', () => {
      const { ctrl } = createMockCesiumController();

      // 5000m vertical drop over ~2.2 meters horizontal
      ctrl.setupDroneFlightPath({
        id: 'extreme-descent',
        points: [
          { lat: 27.00000, lng: 86.00000, altitude: 7000 },
          { lat: 27.00002, lng: 86.00000, altitude: 2000 },
        ],
      });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });
      ctrl.seekDroneFlight(0);

      assert.equal(snap.pitchDegrees, -45, 'Descent pitch must be clamped to -45 degrees min');
      assert.ok(snap.slopePercent < -100000, 'Slope percentage should reflect extreme negative grade');
    });

    test('Flat horizontal terrain (zero elevation change) produces 0% slope and -20 degrees base pitch', () => {
      const { ctrl } = createMockCesiumController();

      ctrl.setupDroneFlightPath({
        id: 'flat-valley',
        points: [
          { lat: 27.00, lng: 86.00, altitude: 3500 },
          { lat: 27.01, lng: 86.00, altitude: 3500 },
        ],
      });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });
      ctrl.seekDroneFlight(0);

      assert.equal(snap.slopePercent, 0);
      assert.equal(snap.pitchDegrees, -20);
    });

    test('Moderate Himalayan ascent produces proportional dynamic pitch tilt', () => {
      const { ctrl } = createMockCesiumController();

      // ~1112m distance, 200m climb = ~18% slope grade
      ctrl.setupDroneFlightPath({
        id: 'moderate-climb',
        points: [
          { lat: 27.00, lng: 86.00, altitude: 3000 },
          { lat: 27.01, lng: 86.00, altitude: 3200 },
        ],
      });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });
      ctrl.seekDroneFlight(0);

      assert.ok(snap.slopePercent > 15 && snap.slopePercent < 20, `Slope percent should be ~18%, got ${snap.slopePercent}`);
      // Base pitch is -20. With climb, pitch increases towards 0
      assert.ok(snap.pitchDegrees > -20 && snap.pitchDegrees <= 10, `Pitch should tilt up from -20, got ${snap.pitchDegrees}`);
    });
  });

  // =========================================================================
  // SUITE 4: Lookahead Tangent Heading Calculation & Singularities
  // =========================================================================
  describe('4. Lookahead Tangent Heading Calculation & Singularities', () => {
    test('Calculates cardinal forward headings accurately', () => {
      const { ctrl } = createMockCesiumController();
      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });

      // Due North (lat increases)
      ctrl.setupDroneFlightPath({
        id: 'north',
        points: [
          { lat: 27.0, lng: 86.0, altitude: 3000 },
          { lat: 27.1, lng: 86.0, altitude: 3000 },
        ],
      });
      ctrl.seekDroneFlight(0);
      assert.equal(snap.headingDegrees, 0, 'Due North heading should be 0°');

      // Due East (lng increases)
      ctrl.setupDroneFlightPath({
        id: 'east',
        points: [
          { lat: 27.0, lng: 86.0, altitude: 3000 },
          { lat: 27.0, lng: 86.1, altitude: 3000 },
        ],
      });
      ctrl.seekDroneFlight(0);
      assert.ok(Math.abs(snap.headingDegrees - 90) <= 1, `Due East heading should be ~90°, got ${snap.headingDegrees}°`);

      // Due South (lat decreases)
      ctrl.setupDroneFlightPath({
        id: 'south',
        points: [
          { lat: 27.1, lng: 86.0, altitude: 3000 },
          { lat: 27.0, lng: 86.0, altitude: 3000 },
        ],
      });
      ctrl.seekDroneFlight(0);
      assert.equal(snap.headingDegrees, 180, 'Due South heading should be 180°');

      // Due West (lng decreases)
      ctrl.setupDroneFlightPath({
        id: 'west',
        points: [
          { lat: 27.0, lng: 86.1, altitude: 3000 },
          { lat: 27.0, lng: 86.0, altitude: 3000 },
        ],
      });
      ctrl.seekDroneFlight(0);
      assert.ok(Math.abs(snap.headingDegrees - 270) <= 1, `Due West heading should be ~270°, got ${snap.headingDegrees}°`);
    });

    test('Empirical singularity observation: At s = D_total, lookahead clamp causes bearing to default to 0° without NaN', () => {
      const { ctrl } = createMockCesiumController();

      // Eastbound trail (heading is 90° along the route)
      ctrl.setupDroneFlightPath({
        id: 'east-trail',
        points: [
          { lat: 27.0, lng: 86.0, altitude: 3000 },
          { lat: 27.0, lng: 86.05, altitude: 3000 },
        ],
      });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });

      // Mid-route
      ctrl.seekDroneFlight(snap.totalDistanceMeters * 0.5);
      assert.ok(Math.abs(snap.headingDegrees - 90) <= 1, 'Mid-flight heading is 90°');

      // End of route
      ctrl.seekDroneFlight(snap.totalDistanceMeters);
      // Empirical Challenger finding: At exactly s = D_total, aheadPoint === currentPoint, so atan2(0,0)=0 -> headingDegrees = 0
      assert.equal(snap.headingDegrees, 0, 'Terminal point safely yields 0° without throwing NaN');
    });
  });

  // =========================================================================
  // SUITE 5: Speed Multipliers (1x, 2x, 5x) & Time-Delta Physics Stability
  // =========================================================================
  describe('5. Speed Multipliers (1x, 2x, 5x) & Time-Delta Physics Stability', () => {
    test('Ground speeds adhere strictly to specification (1x=50 km/h, 2x=100 km/h, 5x=250 km/h)', () => {
      const { ctrl } = createMockCesiumController();
      ctrl.setupDroneFlightPath({
        id: 'speed-specs',
        points: [
          { lat: 27.0, lng: 86.0, altitude: 3000 },
          { lat: 27.1, lng: 86.0, altitude: 3000 },
        ],
      });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });

      ctrl.setDroneFlightSpeed(1);
      assert.equal(snap.speedMultiplier, 1);
      assert.equal(snap.currentSpeedKmh, 50);

      ctrl.setDroneFlightSpeed(2);
      assert.equal(snap.speedMultiplier, 2);
      assert.equal(snap.currentSpeedKmh, 100);

      ctrl.setDroneFlightSpeed(5);
      assert.equal(snap.speedMultiplier, 5);
      assert.equal(snap.currentSpeedKmh, 250);
    });

    test('Next Landmark ETA scales inversely with speed multiplier (ETA_5x = ETA_1x / 5)', () => {
      const { ctrl } = createMockCesiumController();

      // Route with checkpoint 5 km ahead
      ctrl.setupDroneFlightPath(
        {
          id: 'landmark-eta',
          points: [
            { lat: 27.0, lng: 86.0, altitude: 3000 },
            { lat: 27.1, lng: 86.0, altitude: 3000 },
          ],
        },
        [
          { id: 'camp-1', name: 'High Camp', coordinates: { lat: 27.05, lng: 86.0 } },
        ]
      );

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });

      ctrl.seekDroneFlight(0);
      ctrl.setDroneFlightSpeed(1);
      const eta1x = snap.nextLandmark?.etaSeconds;
      assert.ok(eta1x && eta1x > 0, '1x ETA must be defined');

      ctrl.setDroneFlightSpeed(2);
      const eta2x = snap.nextLandmark?.etaSeconds;
      assert.ok(Math.abs(eta2x - Math.round(eta1x / 2)) <= 2, `2x ETA (${eta2x}) should be ~half of 1x ETA (${eta1x})`);

      ctrl.setDroneFlightSpeed(5);
      const eta5x = snap.nextLandmark?.etaSeconds;
      assert.ok(Math.abs(eta5x - Math.round(eta1x / 5)) <= 2, `5x ETA (${eta5x}) should be ~one-fifth of 1x ETA (${eta1x})`);
    });

    test('Frame lag spike protection: dt is clamped to <= 0.1s preventing physics teleportation', () => {
      const { ctrl, triggerTick } = createMockCesiumController();

      ctrl.setupDroneFlightPath({
        id: 'lag-test',
        points: [
          { lat: 27.0, lng: 86.0, altitude: 3000 },
          { lat: 27.05, lng: 86.0, altitude: 3000 },
        ],
      });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });

      ctrl.startDroneFlight({ speedMultiplier: 5 }); // 250 km/h = 69.44 m/s
      assert.equal(snap.currentDistanceMeters, 0);

      // Normal tick: 16ms
      triggerTick();
      const dist1 = snap.currentDistanceMeters;

      // Simulate browser freezing for 10 seconds (dt would be 10s without clamp = ~694m jump!)
      const origNow = performance.now;
      let mockTime = origNow.call(performance) + 10000;
      performance.now = () => mockTime;

      triggerTick();
      const dist2 = snap.currentDistanceMeters;
      const jumpMeters = dist2 - dist1;

      // Restored
      performance.now = origNow;

      // Maximum advance per frame must be bounded by dt_max (0.1s) * 69.44 m/s = ~6.94m
      assert.ok(
        jumpMeters <= 8,
        `Distance jump after 10s lag spike was ${jumpMeters}m (expected <= 8m due to 0.1s dt clamp)`
      );
    });

    test('Autonomous flight completion: Clamps to totalDistance, halts flight, and restores requestRenderMode', () => {
      const { ctrl, triggerTick } = createMockCesiumController();

      ctrl.setupDroneFlightPath({
        id: 'completion-test',
        points: [
          { lat: 27.0, lng: 86.0, altitude: 3000 },
          { lat: 27.002, lng: 86.0, altitude: 3000 },
        ],
      });

      let snap;
      ctrl.onDroneTelemetry((t) => { snap = t; });

      // Start flight at 5x speed
      ctrl.startDroneFlight({ speedMultiplier: 5, initialDistanceMeters: snap.totalDistanceMeters - 10 });
      assert.equal(snap.isPlaying, true);
      assert.equal(ctrl.viewer.scene.requestRenderMode, false, 'requestRenderMode should be false during flight');

      // Trigger several ticks to cross the finish line
      for (let i = 0; i < 50; i++) {
        triggerTick();
      }

      assert.equal(snap.currentDistanceMeters, snap.totalDistanceMeters);
      assert.equal(snap.isPlaying, false, 'isPlaying should be false after reaching end');
      assert.equal(ctrl.viewer.scene.requestRenderMode, true, 'requestRenderMode must be restored to true');
    });
  });
});
