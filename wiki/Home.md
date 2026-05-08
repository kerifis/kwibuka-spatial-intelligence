# KWIBUKA Spatial Intelligence Wiki

This wiki documents the full repository for `kwibuka-spatial-intelligence`, a Vite + D3 dashboard for exploring the 1994 Genocide against the Tutsi in Rwanda through a 100-day spatial timeline, geolocated events, memorial sites, RPF advance routes, and archival testimony media.

## Quick Facts

| Area | Detail |
| --- | --- |
| App type | Static client-side web app |
| Framework | Vite with vanilla JavaScript modules |
| Visualization | D3 SVG map layers |
| Data source shape | Local JSON files in `data/` |
| Main entry | `index.html`, `src/main.js` |
| Build output | `dist/` |
| Deployment | Vercel |
| Current model | 1,000,000 estimated lives across 102 timeline days |

## Wiki Map

- [Repository Guide](Repository-Guide.md) - directory layout, important files, assets, and how the repo is organized.
- [Architecture](Architecture.md) - application lifecycle, rendering flow, module boundaries, and state ownership.
- [Feature Guide](Feature-Guide.md) - user-facing features and where they live in the code.
- [Data Model](Data-Model.md) - schemas, current dataset counts, coordinate rules, and extension workflow.
- [Module Reference](Module-Reference.md) - source module responsibilities and exported APIs.
- [Development Guide](Development-Guide.md) - setup, local server, validation, build, and common maintenance tasks.
- [Deployment Guide](Deployment-Guide.md) - Vercel project notes, preview deployments, production builds, and release checklist.
- [Operations Runbook](Operations-Runbook.md) - route validation, troubleshooting, browser checks, and known risks.

## Current Repository Snapshot

The project currently contains:

- 40 historical events in `data/events.json`
- 31 authored memorial records in `data/memorials.json`
- 9 RPF unit routes and 115 route waypoints in `data/rpfAdvance.json`
- 17 map city labels in `data/cities.json`
- 100 testimony videos in the `VIDEO_POOL` inside `src/infocard.js` (3 videos per memorial slot m1–m31, province-keyed sets for event cards)
- 27 JPG portrait assets, 1 MP3 audio asset, and 1 SVG historical map asset in `public/`

The memorial layer synthesizes additional local memorial markers at runtime until the visible set reaches 133 sites. Those synthetic entries are generated client-side in `src/memorials.js`; they are not persisted back to `data/memorials.json`.

## Core Concepts

- The map is an SVG scene assembled by D3. `src/map.js` creates the projection, map layers, zoom behavior, Rwanda border fallback, city labels, and province overlays.
- The timeline drives the entire app. `src/main.js` calls `update(day)`, and each visual subsystem re-renders from current day, active events, and display mode.
- Data is intentionally local and readable. New events, memorials, cities, province settings, and RPF routes can be added by editing JSON files.
- The casualty model is analytical, not archival ground truth. `src/sigmoid.js` provides a logistic model for dashboard orientation and briefing.
- RPF routes render as straight waypoint-to-waypoint segments (`d3.curveLinear`) with dense intermediate waypoints so routes follow Rwanda's road corridors and stay within the national border.
- Trail fading uses three layered full-path draws at different opacities, driven by a 5-second real-time timer in `src/rpf.js`.

## Start Here

```bash
npm install
npm run dev
```

Open the dev server URL printed by Vite, usually `http://localhost:5173`. If other Vite servers are already running, Vite selects the next available port (e.g. `5179`).

Always verify changes on the local server before deploying to production with `vercel --prod`.

