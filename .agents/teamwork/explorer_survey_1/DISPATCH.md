# Survey Dispatch: Explorer 1 (Map Architecture & 3D Drone Flight Path Simulation)

## 2026-09-26T15:43:00Z

## Target
Investigate the existing map system and 3D terrain visualization to prepare architecture for R1: 3D Cesium Drone Flight Path Simulator & Telemetry.

## Key Investigation Items:
1. Examine `src/components/map/` or wherever map controllers exist (`IMapController`, `CesiumController`, `LeafletController`, `MapEngineManager`).
2. How are trails and polylines currently structured and passed into Leaflet / Cesium?
3. How is Cesium initialized (version, terrain provider, viewer, entities, clock, animation)?
4. What mechanisms exist for camera movement (e.g. `flyTo`, sample positions, orientation, pitch/roll/heading)?
5. How is the Recharts elevation graph implemented and how does it currently interact with map controllers (scrubbing, hovering, syncing)?
6. Identify exact files, functions, and interfaces that need to be extended for drone flight (Play, Pause, Speed 1x/2x/5x, Restart, slope pitch, HUD telemetry).
7. Review `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\ORIGINAL_REQUEST.md` for all R1 requirements.

## Output
Write your comprehensive findings and recommendations to:
`c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_survey_1\handoff.md`
