# KWIBUKA // Spatial Intelligence Dashboard

## Project Overview
A web-based spatial intelligence dashboard visualizing the 1994 Genocide against the Tutsi in Rwanda. Built on D3.js with real country topology from world-atlas, the application renders 40+ geolocated historical events and 16 memorial sites with survivor testimony across a 100-day interactive timeline.

The dashboard reaches 1,000,000 estimated lives lost by Day 100 using a sigmoid growth curve distribution model, with per-province onset offsets matching the historical record.

## Architecture

```
src/
  main.js         → App entry point. Initializes map, binds events, starts render loop
  map.js          → D3 Mercator projection, topology loading (world-atlas via jsdelivr), 
                    country/province/lake rendering, grid lines
  sigmoid.js      → Sigmoid distribution model: cumulative total, daily rate, 
                    per-province distribution with onset offsets
  timeline.js     → Timeline scrubber: drag/touch handling, playback at 1x/2x/4x/8x,
                    phase bars, event tick marks
  heatmap.js      → Radial gradient heatmap circles. Grow with time-based expansion.
                    Province-level ambient heat. Mode-aware gradient selection
  markers.js      → Event markers: scaled by sqrt(lives/max), age-based opacity decay,
                    pulse animation for recent events (SVG animate)
  memorials.js    → Memorial diamond markers: UNESCO/National/Regional badges,
                    testimony data integration, toggle visibility
  infocard.js     → Tabbed intelligence card: Overview / Testimony / Resources tabs.
                    Handles both events and memorials. Positioning logic
  filters.js      → Display modes: STD, NVG (green phosphor + scanlines), 
                    CRT (amber + flicker), FLIR (thermal red + vignette)
  stats.js        → Stats panel: cumulative counter, province distribution bars,
                    active event list, memorial count
  styles.css      → All styles. CSS custom properties for theming. Filter overlays.
                    Memorial-specific styles. Info card tabs

data/
  events.json     → 40 historical events with {id, name, lat, lng, day, lives, type, prov, desc}
  memorials.json  → 16 memorial sites with testimony, context, resources, badges
  provinces.json  → Province config: share weights, onset days, colors, center coords
  cities.json     → 17 city markers from reference map
  schema.md       → Full data schema documentation for extending the dataset
```

## Tech Stack
- **Rendering**: D3.js v7 (geo projection, SVG rendering, data bindingng)
- **Topology**: world-atlas@2 countries-50m.json via cdn.jsdelivr.net (Rwanda = id "646")
- **Build**: Vite 5 (dev server + production build)
- **No framework**: Vanilla JS modules. No React/Vue dependency
- **Styling**: Pure CSS with custom properties. No Tailwind/preprocessor

## Key Algorithms

### Sigmoid Distribution
```
f(t) = 1,000,000 / (1 + e^(-0.13 * (t - 30)))
```
- Inflection at day 30 (peak killing rate ~33,000/day)
- Per-province: each province has onset offset (Kigali=0, Eastern=3, Northern=4, Western=9, Southern=13)
- Province shares: Southern 25%, Western 22%, Eastern 20%, Kigali 18%, Northern 15%

### Marker Sizing
```
radius = max(3, sqrt(lives / maxLives) * 22 * growthFactor)
growthFactor = min(1, age / 8)  // markers grow over 8 days after event
```

### Heatmap Expansion
```
radius = sqrt(lives / 50000) * 60 * min(1, age / 15) + 8
opacity = min(0.55, lives / 50000 + 0.08) * growthFactor
```

## Data Sources
- **Topology**: Natural Earth via world-atlas npm package (public domain)
- **Events**: Cross-referenced from ACLED, Genocide Archive Rwanda, CNLG records
- **Memorials**: Genocide Archive Rwanda, UNESCO World Heritage listing (2023), Google Arts & Culture
- **Testimony**: Representative accounts based on documented survivor testimony archives (not direct quotes)

## Commands
- `npm install` → Install dependencies
- `npm run dev` → Start dev server at localhost:5173
- `npm run build` → Production build to dist/
- `npm run preview` → Preview production build

## Extending the Data
To add new events: add entries to `data/events.json` following the schema in `data/schema.md`.
To add new memorials with testimony: add entries to `data/memorials.json`.
The rendering pipeline consumes whatever is in these files — no code changes needed for data additions.

## Future Integration Points
- **CesiumJS + Google 3D Tiles**: Replace D3 SVG map with volumetric 3D terrain (requires API key)
- **Genocide Archive Rwanda API**: Replace representative testimonies with actual recorded accounts
- **USC Shoah Foundation Visual History Archive**: Geotagged video testimony integration
- **ACLED API**: Live query for verified conflict event coordinates
- **WebGPU Shaders**: Replace CSS filter overlays with actual GLSL fragment shaders
