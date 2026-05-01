# KWIBUKA 1994 MAP

> *"Kwibuka" means "to remember" in Kinyarwanda.*

An interactive spatial intelligence dashboard visualizing the 1994 Genocide against the Tutsi in Rwanda. The application renders 40+ geolocated historical events, 31 memorial sites with survivor testimony, and 9 RPF advance routes across a 100-day interactive timeline — reaching 1,000,000 estimated lives lost using a sigmoid growth curve.

**Live:** [https://kwibuka-spatial-intelligence-sable.vercel.app](https://kwibuka-spatial-intelligence-sable.vercel.app)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Features

**100-Day Timeline** — Drag the scrubber or play at 1×/2×/4×/8× speed. The map populates dynamically as the genocide spreads geographically from Kigali outward across all five provinces.

**Sigmoid Distribution Model** — A logistic curve with inflection at day 30 models the cumulative toll (~33,000 lives/day peak), with per-province onset offsets matching the historical record.

| Province | Onset | Share |
|----------|-------|-------|
| Kigali | Day 0 | 18% |
| Eastern | Day 3 | 20% |
| Northern | Day 4 | 15% |
| Western | Day 9 | 22% |
| Southern | Day 13 | 25% |

**31 Memorial Sites** — Diamond markers distinguish memorial sites from event markers. Click any site for a tabbed card:
- **Overview** — Description, establishment date, UNESCO / National / Regional badge
- **Testimony** — Representative survivor accounts grounded in documented archives
- **Resources** — Direct links to Genocide Archive Rwanda, UNESCO, Aegis Trust, Google Arts & Culture
- **Video** — Curated archive footage from Aegis Trust, United Nations, and USC Shoah Foundation

**RPF Offensive Layer** — 9 mobile force advance routes animate across the timeline, showing the Rwandan Patriotic Front's movement from Mulindi HQ through all axes toward Kigali. Click any unit marker for a command card showing:
- Commander and deputy with rank, passport photo slots, and initials fallback
- Unit region, type, axis label, and estimated lives saved
- Companies and sub-unit breakdown (3rd Battalion)

**Historical Map (HIST)** — Toggle the 1994 Rwanda administrative divisions map (11 préfectures + communes). The RPF advance layer remains visible overlaid on the historical map.

**4 Display Modes** — STD (standard dark), NVG (phosphor green + scanlines), CRT (amber monochrome + flicker), FLIR (thermal red + vignette). Each mode recolors all visual elements consistently.

**Draggable, Resizable Info Cards** — Click any marker to open a floating intelligence card. Drag the title bar to reposition; drag the bottom-right corner to resize. Cards float above the left panel and all other UI elements.

**Mobile Layout** — Hamburger toggle at < 768px collapses the stats panel into a slide-in drawer. Info cards render as a bottom sheet. Timeline touch targets enlarged for phones.

## Architecture

```
├── index.html             # Entry point
├── vite.config.js
├── data/
│   ├── events.json        # 40 historical events
│   ├── memorials.json     # 31 memorial sites with testimony
│   ├── provinces.json     # Province sigmoid config
│   ├── cities.json        # 17 city markers
│   ├── rpfAdvance.json    # 9 RPF unit routes with command data
│   └── schema.md          # Data schema documentation
└── src/
    ├── main.js            # App entry, global state, module wiring
    ├── map.js             # D3 projection, topology, base layers
    ├── sigmoid.js         # Distribution model (pure math)
    ├── timeline.js        # Scrubber, playback, phase bars
    ├── heatmap.js         # Radial gradient heatmap circles
    ├── markers.js         # Event markers with pulse animation
    ├── memorials.js       # Memorial diamonds, UNESCO badges
    ├── rpf.js             # RPF advance routes and unit markers
    ├── hist.js            # Historical map toggle
    ├── infocard.js        # Tabbed card (drag, resize, video)
    ├── filters.js         # Display modes (STD/NVG/CRT/FLIR)
    ├── stats.js           # Side panel stats, province bars
    └── styles.css         # All styles, CSS custom properties
```

## RPF Units

| Unit | Commander | Region |
|------|-----------|--------|
| 3rd Battalion (The 600) | COL Charles Kayonga | Kigali / CND / Amahoro rescue corridor |
| Alpha Mobile Force | COL Sam Kaka | Northern-to-central axis |
| Bravo Mobile Force | COL Twahirwa Dodo | Eastern corridor / Rwamagana–Kigali |
| 59th Mobile Force | COL Charles Ngoga | Eastern border / Kibungo–Rusumo |
| 157th Mobile Force | COL Fred Ibingira | Southern-central / Gitarama–Nyanza–Butare |
| 7th Mobile Force | COL William Bagire | Central-western / Kibuye–Ruhengeri–Gisenyi |
| 21st Mobile Force | COL Charles Musitu | Central support / Kigali-Rural |
| 101st Mobile Force | COL Charles Muhire | Southern consolidation / Nyanza–Butare |
| Charlie Mobile Force | COL Thadee Gashumba | Western-southern / Kibuye–Gikongoro–Butare |

## Data Sources

| Source | Usage |
|--------|-------|
| [world-atlas](https://github.com/topojson/world-atlas) | Country topology (public domain via Natural Earth) |
| [Genocide Archive Rwanda](https://genocidearchiverwanda.org.rw/) | Memorial records, testimony archives |
| [CNLG / MINUBUMWE](https://www.minubumwe.gov.rw/) | Official memorial site registry |
| [UNESCO World Heritage](https://whc.unesco.org/en/list/1586/) | 4 inscribed genocide memorial sites (2023) |
| [Aegis Trust](https://www.aegistrust.org/) | Video archive, Kigali Genocide Memorial |
| [Google Arts & Culture](https://artsandculture.google.com/story/rwanda-39-s-genocide-memorial-sites-rwanda-cultural-heritage-academy/3AWxDwZwSfN6UQ) | Exhibition documentation |

## Extending the Data

Add new events to `data/events.json` or memorials with testimony to `data/memorials.json`. The rendering pipeline consumes whatever is in these files — no code changes needed for data additions. See `data/schema.md` for field specifications.

To add RPF units or correct route coordinates, edit `data/rpfAdvance.json`.

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
- **Commander portraits** — Photo uploads to `public/photos/<name>.jpg` for all 9 RPF unit cards
- **WebGPU Shaders** — GLSL fragment shaders for heatmap and filter modes

## License

MIT. Data sourced from public archives and open datasets. Testimony texts are representative composites based on documented survivor accounts, not direct quotes from named individuals.
