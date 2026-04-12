# KWIBUKA // Spatial Intelligence

> *"Kwibuka" means "to remember" in Kinyarwanda.*

An interactive spatial intelligence dashboard visualizing the 1994 Genocide against the Tutsi in Rwanda. The application renders 40+ geolocated historical events and 16 memorial sites with survivor testimony across a 100-day interactive timeline, reaching 1,000,000 estimated lives lost using a sigmoid growth curve.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Features

**100-Day Timeline** — Drag the scrubber or hit play at 1x/2x/4x/8x speed. The map populates dynamically as the genocide spreads geographically from Kigali outward across all five provinces.

**Sigmoid Distribution Model** — A logistic curve with inflection at day 30 models the cumulative toll, with per-province onset offsets (Kigali day 0, Eastern day 3, Northern day 4, Western day 9, Southern day 13) matching the historical record.

**16 Memorial Sites with Testimony** — Diamond markers distinguish memorial sites from event markers. Click any memorial for a tabbed intelligence card with:
- **Overview** — Site description, establishment date, UNESCO/National/Regional badge
- **Testimony** — Representative survivor accounts grounded in documented archives
- **Resources** — Direct links to Genocide Archive Rwanda, UNESCO, Aegis Trust, Google Arts & Culture

**4 Display Modes** — STD (standard dark), NVG (phosphor green + scanlines), CRT (amber monochrome + flicker), FLIR (thermal red + vignette). Each mode recolors markers, labels, heatmap gradients, and stat values.

**Real Topology** — Country geometry loaded from Natural Earth via world-atlas (50m resolution). Rwanda, neighboring countries (DRC, Uganda, Tanzania, Burundi), Lake Kivu, and 17 city markers from the reference map.

## Architecture

```
├── CLAUDE.md              # Claude Code project instructions
├── index.html             # Entry point
├── package.json
├── vite.config.js
├── data/
│   ├── events.json        # 40 historical events
│   ├── memorials.json     # 16 memorial sites with testimony
│   ├── provinces.json     # Province sigmoid config
│   ├── cities.json        # City markers
│   └── schema.md          # Data schema documentation
└── src/
    ├── main.js            # App entry, global state, module wiring
    ├── map.js             # D3 projection, topology, base layers
    ├── sigmoid.js         # Distribution model (pure math)
    ├── timeline.js        # Scrubber, playback, phase bars
    ├── heatmap.js         # Radial gradient heatmap circles
    ├── markers.js         # Event markers with pulse animation
    ├── memorials.js       # Memorial diamonds, UNESCO badges
    ├── infocard.js        # Tabbed card (Overview/Testimony/Resources)
    ├── filters.js         # Display modes (STD/NVG/CRT/FLIR)
    ├── stats.js           # Side panel stats, province bars
    └── styles.css         # All styles, CSS custom properties
```

## Data Sources

| Source | Usage |
|--------|-------|
| [world-atlas](https://github.com/topojson/world-atlas) | Country topology (public domain via Natural Earth) |
| [Genocide Archive Rwanda](https://genocidearchiverwanda.org.rw/) | Memorial records, testimony archives |
| [CNLG / MINUBUMWE](https://www.minubumwe.gov.rw/) | Official memorial site registry |
| [UNESCO World Heritage](https://whc.unesco.org/en/list/1586/) | 4 inscribed genocide memorial sites (2023) |
| [Google Arts & Culture](https://artsandculture.google.com/story/rwanda-39-s-genocide-memorial-sites-rwanda-cultural-heritage-academy/3AWxDwZwSfN6UQ) | Exhibition documentation |

## Extending the Data

Add new events to `data/events.json` or memorials with testimony to `data/memorials.json`. The rendering pipeline consumes whatever is in these files — no code changes needed. See `data/schema.md` for field specifications.

## Production Build

```bash
npm run build    # Output to dist/
npm run preview  # Preview the build
```

## Future Integration

- **CesiumJS + Google 3D Tiles** — Replace D3 SVG with volumetric 3D terrain
- **Genocide Archive Rwanda API** — Replace representative testimonies with recorded accounts
- **USC Shoah Foundation** — Geotagged video testimony integration
- **ACLED API** — Verified conflict event coordinates
- **WebGPU Shaders** — GLSL fragment shaders for heatmap and filter modes

## License

MIT. Data sourced from public archives and open datasets. Testimony texts are representative composites based on documented survivor accounts, not direct quotes from named individuals.
