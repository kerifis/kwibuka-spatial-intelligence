# Data Schema Documentation

## events.json

Each entry represents a geolocated historical event during the 100 days (April 6 – July 17, 1994).

```json
{
  "id": 1,                          // Unique integer ID
  "name": "Event name",             // Display name
  "lat": -1.9686,                   // WGS84 latitude
  "lng": 30.1395,                   // WGS84 longitude
  "day": 0,                         // Day offset from April 6, 1994 (day 0)
  "lives": 12,                      // Estimated lives lost (0 for military/political events)
  "type": "Massacre",               // One of: Trigger, Assassination, Military, Massacre, Resistance, Intervention, Memorial
  "prov": "Kigali",                 // Province: Kigali, Eastern, Northern, Western, Southern
  "desc": "Description text..."     // 1-3 sentence historical description
}
```

### Event Types
| Type | Marker Color | Description |
|------|-------------|-------------|
| Trigger | Red | Initiating events |
| Assassination | Red | Targeted political killings |
| Massacre | Red | Mass killing events |
| Resistance | Red | Armed resistance by victims |
| Military | Amber | RPF military operations |
| Intervention | Blue | International interventions |
| Memorial | White (dimmed) | Memorial site markers |

## memorials.json

Each entry represents a genocide memorial site with archival testimony.

```json
{
  "id": "m1",                       // String ID prefixed with 'm'
  "name": "Memorial name",          // Full official name
  "lat": -1.9277,                   // WGS84 latitude
  "lng": 29.9983,                   // WGS84 longitude
  "prov": "Kigali",                 // Province
  "lives": 250000,                  // Number of victims interred/commemorated
  "est": 2004,                      // Year established
  "badge": "unesco",                // One of: unesco, natl, regional
  "type": "National Memorial...",   // Full type description
  "desc": "Site description...",    // Overview paragraph
  "testimony": {
    "text": "Survivor account...",           // Representative testimony text
    "attribution": "Source description...",   // How testimony was sourced
    "source": "Archive name"                 // Institutional source
  },
  "context": "Historical context...",         // Extended historical background
  "resources": [                              // External links
    {"label": "Resource name", "url": "https://..."}
  ]
}
```

### Badge Types
| Badge | Marker Size | Description |
|-------|-----------|-------------|
| unesco | Large diamond + dashed outer | UNESCO World Heritage Site (4 sites) |
| natl | Medium diamond | National Memorial Site |
| regional | Small diamond | Regional/Local Memorial |

## provinces.json

Province configuration for the sigmoid distribution model.

```json
{
  "ProvinceName": {
    "share": 0.25,                   // Fraction of total 1M (must sum to 1.0)
    "color": "#ff2244",              // Heatmap color
    "onset": 13,                     // Day when killings began in this province
    "center": [-2.45, 29.65]         // [lat, lng] geographic center for ambient heatmap
  }
}
```

## cities.json

City markers for map labels.

```json
{
  "n": "KIGALI",                     // Display name (uppercase = major city)
  "lat": -1.9403,                    // WGS84 latitude
  "lng": 29.8739,                    // WGS84 longitude
  "major": true                      // true = larger marker + label
}
```

## Adding New Data

### New Event
1. Add entry to `data/events.json`
2. Assign unique integer `id` (next available)
3. Set `day` as offset from April 6, 1994
4. No code changes required — the rendering pipeline consumes the array

### New Memorial with Testimony
1. Add entry to `data/memorials.json`
2. Assign unique string `id` prefixed with `m`
3. Include `testimony` object with `text`, `attribution`, `source`
4. Include `resources` array with at least one external link
5. No code changes required

### Data Sources for Extension
- **ACLED** (acleddata.com) — Conflict event coordinates for Rwanda 1994
- **Genocide Archive Rwanda** (genocidearchiverwanda.org.rw) — Memorial records, testimony
- **CNLG/MINUBUMWE** — Official memorial site registry
- **USC Shoah Foundation** — Visual History Archive with geotagged video testimony
- **UNESCO** (whc.unesco.org/en/list/1586) — World Heritage listing documentation
