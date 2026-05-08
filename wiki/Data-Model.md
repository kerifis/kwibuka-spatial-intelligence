# Data Model

## Dataset Inventory

| File | Current count | Notes |
| --- | ---: | --- |
| `data/events.json` | 40 | Timeline events and major massacre/military/intervention markers. |
| `data/memorials.json` | 31 | Authored memorial records with testimony, context, and resources. |
| `data/rpfAdvance.json` | 9 routes | RPF unit metadata and route waypoints. |
| `data/rpfAdvance.json` | 115 points | Total route waypoints across all units. |
| `data/cities.json` | 17 | City labels and major/minor marker flag. |
| `data/provinces.json` | 5 | Province shares, onsets, heat colors, centers. |

## Coordinate Rules

All coordinates are WGS84 latitude/longitude.

```json
{
  "lat": -1.9403,
  "lng": 29.8739
}
```

D3 projection calls use `[lng, lat]`, so code usually converts data points with:

```js
projection([item.lng, item.lat])
```

For route work, validate both waypoints and sampled line segments. This matters near borders because a point can be inside Rwanda while a curved or diagonal segment visually exits the country.

## Events

Path: `data/events.json`

Event shape:

```json
{
  "id": 1,
  "name": "Presidential plane shot down",
  "lat": -1.9686,
  "lng": 30.1395,
  "day": 0,
  "lives": 12,
  "type": "Trigger",
  "prov": "Kigali",
  "desc": "Description..."
}
```

Important fields:

- `id`: integer used by event list click handlers.
- `day`: offset from `1994-04-06`.
- `lives`: drives marker size, heatmap intensity, and event list label.
- `type`: affects marker color and filtering.
- `prov`: used for stats and province-assigned event videos.

## Memorials

Path: `data/memorials.json`

Memorial shape:

```json
{
  "id": "m1",
  "name": "Kigali Genocide Memorial - Gisozi, Gasabo",
  "lat": -1.9277,
  "lng": 29.9983,
  "prov": "Kigali",
  "lives": 250000,
  "est": 2004,
  "badge": "unesco",
  "type": "National Memorial & UNESCO World Heritage Site",
  "desc": "Description...",
  "testimony": {
    "text": "Representative testimony...",
    "attribution": "Attribution...",
    "source": "Source..."
  },
  "context": "Context...",
  "resources": [
    { "label": "Genocide Archive Rwanda", "url": "https://..." }
  ]
}
```

Badge values:

- `unesco`
- `natl`
- `regional`

Runtime note: `src/memorials.js` mutates the imported memorial array by adding synthetic local memorials if fewer than 133 records exist. These generated records are useful for map density but should not be mistaken for authored archival entries.

## RPF Routes

Path: `data/rpfAdvance.json`

Route shape:

```json
{
  "id": "one-fifty-seventh-mobile-force",
  "unit": "157th Mobile Force",
  "commander": "Fred IBINGIRA",
  "commanderRank": "Gen.",
  "commanderPhoto": "/ibingira.jpg",
  "deputy": "Lt. Col. Eric MUROKORE",
  "deputyPhoto": "/murokore.jpg",
  "region": "Southeastern Rwanda-only sweep...",
  "livesSaved": 45000,
  "type": "Southern grand sweep - NE Rwanda to Gikongoro",
  "color": "#4488ff",
  "startDay": 1,
  "endDay": 95,
  "desc": "Description...",
  "points": [
    { "day": 1, "lat": -1.200, "lng": 30.200, "label": "Mutara..." }
  ]
}
```

Waypoint rules:

- `points` should be chronological by `day`; `rpf.js` sorts defensively.
- `startDay` controls when the unit appears.
- `endDay` controls when the route is treated as complete.
- `label` appears in tooltips and info cards.
- Photos are absolute public paths such as `/ibingira.jpg`.

## Provinces

Path: `data/provinces.json`

Province shape:

```json
{
  "Southern": {
    "share": 0.25,
    "color": "#ff2244",
    "onset": 13,
    "center": [-2.45, 29.65]
  }
}
```

The `center` field uses `[lat, lng]`, unlike D3 projection calls. `map.js` and `heatmap.js` convert it before projection.

Shares should sum to `1.0`.

## Cities

Path: `data/cities.json`

```json
{
  "n": "KIGALI",
  "lat": -1.9403,
  "lng": 29.8739,
  "major": true
}
```

Major cities render with slightly larger dots and labels.

## Adding Data

### Add An Event

1. Append an object to `data/events.json`.
2. Use the next unique integer `id`.
3. Set `day` as an offset from `1994-04-06`.
4. Confirm `prov` matches one of `Kigali`, `Eastern`, `Northern`, `Western`, `Southern`.
5. Run a build and inspect the marker on the timeline.

### Add A Memorial

1. Append an object to `data/memorials.json`.
2. Use the next `m##` id.
3. Include testimony, context, and resources.
4. Assign `badge`.
5. Confirm coordinates fall inside Rwanda.

### Add Or Correct An RPF Route

1. Edit `data/rpfAdvance.json`.
2. Keep route points inside Rwanda.
3. Validate sampled line segments, not just waypoints.
4. Use `d3.curveLinear` unless you also validate curved SVG geometry.
5. Add any commander/deputy portraits to `public/`.

