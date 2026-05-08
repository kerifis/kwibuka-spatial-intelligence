# Operations Runbook

## High-Risk Areas

| Area | Risk | Mitigation |
| --- | --- | --- |
| Border-adjacent RPF routes | A route can appear to cross into a neighboring country. | Use `d3.curveLinear` and validate sampled route segments. |
| Memorial synthetic generation | Runtime-generated sites can be mistaken for authored records. | Document that only `data/memorials.json` entries are authored. |
| External map data | CDN/API requests can fail. | Keep fallback border rendering healthy. |
| YouTube thumbnails/embeds | External content can disappear or be blocked. | Cards should still render titles/source text. |
| Gemini API | Requires user key and network. | Keep AI layer optional and locked before day 45. |
| PowerShell npm script policy | `npm` can fail on Windows. | Use `npm.cmd`. |

## Route Validation

Run route validation after any edit to `data/rpfAdvance.json`.

What to validate:

- every waypoint is inside Rwanda
- sampled straight segments between waypoints stay inside Rwanda
- route labels accurately describe the route
- route descriptions do not imply crossings that the map does not show

The 157th Mobile Force route is intentionally described as staying on Rwanda's side of the Rwabusoro north-bank corridor.

## App Smoke Test

1. Start dev server:

```bash
npm run dev
```

2. Open the local URL.

3. Confirm:

- Loading label disappears.
- Map renders.
- Big counter increments.
- Timeline plays or scrubs.
- Event markers appear over time.
- RPF units move and open cards.
- Memorial toggle shows diamond markers.
- HIST overlay displays the 1994 administrative map.
- STD/NVG/CRT/FLIR modes recolor the UI.
- 100 VOICES modal opens and paginates.

## Local Server Content Checks

For a server on `http://localhost:5179`:

```powershell
(Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5179' -TimeoutSec 10).StatusCode
```

Expected:

```text
200
```

Check a corrected route string is being served:

```powershell
$r = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5179/data/rpfAdvance.json' -TimeoutSec 10
$r.Content -match 'inside Rwanda'
```

Expected:

```text
True
```

## Troubleshooting

### Blank Or Stuck Map

Likely causes:

- JavaScript error during module import.
- Missing or invalid JSON.
- D3/topology request failed and fallback path has a bug.
- CSS layout collapsed the map container.

Checks:

- Run `npm.cmd run build`.
- Open browser console.
- Validate changed JSON with `JSON.parse`.
- Confirm `#mapWrap` has non-zero width/height.

### RPF Route Does Not Appear

Likely causes:

- current day is before `startDay`
- route point has invalid coordinate
- `showRpfLayer` is false
- `projection()` returned null

Checks:

- Toggle RPF.
- Scrub past the route `startDay`.
- Validate `data/rpfAdvance.json`.

### Memorials Do Not Appear

Likely causes:

- MEMORIALS toggle is off
- marker coordinates fail `isPointInRwanda`
- marker layer was cleared by another render path after memorial render

Checks:

- Toggle MEMORIALS.
- Check coordinates.
- Confirm `renderMemorialMarkers(mode)` is called after `renderMarkers(...)` in `main.js`.

### Build Fails With PowerShell Policy

Use:

```bash
npm.cmd run build
```

### Vercel Deploy Needs A Different URL

Use a preview deploy:

```bash
npx.cmd vercel deploy --yes
```

Do not deploy `--prod` unless you intend to move the production address.

