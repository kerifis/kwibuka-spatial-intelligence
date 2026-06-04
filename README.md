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

## Environment

Street View in CRT mode uses the Google Maps JavaScript API. For production, create a local `.env` file from `.env.example` and set:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_browser_key_here
```

The Google Cloud project for that key needs Maps JavaScript API, Street View imagery, valid HTTP referrer restrictions, and billing enabled.

## Features

**100-Day Timeline** — Drag the scrubber or play at 0.5×/1×/2×/4×/8× speed (default 0.5×). The map populates dynamically as the genocide spreads geographically from Kigali outward across all five provinces.

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

**RPF Offensive Layer** — 9 mobile force advance routes animate across the timeline from Day 1, showing the RPA's three-phase counter-genocide operation. Click any unit marker for a command card showing commander and deputy with rank, photo portrait slots, estimated lives saved, and unit axis description.

**Historical Map (HIST)** — Toggle an interactive administrative map with documented wiped-out-family cohorts. Select an area from the map or side panel to highlight its location; tactical RPF routes are hidden while HIST is active.

**4 Display Modes** — STD (standard dark), NVG (phosphor green + scanlines), CRT (amber monochrome + flicker), FLIR (thermal red + vignette). Each mode recolors all visual elements consistently.

**Ambient Audio** — *Ijambo Rya Mbere Inkotanyi Zakubwiye* by Bonhomme plays on loop. Toggle and volume control in the header.

**Draggable, Resizable Info Cards** — Click any marker to open a floating intelligence card. Drag the title bar to reposition; drag the bottom-right corner to resize.

**Mobile Layout** — Hamburger toggle collapses the stats panel into a slide-in drawer at < 768px.

## RPA Tactical Operations — Three-Phase Strategy

The Rwandan Patriotic Army (RPA) executed a high-mobility, multi-axis strategy designed to stretch the Forces Armées Rwandaises (FAR) and halt massacres across the country simultaneously.

### Phase 1 — The Relief Race (April 7–Mid-April)

The RPA's immediate priority was protecting the **3rd Battalion (600 soldiers)** stationed at the CND Parliament under the Arusha Accords and beginning rescue operations for trapped civilians.

General Paul Kagame ordered Alpha, Bravo, and 59th Mobile Forces to race south from the DMZ near Mulindi on **April 7–8** to relieve the besieged battalion.

| Date | Event | Unit |
|------|-------|------|
| April 7–8 | Resumption of hostilities — RPA races south from Mulindi | Alpha, Bravo, 59th |
| April 11–12 | Mt. Rebero captured — used to shell FAR positions in Kigali | 3rd Battalion |
| April 11–12 | Nyanza Hill — mass rescue operation sacrificing military momentum | 3rd Battalion |
| April 15 | Kayonza Crossroads seized — Tanzania supply road cut | Bravo Mobile Force |
| April 20 | Byumba and Mt. Jali fall — northern rear consolidated | Alpha, 157th |

### Phase 2 — Eastern Sweep & Isolation (Late April–May)

Instead of a frontal assault on the well-defended capital, the RPA bypassed Kigali to the east — the **Wide Encirclement** — moving south toward the Tanzanian border to cut FAR supply lines and prevent the genocide spreading into rural areas.

| Date | Event | Unit |
|------|-------|------|
| April 15 | Kayonza Crossroads — land route to Tanzania severed | Bravo |
| Late April | Rwamagana secured — eastern corridor opened | Bravo |
| Late April | Kibungo captured — eastern Rwanda taken | 59th |
| Late April | Rusumo border post — eastern Rwanda fully sealed | 59th |
| May 22 | Kanombe Airport liberated — major FAR logistical blow | Bravo |

### Phase 3 — Triple Column Advance & Liberation (June–July)

After crossing the **Akaryaru bridge on May 25**, the RPA split into three columns driving into the south and west to capture the interim government's base.

| Date | Event | Unit |
|------|-------|------|
| May 25 | Akaryaru bridge crossed — triple column advance begins | 7th, 157th, 21st, 101st, Charlie |
| June 12 | Gitarama-ville seized — interim genocide government flees to Gisenyi | 7th (Western Column) |
| July 4 | Kigali fully liberated | All converging units |
| July 4 | Butare liberated — organized genocide ended | 157th, 101st, Charlie |

**Column assignments post-Akaryaru:**
- **North → Gitarama**: 7th Mobile Force (Western Column)
- **West → Nyabisindu (Nyanza)**: 157th Mobile Force
- **South → Butare**: 101st + Charlie Mobile Force

## RPF Units

| Unit | Commander | Axis | Start |
|------|-----------|------|-------|
| 3rd Battalion (The 600) | Lt. Col. Charles KAYONGA | Kigali / CND siege defense | Day 1 |
| Alpha Mobile Force | Sam Kaka | Northern relief — Mulindi to Kigali | Day 1 |
| Bravo Mobile Force | Twahirwa Dodo | Eastern encirclement — Kayonza–Kanombe–Kigali | Day 1 |
| 59th Mobile Force | Charles Ngoga | Eastern border — Kibungo–Rusumo | Day 2 |
| 157th Mobile Force | Fred Ibingira | Triple column west wing — Byumba–Nyabisindu–Butare | Day 2 |
| 7th Mobile Force | William Bagire | Western Column — Akaryaru–Gitarama–Gisenyi | Day 2 |
| 21st Mobile Force | Charles Musitu | Central support — Kigali isolation arc | Day 3 |
| 101st Mobile Force | Charles Muhire | Triple column south wing — Nyanza–Butare | Day 2 |
| Charlie Mobile Force | Thadee Gashumba | Western-southern sweep — Kibuye–Gikongoro–Butare | Day 3 |

All units originate from **Mulindi (RPF HQ)** in northern Rwanda. Commander and deputy portrait photos are loaded from `public/<name>.jpg`.

## Architecture

```
├── index.html             # Entry point
├── vite.config.js
├── public/
│   ├── *.jpg              # Commander / unit portrait photos
│   ├── IJAMBO RYA MBERE INKOTANYI ZAKUBWIYE BY BONHOMME.mp3
│   └── rwanda-1994-administrative-divisions.svg
├── data/
│   ├── events.json        # 40 historical events
│   ├── memorials.json     # 31 memorial sites with testimony
│   ├── provinces.json     # Province sigmoid config
│   ├── cities.json        # 17 city markers
│   ├── rpfAdvance.json    # 9 RPF unit routes with command data and tactical phases
│   ├── histFamilies.json  # Documented wiped-out-family cohorts for HIST mode
│   └── schema.md          # Data schema documentation
└── src/
    ├── main.js            # App entry, global state, module wiring
    ├── map.js             # D3 projection, topology, D3 zoom behavior
    ├── sigmoid.js         # Distribution model (pure math)
    ├── timeline.js        # Scrubber, playback, phase bars
    ├── heatmap.js         # Radial gradient heatmap circles
    ├── markers.js         # Event markers with pulse animation
    ├── memorials.js       # Memorial diamonds, UNESCO badges
    ├── rpf.js             # RPF advance routes and unit markers
    ├── hist.js            # Historical map toggle (hist-mode CSS class)
    ├── infocard.js        # Tabbed card (drag, resize, commander photos)
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
| [Aegis Trust](https://www.aegistrust.org/) | Video archive, Kigali Genocide Memorial |
| [Google Arts & Culture](https://artsandculture.google.com/story/rwanda-39-s-genocide-memorial-sites-rwanda-cultural-heritage-academy/3AWxDwZwSfN6UQ) | Exhibition documentation |
| [Kigali Genocide Memorial](https://kgm.rw/other-wiped-out-families-identified/) | GAERG wiped-out-family survey cohorts |
| [KT Press](https://www.ktpress.rw/2017/05/886-families-completely-wiped-out-in-genocide-identified/) | GAERG western-north cohort reporting |

## Extending the Data

Add new events to `data/events.json` or memorials with testimony to `data/memorials.json`. The rendering pipeline consumes whatever is in these files — no code changes needed for data additions. See `data/schema.md` for field specifications.

To add RPF units or correct route coordinates, edit `data/rpfAdvance.json`. Each unit's `points` array drives the animated route line; `startDay` controls when the unit first appears on the timeline.

To add a sourced HIST cohort, edit `data/histFamilies.json`. Keep grouped areas grouped unless a source publishes a district-level breakdown.

To add commander portraits, drop `<name>.jpg` files into `public/` and set the `commanderPhoto` / `deputyPhoto` fields in `rpfAdvance.json`.

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
