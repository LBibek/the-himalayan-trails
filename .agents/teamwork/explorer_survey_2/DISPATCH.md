# Survey Dispatch: Explorer 2 (Custom GPX/KML Route Importer & Waypoint Studio)

## Target
Investigate custom route file import (GPX/KML), trackpoint parsing, waypoint management, and elevation profile generation for R2.

## Key Investigation Items:
1. Examine Map Explorer and Itinerary Planner pages/components (`src/app/...`, `src/components/...`).
2. Where are trails loaded from, and how are trail coordinates/waypoints represented?
3. Check existing XML/GPX/KML parsing libraries or existing parsers in `package.json` and codebase.
4. How are total distance, elevation gain, and elevation loss computed across coordinates?
5. How are elevation profiles plotted (Recharts charts, data structures)?
6. How are waypoints rendered on 2D Leaflet and 3D Cesium, and what UI exists for adding/editing/deleting custom waypoints?
7. Identify exact files, components, and state management required to implement drag-and-drop GPX/KML import and Waypoint Studio.
8. Review `c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\ORIGINAL_REQUEST.md` for all R2 requirements.

## Output
Write your comprehensive findings and recommendations to:
`c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_survey_2\handoff.md`

## 2026-09-26T15:43:37Z
You are Explorer 2 (Custom GPX/KML Route Importer & Waypoint Studio).
Your working directory is:
c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_survey_2

MANDATORY FIRST STEP:
Read the user's verbatim request in:
c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\ORIGINAL_REQUEST.md
Also read your dispatch task details in:
c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_survey_2\DISPATCH.md

Investigate custom route file import (GPX/KML), trackpoint parsing, waypoint management, and elevation profile generation for R2:
1. Examine Map Explorer and Itinerary Planner pages/components (`src/app/...`, `src/components/...`).
2. Where are trails loaded from, and how are trail coordinates/waypoints represented?
3. Check existing XML/GPX/KML parsing libraries or existing parsers in `package.json` and codebase.
4. How are total distance, elevation gain, and elevation loss computed across coordinates?
5. How are elevation profiles plotted (Recharts charts, data structures)?
6. How are waypoints rendered on 2D Leaflet and 3D Cesium, and what UI exists for adding/editing/deleting custom waypoints?
7. Identify exact files, components, and state management required to implement drag-and-drop GPX/KML import and Waypoint Studio.

Deliver a comprehensive handoff report to:
c:\Users\acer\Desktop\The Himalayan Trails\.agents\teamwork\explorer_survey_2\handoff.md
Update your progress.md regularly with Last visited timestamps.
When complete, send a message back to the orchestrator.
