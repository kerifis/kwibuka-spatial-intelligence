# Architecture

## System Shape

The app is a static browser application. Vite serves and bundles ES modules; the browser runs all rendering, timeline state, and data loading. The app has no first-party backend.

External runtime calls:

- `world-atlas` topology from jsDelivr in `src/map.js`
- `geoBoundaries` ADM1 metadata in `src/map.js`
- YouTube thumbnail/embed URLs in `src/infocard.js`
- Gemini API only when the user supplies a key in `src/gemini.js`

If topology requests fail, the map uses a local fallback Rwanda border polygon embedded in `src/map.js`.

## Boot Sequence

1. Browser loads `index.html`.
2. Vite module script loads `src/main.js`.
3. `main.js` imports CSS, JSON data, and all feature modules.
4. `init()` runs:
   - calls `initMap(container)`
   - hides the loading label
   - builds province bars and timeline structure
   - binds timeline drag/playback callbacks
   - sets initial playback speed to `0.5`
   - renders day 0
   - starts playback
   - binds resize, coordinate display, audio, and UI globals

## Update Loop

The app's central function is `update(day)` in `src/main.js`.

For every timeline day it computes:

- current date via `dayToDate(day)`
- current phase via `getPhase(day)`
- active events via `events.filter(e => e.day <= day)`
- cumulative lives via `sigmoid(day)`
- daily rate via `sigmoidRate(day)`
- current display mode from `filters.js`

Then it updates:

1. Header date/day/phase.
2. Timeline progress.
3. Stats panel.
4. Heatmap layer.
5. RPF route layer.
6. Event marker layer.
7. Memorial marker layer.
8. Province death-count overlay.
9. Active event list.
10. AI synthesis button lock state.

## SVG Layer Stack

`src/map.js` creates one root SVG group, then appends layers in z-order:

```text
zoom-root
|-- grid-layer
|-- map-layer
|-- heat-layer
|-- rpf-layer
|-- prov-layer
|-- marker-layer
`-- label-layer
```

All layers live inside `zoom-root`, so D3 zoom and pan transforms apply consistently. Floating HTML elements such as info cards are positioned by applying the current zoom transform to SVG-space marker coordinates.

## State Ownership

| State | Owner | Notes |
| --- | --- | --- |
| `currentDay` | `main.js` | Global app day for update callbacks. |
| `currentMode` | `filters.js` | `std`, `nvg`, `crt`, or `flir`. |
| `currentZoomTransform` | `map.js` | D3 zoom transform used for coordinate inversion and card positioning. |
| RPF layer visibility | `rpf.js` | Toggled by `toggleRpfLayer()`. |
| RPF fade timer | `rpf.js` | Dispatches `rpf-fade-tick`; `main.js` re-renders current day. |
| Memorial visibility | `memorials.js` | Toggled by `toggleMemorials()`. |
| Historical map visibility | `hist.js` | Toggles CSS/HTML overlay. |
| Testimony modal page | `infocard.js` | Private `_tPage` for video pagination. |

## Rendering Strategy

Most visual modules clear and redraw their layer each update. This keeps the implementation simple and avoids stale SVG state.

Examples:

- `renderHeatmap()` clears `gHeat`.
- `renderMarkers()` clears `gMark`.
- `renderRpfAdvance()` clears `gRpf`.

This is acceptable for the current dataset size. If the dataset grows to thousands of points, the first performance improvement should be keyed D3 joins instead of full clears.

## Historical Overlay

The HIST mode does not replace the SVG map. It displays an HTML overlay containing `rwanda-1994-administrative-divisions.svg` while keeping the SVG visible so RPF routes can remain on top.

## AI Synthesis Layer

`src/gemini.js` is optional. It prompts for a Gemini API key and stores it in `localStorage` under `GEMINI_API_KEY`. It sends a short day-specific briefing prompt to Gemini and renders the result in the AI modal.

