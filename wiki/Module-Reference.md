# Module Reference

## `src/main.js`

Main app orchestrator.

Responsibilities:

- imports CSS, JSON data, and feature modules
- owns `currentDay`
- defines `update(day)`
- initializes map, timeline, stats, playback, audio volume
- binds HTML inline handlers to `window`
- listens for `rpf-fade-tick`

Important globals bound for HTML:

- `setMode`
- `togglePlay`
- `setSpd`
- `toggleMemorials`
- `toggleRpf`
- `toggleHist`
- `openTestimonies`
- `openPodcast`
- `analyzeMatrix`
- `toggleAudio`
- `toggleDeathCount`
- `setZoom`, `zoomIn`, `zoomOut`

## `src/map.js`

D3 map foundation.

Exports:

- `projection`, `pathGen`, `svg`
- `gGrid`, `gMap`, `gHeat`, `gRpf`, `gMark`, `gLbl`, `gProv`
- `currentZoomTransform`
- `isPointInRwanda(lng, lat)`
- `initMap(container)`
- `renderProvLabels(day)`
- `setMapZoom(scale)`
- `handleResize(container)`

Notes:

- Contains the fallback Rwanda border polygon and Lake Kivu polygon.
- Loads Natural Earth topology and geoBoundaries province data when network is available.
- Creates SVG layer groups consumed by other rendering modules.

## `src/sigmoid.js`

Pure model/date helpers.

Exports:

- `TOTAL_LIVES`
- `TOTAL_DAYS`
- `START_DATE`
- `sigmoid(day, k, mid)`
- `sigmoidRate(day, k, mid)`
- `provSigmoid(day, onset, share)`
- `dayToDate(day)`
- `formatDate(dt)`

## `src/timeline.js`

Timeline UI and playback.

Exports:

- `pausePlayback()`
- `getPhase(day)`
- `buildTimeline()`
- `updateTimelinePosition(day, mode)`
- `bindTimelineEvents(onDayChange)`
- `togglePlay(onTick, getCurrentDay)`
- `setSpeed(s, onTick, getCurrentDay)`

Private state:

- `playing`
- `speed`
- `interval`

## `src/heatmap.js`

Heat layer renderer.

Exports:

- `renderHeatmap(events, day, mode)`

It draws per-event heat circles and province-level ambient heat. It clears and redraws `gHeat` each update.

## `src/markers.js`

Historical event marker renderer.

Exports:

- `renderMarkers(activeEvents, day, mode)`

It scales marker size using the max `lives` value in `data/events.json`, adds tooltips, and opens info cards.

## `src/memorials.js`

Memorial marker renderer.

Exports:

- `showMemorials`
- `toggleMemorials()`
- `renderMemorialMarkers(mode)`

Important behavior:

- Memorials are hidden by default.
- If fewer than 133 authored memorial records exist, synthetic local memorials are generated at random in-Rwanda points.
- Rendering skips any memorial whose coordinates fail `isPointInRwanda()`.

## `src/rpf.js`

RPF offensive route renderer.

Exports:

- `showRpfLayer`
- `toggleRpfLayer()`
- `renderRpfAdvance(day, mode)`

Private helpers:

- `projectedPoint(point)`
- `routeState(route, day)`
- `modeColor(route, mode)`
- `showRpfCard(route, point, screenPos)`

Important behavior:

- Interpolates current unit position between route waypoints.
- Draws straight lines with `d3.curveLinear`.
- Uses a fade timer and `rpf-fade-tick` custom event.
- Renders commander labels and clickable unit markers.

## `src/infocard.js`

Floating card, video pool, and testimonies modal.

Exports:

- `showInfoCard(item, screenPos)`
- `showTab(tabName)`
- `closeInfoCard()`
- `openTestimoniesModal(page)`
- `testimoniesPrev()`
- `testimoniesNext()`

Major internal data:

- `VIDEO_POOL`: 100 YouTube records
- `MEMORIAL_VIDEOS`: memorial id to video list
- `EVENT_VIDEOS_BY_PROV`: province to event video list
- `DEFAULT_VIDEOS`

Card modes:

- Event card
- Memorial card
- RPF command card

## `src/stats.js`

Stats panel renderer.

Exports:

- `buildProvinceBars()`
- `updateStats(cumulativeLives, rate, activeEvents, day)`
- `renderEventList(activeEvents)`

Tracks peak daily rate within the current browser session.

## `src/filters.js`

Display mode manager.

Exports:

- `currentMode`
- `setMode(mode, onUpdate)`

Modes:

- `std`
- `nvg`
- `crt`
- `flir`

## `src/hist.js`

Historical map overlay state.

Exports:

- `toggleHistLayer()`
- `hideHistLayer()`

Toggles CSS classes and shows/hides `#histView`.

## `src/gemini.js`

Optional AI synthesis integration.

Exports:

- `synthesizeMatrix(day, cumul, rate, activeEvents)`

It prompts for a Gemini API key, stores it in `localStorage`, sends a day-specific briefing prompt, and returns text for the AI modal.

