/**
 * Map module: D3 Mercator projection, topology loading, base layer rendering.
 */
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import cities from '../data/cities.json';

const FALLBACK_BORDER = [
  [29.02,-1.06],[29.35,-1.06],[29.68,-1.10],[30.02,-1.07],[30.47,-1.07],
  [30.51,-1.20],[30.53,-1.40],[30.82,-1.60],[30.90,-1.80],[30.89,-2.00],
  [30.82,-2.30],[30.55,-2.40],[30.42,-2.60],[30.10,-2.65],[29.70,-2.80],
  [29.35,-2.80],[29.20,-2.70],[29.00,-2.35],[28.86,-2.25],[28.90,-2.10],
  [29.15,-1.85],[29.10,-1.55],[28.98,-1.25],[29.02,-1.06]
];

const LAKE_KIVU = [
  [29.05,-1.68],[29.15,-1.78],[29.18,-1.90],[29.12,-2.02],[29.05,-2.12],
  [28.95,-2.20],[28.88,-2.15],[28.85,-2.05],[28.90,-1.92],[28.95,-1.82],
  [29.00,-1.73],[29.05,-1.68]
];

const PROV_CENTERS = [
  { n: 'KIGALI',   lat: -1.95, lng: 30.06 },
  { n: 'NORTHERN', lat: -1.52, lng: 29.82 },
  { n: 'SOUTHERN', lat: -2.55, lng: 29.75 },
  { n: 'EASTERN',  lat: -1.65, lng: 30.62 },
  { n: 'WESTERN',  lat: -2.10, lng: 29.35 },
];

const NEIGHBORS = ['180', '800', '834', '108']; // DRC, Uganda, Tanzania, Burundi

// GeoJSON Feature used to auto-fit the projection to Rwanda's extent
const RWANDA_FIT_GEOM = {
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [FALLBACK_BORDER] }
};

export let projection, pathGen, svg;
export let gGrid, gMap, gPref, gHeat, gMark, gLbl;

// Clip path path element — updated when Rwanda geometry is known and on resize
let rwClipPathEl = null;
let rwGeoFeature  = null;

/**
 * Initialize the D3 map: projection, SVG layers, topology loading.
 * @param {HTMLElement} container - The map container element
 * @returns {Promise<void>}
 */
export async function initMap(container) {
  const W = container.clientWidth;
  const H = container.clientHeight;

  svg = d3.select('#mSvg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  projection = d3.geoMercator()
    .fitExtent([[0, 0], [W, H]], RWANDA_FIT_GEOM);

  pathGen = d3.geoPath().projection(projection);

  // SVG defs — heatmap gradients + Rwanda clip path
  const defs = svg.append('defs');
  [
    { id: 'heat',  color: '#ff2244' },
    { id: 'heatG', color: '#00ff88' },
    { id: 'heatA', color: '#ffb800' },
  ].forEach(({ id, color }) => {
    const g = defs.append('radialGradient').attr('id', id);
    g.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0.6);
    g.append('stop').attr('offset', '35%').attr('stop-color', color).attr('stop-opacity', 0.25);
    g.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0);
  });

  // Rwanda clip path — geometry filled in after topology loads
  rwClipPathEl = defs.append('clipPath').attr('id', 'rwanda-clip').append('path');

  // Create layer groups (order = z-index)
  gGrid = svg.append('g').attr('class', 'grid-layer');
  gMap  = svg.append('g').attr('class', 'map-layer');
  gPref = svg.append('g').attr('class', 'pref-layer').attr('clip-path', 'url(#rwanda-clip)');
  gHeat = svg.append('g').attr('class', 'heat-layer').attr('clip-path', 'url(#rwanda-clip)');
  gMark = svg.append('g').attr('class', 'marker-layer');
  gLbl  = svg.append('g').attr('class', 'label-layer');

  // Grid lines
  for (let la = -3; la <= -1; la += 0.25) {
    const a = projection([28, la]), b = projection([31.5, la]);
    if (a && b) gGrid.append('line')
      .attr('x1', a[0]).attr('y1', a[1]).attr('x2', b[0]).attr('y2', b[1])
      .attr('class', 'grid-ln');
  }
  for (let lo = 28.5; lo <= 31; lo += 0.25) {
    const a = projection([lo, -0.8]), b = projection([lo, -3]);
    if (a && b) gGrid.append('line')
      .attr('x1', a[0]).attr('y1', a[1]).attr('x2', b[0]).attr('y2', b[1])
      .attr('class', 'grid-ln');
  }

  // Load world topology and render
  let rwandaLoaded = false;
  try {
    const world = await d3.json(
      'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'
    );
    if (world?.objects?.countries) {
      const countries = topojson.feature(world, world.objects.countries);

      // Neighbor countries (very faint — zoomed mostly out of frame)
      gMap.selectAll('.neighbor')
        .data(countries.features.filter(f => NEIGHBORS.includes(f.id)))
        .enter().append('path')
        .attr('d', pathGen).attr('class', 'c-fill c-bdr');

      // Rwanda
      const rw = countries.features.find(f => f.id === '646');
      if (rw) {
        rwGeoFeature = rw;
        rwClipPathEl.datum(rw).attr('d', pathGen);
        gMap.append('path').datum(rw).attr('d', pathGen).attr('class', 'rw-fill');
        rwandaLoaded = true;
      }
    }
  } catch (e) {
    console.warn('Topology fetch failed, using fallback', e);
  }

  // Fallback if topology didn't load
  if (!rwandaLoaded) {
    const geo = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [FALLBACK_BORDER] },
    };
    rwGeoFeature = geo;
    rwClipPathEl.datum(geo).attr('d', pathGen);
    gMap.append('path').datum(geo).attr('d', pathGen).attr('class', 'rw-fill');
  }

  // Lake Kivu
  gMap.append('path')
    .datum({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [LAKE_KIVU] } })
    .attr('d', pathGen).attr('class', 'lake');

  // Province labels
  PROV_CENTERS.forEach(p => {
    const pt = projection([p.lng, p.lat]);
    if (pt) gLbl.append('text')
      .attr('x', pt[0]).attr('y', pt[1])
      .text(p.n).attr('class', 'prov-lbl').attr('text-anchor', 'middle');
  });

  // City markers
  cities.forEach(c => {
    const p = projection([c.lng, c.lat]);
    if (!p) return;
    gLbl.append('circle')
      .attr('cx', p[0]).attr('cy', p[1])
      .attr('r', c.major ? 2.5 : 1.5)
      .attr('class', 'city-dot');
    gLbl.append('text')
      .attr('x', p[0] + 5).attr('y', p[1] + 3)
      .text(c.n).attr('class', 'city-lbl')
      .style('font-size', c.major ? '9px' : '7px');
  });
}

/**
 * Handle window resize: update projection and re-render paths.
 */
export function handleResize(container) {
  const W = container.clientWidth;
  const H = container.clientHeight;
  svg.attr('viewBox', `0 0 ${W} ${H}`);
  projection.fitExtent([[0, 0], [W, H]], RWANDA_FIT_GEOM);
  gMap.selectAll('path').attr('d', pathGen);
  // Re-project clip path so it stays aligned with the new scale
  if (rwClipPathEl && rwGeoFeature) {
    rwClipPathEl.datum(rwGeoFeature).attr('d', pathGen);
  }
}
