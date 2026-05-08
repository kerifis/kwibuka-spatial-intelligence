# Feature Guide

## 100-Day Timeline

Files:

- `src/timeline.js`
- `src/main.js`
- `src/sigmoid.js`
- `index.html`

The timeline covers day 0 through day 102 from `1994-04-06`. It supports scrub, touch drag, play/pause, and speed controls. Timeline phase bars are hard-coded in `timeline.js`.

Playback speed values are `0.5`, `1`, `2`, `4`, and `8`. `main.js` starts playback automatically after initial render.

## Casualty Model

Files:

- `src/sigmoid.js`
- `src/stats.js`
- `src/heatmap.js`
- `src/map.js`

The model uses a logistic sigmoid with:

- `TOTAL_LIVES = 1_000_000`
- `TOTAL_DAYS = 102`
- start date `1994-04-06`
- default steepness `k = 0.13`
- default midpoint day `30`

Province-level values use `provSigmoid(day, onset, share)`, with per-province onsets and shares from `data/provinces.json`.

## D3 Map

Files:

- `src/map.js`
- `data/cities.json`
- `data/provinces.json`

The map uses a Mercator projection fitted to a local fallback Rwanda polygon. It attempts to load Natural Earth country topology and geoBoundaries ADM1 provinces, but can render without them.

Map interactions:

- wheel/drag zoom via D3 zoom
- zoom buttons and slider
- coordinate readout under pointer
- province hover/click tooltip
- responsive projection recalculation on resize

## Event Markers

Files:

- `src/markers.js`
- `data/events.json`
- `src/infocard.js`

Historical events render when `event.day <= currentDay`. Marker size scales from event `lives`; recent high-casualty events pulse. Clicking a marker opens the info card with overview and province-assigned videos.

## Heatmap

Files:

- `src/heatmap.js`
- `src/sigmoid.js`
- `data/provinces.json`

Heatmap circles are drawn for:

- active events with more than 100 lives and non-memorial type
- province-level ambient heat from the sigmoid model

Gradient color depends on display mode.

## Memorial Layer

Files:

- `src/memorials.js`
- `data/memorials.json`
- `src/infocard.js`

Memorials are hidden by default and toggled with the MEMORIALS switch. Authored memorials from `data/memorials.json` are supplemented at runtime with synthetic local memorials until the layer reaches 133 visible memorial sites.

Marker shapes:

- UNESCO: large diamond plus dashed outer diamond
- National: medium diamond
- Regional/local: small diamond

Clicking a memorial opens a card with overview, testimony, resources, and video tabs.

## RPF Offensive Layer

Files:

- `src/rpf.js`
- `data/rpfAdvance.json`
- `src/infocard.js`

RPF routes are visible by default and animated by timeline day. Each route has commander/deputy metadata, photos, route waypoints, estimated lives saved, and a description. Routes contain 8–22 dense intermediate waypoints following Rwanda's road corridors so they stay within the national border and do not cut across mountains.

Rendering details:

- route position is linearly interpolated between waypoints
- route line uses `d3.curveLinear` — intentional; prevents border overshoot that curved splines cause at border-adjacent waypoints
- trail is drawn in three opacity layers per frame: full historical trail (dim), second-half trail (medium), most-recent three waypoints (full brightness)
- trail brightness decays over time using a 5-second real-time fade timer; `_fadeTick` is incremented by `setInterval` every 5 seconds and dispatches `rpf-fade-tick`; `main.js` listens and re-renders the current day
- clicking a unit opens an RPF command card that shows the full waypoint-to-waypoint route string

## Historical Map Mode

Files:

- `src/hist.js`
- `index.html`
- `public/rwanda-1994-administrative-divisions.svg`
- `src/styles.css`

HIST mode shows a 1994 administrative map overlay while keeping the RPF layer available.

## Display Modes

Files:

- `src/filters.js`
- `src/styles.css`

Modes:

- `STD`: standard dark dashboard
- `NVG`: green night-vision styling
- `CRT`: amber monochrome with scanline/flicker
- `FLIR`: red thermal-style treatment

Switching modes updates overlay classes and triggers a re-render.

## Info Cards

Files:

- `src/infocard.js`
- `index.html`
- `src/styles.css`

The floating info card supports:

- overview, testimony, resources, and video tabs
- event cards with province-assigned videos
- memorial cards with testimony/resource tabs
- RPF command cards with commander/deputy portraits
- desktop drag positioning
- mobile full-width behavior

## 100 Testimonies Modal

Files:

- `src/infocard.js`
- `index.html`
- `src/styles.css`

The video pool contains 100 YouTube video records. The modal paginates 12 per page.

Header controls:

- `100 VOICES` button: opens the modal at page 1
- `PODCAST` button: opens the modal directly at page 6, where Kwibuka Podcast videos are

Modal nav bar buttons (after the tab links):

- `● LIVE`: external link to YouTube Studio livestreaming management
- `AUX`: toggles background audio; label changes to `‖ AUX` while playing and syncs with the header audio state via `window.updateModalAux()`

`openTestimoniesModal(page = 1)` accepts an optional page argument for deep-linking. `window.openPodcast` calls it with `page = 6`.

## Audio And Cast Controls

Files:

- `index.html`
- `src/main.js`
- `public/*.mp3`

The AUX button controls looped background audio. Volume is controlled by a range input. Audio does not autoplay on page load — it starts only when the user presses AUX. Cast uses the Presentation API when available and otherwise shows a browser cast hint.

