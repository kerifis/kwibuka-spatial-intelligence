# Development Guide

## Prerequisites

- Node.js and npm
- PowerShell on Windows
- Network access for dependency install and optional map/topology resources

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Vite prints the local URL. The default is usually:

```text
http://localhost:5173
```

If that port is busy, Vite may use another port such as `5179`.

## Build

On Windows PowerShell, `npm` may be blocked by script execution policy. If that happens, use `npm.cmd`.

```bash
npm.cmd run build
```

Output goes to `dist/`.

## Preview Production Build

```bash
npm.cmd run preview
```

## Common Development Tasks

### Add A New Historical Event

1. Edit `data/events.json`.
2. Add the event object with unique `id`.
3. Run `npm.cmd run build`.
4. Start dev server and scrub to the event day.
5. Confirm marker, heatmap, event list, and info card.

### Add A New Memorial

1. Edit `data/memorials.json`.
2. Add testimony/context/resources.
3. Toggle MEMORIALS in the app.
4. Confirm diamond marker and card tabs.

### Add Commander Portraits

1. Add image to `public/`.
2. Reference it in `data/rpfAdvance.json` as `/filename.jpg`.
3. Click the RPF unit marker and confirm the card image loads.

### Correct A Route

1. Edit `data/rpfAdvance.json`.
2. Keep points chronological.
3. Keep coordinates inside Rwanda.
4. Validate line segments against the Rwanda polygon.
5. Build and inspect the route in the app.

## Route Validation Script

This command validates route waypoints and sampled straight segments against the app's fallback Rwanda border polygon.

```bash
node -e "import('d3').then(async d3=>{const fs=await import('node:fs'); const routes=JSON.parse(fs.readFileSync('data/rpfAdvance.json','utf8')); const border=[[29.02,-1.06],[29.35,-1.06],[29.68,-1.10],[30.02,-1.07],[30.47,-1.07],[30.51,-1.20],[30.53,-1.40],[30.82,-1.60],[30.90,-1.80],[30.89,-2.00],[30.82,-2.30],[30.55,-2.40],[30.42,-2.60],[30.10,-2.65],[29.70,-2.80],[29.35,-2.80],[29.20,-2.70],[29.00,-2.35],[28.86,-2.25],[28.90,-2.10],[29.15,-1.85],[29.10,-1.55],[28.98,-1.25],[29.02,-1.06]]; const feat={type:'Feature',geometry:{type:'Polygon',coordinates:[border]}}; let bad=[]; for (const r of routes){ for (const p of r.points){ if(!d3.geoContains(feat,[p.lng,p.lat])) bad.push({unit:r.unit,day:p.day,label:p.label,lat:p.lat,lng:p.lng}); } for(let i=1;i<r.points.length;i++){ const a=r.points[i-1], b=r.points[i]; for(let s=0;s<=50;s++){ const t=s/50; const lng=a.lng+(b.lng-a.lng)*t, lat=a.lat+(b.lat-a.lat)*t; if(!d3.geoContains(feat,[lng,lat])) { bad.push({unit:r.unit,from:a.label,to:b.label,t:+t.toFixed(2),lat:+lat.toFixed(6),lng:+lng.toFixed(6)}); break; }}}} console.log(JSON.stringify(bad,null,2)); if(bad.length) process.exit(1); })"
```

Expected output:

```json
[]
```

## Localhost Smoke Checks

If the dev server is already running:

```powershell
(Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5179' -TimeoutSec 10).StatusCode
```

To verify that Vite is serving updated source:

```powershell
$r = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5179/data/rpfAdvance.json' -TimeoutSec 10
$r.Content -match 'Rwabusoro north-bank corridor'
```

## Code Style Notes

- The app uses plain ES modules and direct DOM/D3 manipulation.
- Keep data changes in JSON when possible.
- Prefer source-of-truth changes in `data/`, not duplicated text in UI code.
- Keep RPF route rendering border-safe.
- Do not hand-edit `dist/`.

