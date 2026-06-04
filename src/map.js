/**
 * Map module: D3 Mercator projection, topology loading, base layer rendering.
 */
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import cities from '../data/cities.json';
import histFamilies from '../data/histFamilies.json';
import provinces from '../data/provinces.json';
import { provSigmoid } from './sigmoid.js';

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

const NEIGHBORS = ['180', '800', '834', '108']; // DRC, Uganda, Tanzania, Burundi
const GEOBOUNDARIES_API = 'https://www.geoboundaries.org/api/current/gbOpen/RWA';

export let projection, pathGen, svg;
export let gGrid, gMap, gHeat, gRpf, gMark, gLbl, gProv, gDist, gHist;
export let currentZoomTransform = d3.zoomIdentity;
let zoomBehavior, zoomRoot, mapContainer;
let rwProvData = null;
let rwDistData = null;
let rwandaFeature = {
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [FALLBACK_BORDER] },
};

function normalizeGeoBoundaryDownloadUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const rawIndex = parts.indexOf('raw');

    if (
      (parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') &&
      parts[0] === 'wmgeolab' &&
      parts[1] === 'geoBoundaries' &&
      rawIndex === 2 &&
      parts.length > 3
    ) {
      const ref = parts[rawIndex + 1];
      const filePath = parts.slice(rawIndex + 2).join('/');
      return `https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/${ref}/${filePath}`;
    }
  } catch (_) {
    return url;
  }

  return url;
}

async function loadGeoBoundary(level) {
  const meta = await d3.json(`${GEOBOUNDARIES_API}/${level}/`);
  const downloadUrl = normalizeGeoBoundaryDownloadUrl(meta?.gjDownloadURL);
  const collection = downloadUrl ? await d3.json(downloadUrl) : null;
  if (!collection?.features) return collection;

  return {
    ...collection,
    features: collection.features.map(normalizeD3Winding),
  };
}

/**
 * D3's spherical path renderer expects exterior rings in the opposite direction
 * from the GeoJSON right-hand rule used by geoBoundaries. Without normalization,
 * a selected district can render as the entire globe and break fit-to-district zoom.
 */
function normalizeD3Winding(feature) {
  const geometry = feature?.geometry;
  if (!geometry || d3.geoArea(feature) <= 2 * Math.PI) return feature;

  const reverseRings = polygon => polygon.map(ring => [...ring].reverse());
  const coordinates = geometry.type === 'Polygon'
    ? reverseRings(geometry.coordinates)
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates.map(reverseRings)
      : geometry.coordinates;

  return {
    ...feature,
    geometry: { ...geometry, coordinates },
  };
}

function districtFocusTransform(bounds, padding = 80) {
  const [[x0, y0], [x1, y1]] = bounds;
  const W = mapContainer.clientWidth;
  const H = mapContainer.clientHeight;
  const availableW = Math.max(1, W - 2 * padding);
  const availableH = Math.max(1, H - 2 * padding);
  const fitScale = 0.82 * Math.min(
    availableW / Math.max(1, x1 - x0),
    availableH / Math.max(1, y1 - y0)
  );
  const k = Math.max(1, Math.min(1.5, fitScale));

  return d3.zoomIdentity
    .translate(W / 2 - k * (x0 + x1) / 2, H / 2 - k * (y0 + y1) / 2)
    .scale(k);
}

/**
 * Check whether a longitude/latitude pair falls inside Rwanda's outline.
 * Uses the loaded Natural Earth feature when available, otherwise the local fallback border.
 */
export function isPointInRwanda(lng, lat) {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
  return d3.geoContains(rwandaFeature, [lng, lat]);
}

/**
 * Initialize the D3 map: projection, SVG layers, topology loading.
 * @param {HTMLElement} container - The map container element
 * @returns {Promise<void>}
 */
export async function initMap(container) {
  mapContainer = container;
  const W = container.clientWidth;
  const H = container.clientHeight;

  svg = d3.select('#mSvg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const rwBounds = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [FALLBACK_BORDER] } };
  projection = d3.geoMercator();
  projection.fitExtent([[30, 30], [W - 30, H - 30]], rwBounds);

  pathGen = d3.geoPath().projection(projection);

  // SVG defs for heatmap gradients
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

  // Create zoom-root group — all layers live inside so D3 zoom transforms them together
  zoomRoot = svg.append('g').attr('class', 'zoom-root');

  // Create layer groups (order = z-index)
  gGrid = zoomRoot.append('g').attr('class', 'grid-layer');
  gMap  = zoomRoot.append('g').attr('class', 'map-layer');
  gHeat = zoomRoot.append('g').attr('class', 'heat-layer');
  gDist = zoomRoot.append('g').attr('class', 'dist-layer');
  gHist = zoomRoot.append('g').attr('class', 'hist-family-layer');
  gRpf  = zoomRoot.append('g').attr('class', 'rpf-layer');
  gProv = zoomRoot.append('g').attr('class', 'prov-layer');
  gMark = zoomRoot.append('g').attr('class', 'marker-layer');
  gLbl  = zoomRoot.append('g').attr('class', 'label-layer');

  // D3 zoom behavior (wheel + drag + programmatic)
  zoomBehavior = d3.zoom()
    .scaleExtent([1, 1.5])
    .on('zoom', event => {
      currentZoomTransform = event.transform;
      zoomRoot.attr('transform', event.transform);
      const slider = document.getElementById('zoomSlider');
      if (slider) slider.value = event.transform.k;
      const val = document.getElementById('zoomVal');
      if (val) val.textContent = event.transform.k.toFixed(1) + 'x';
    });

  svg.call(zoomBehavior);

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

      // Neighbor countries (faded)
      gMap.selectAll('.neighbor')
        .data(countries.features.filter(f => NEIGHBORS.includes(f.id)))
        .enter().append('path')
        .attr('d', pathGen).attr('class', 'c-fill c-bdr');

      // Rwanda border outline only
      const rw = countries.features.find(f => f.id === '646');
      if (rw) {
        rwandaFeature = rw;
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
    gMap.append('path').datum(geo).attr('d', pathGen).attr('class', 'rw-fill');
  }

  // Load interactive interactive ADM1 provinces (geoBoundaries)
  try {
    rwProvData = await loadGeoBoundary('ADM1');
    if (rwProvData?.features?.length) {
      gMap.selectAll('.rw-prov-poly')
        .data(rwProvData.features)
        .enter().append('path')
        .attr('class', 'rw-prov-poly')
        .attr('d', pathGen)
        .style('fill', 'rgba(0, 255, 136, 0.05)')
        .style('stroke', 'rgba(0, 255, 136, 0.4)')
        .style('stroke-width', '1px')
        .style('cursor', 'pointer')
        .on('mouseover', function() {
          d3.select(this).style('fill', 'rgba(255, 184, 0, 0.3)');
        })
        .on('mouseout', function() {
          d3.select(this).style('fill', 'rgba(0, 255, 136, 0.05)');
        })
        .on('click', function(e, d) {
          let name = (d.properties && d.properties.shapeName) || '';
          if(name.toLowerCase().includes('kigali')) name = 'Kigali';
          else if(name.toLowerCase().includes('east')) name = 'Eastern';
          else if(name.toLowerCase().includes('north')) name = 'Northern';
          else if(name.toLowerCase().includes('west')) name = 'Western';
          else if(name.toLowerCase().includes('south')) name = 'Southern';

          const count = document.querySelector(`[data-prov="${name}"] .pov-count`)?.textContent || '0';
          const ttip = d3.select('#ttip');
          ttip.html(`<div style="padding:4px"><div style="font-size:11px;font-weight:600;color:var(--amb)">${name.toUpperCase()} PROVINCE</div><div style="margin-top:4px;color:var(--tx0)"><span style="color:var(--red)">${count}</span> LIVES LOST</div></div>`)
            .style('left', (e.clientX + 15) + 'px')
            .style('top', (e.clientY + 15) + 'px')
            .style('opacity', 1).classed('vis', true);

          // auto hide tooltip after 3 seconds
          setTimeout(() => ttip.style('opacity', 0).classed('vis', false), 3500);
        });
    }
  } catch(e) {
    console.warn('Failed to load interactive ADM1 provinces', e);
  }

  // Lake Kivu
  gMap.append('path')
    .datum({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [LAKE_KIVU] } })
    .attr('d', pathGen).attr('class', 'lake');

  // Province overlay cards — structure created once, counts updated via renderProvLabels()
  Object.entries(provinces).forEach(([name, p]) => {
    const pt = projection([p.center[1], p.center[0]]); // center: [lat, lng]
    if (!pt) return;
    const g = gProv.append('g')
      .attr('class', 'pov-g')
      .attr('data-prov', name)
      .attr('transform', `translate(${pt[0]},${pt[1]})`);

    g.append('rect').attr('x', -42).attr('y', -24).attr('width', 84).attr('height', 44).attr('rx', 3).attr('class', 'pov-bg');
    g.append('circle').attr('r', 2.5).attr('class', 'pov-dot');
    g.append('text').attr('y', -9).attr('text-anchor', 'middle').text(name.toUpperCase()).attr('class', 'pov-name');
    g.append('text').attr('y', 13).attr('text-anchor', 'middle').attr('class', 'pov-count').text('0');
    g.append('text').attr('y', 23).attr('text-anchor', 'middle').attr('class', 'pov-sub').text('LIVES LOST');
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

  renderHistFamilyLabels();
}

function renderHistFamilyLabels() {
  gHist.selectAll('*').remove();
  histFamilies.forEach(area => {
    const pt = projection([area.lng, area.lat]);
    if (!pt) return;
    const group = gHist.append('g')
      .attr('class', 'hist-family-label')
      .attr('data-hist-area', area.id)
      .attr('transform', `translate(${pt[0]},${pt[1]})`)
      .on('click', () => window.histFocusArea?.(area.id));

    group.append('circle').attr('r', 4).attr('class', 'hist-family-dot');
    group.append('text')
      .attr('x', 8).attr('y', -5)
      .attr('class', 'hist-family-name')
      .text(area.label.toUpperCase());
    group.append('text')
      .attr('x', 8).attr('y', 7)
      .attr('class', 'hist-family-count')
      .text(`${area.families.toLocaleString()} FAMILIES`);
  });
}

/**
 * Update province casualty counters on the map.
 * @param {number} day
 */
export function renderProvLabels(day) {
  Object.entries(provinces).forEach(([name, p]) => {
    const count = Math.round(provSigmoid(day, p.onset, p.share));
    gProv.select(`[data-prov="${name}"] .pov-count`)
      .text(count > 0 ? count.toLocaleString() : '0');
  });
}

/**
 * Programmatically zoom to a scale level, centered on the map.
 * @param {number} scale - Target scale (1–8)
 */
export function setMapZoom(scale) {
  const k = Math.max(1, Math.min(1.5, +scale));
  const W = mapContainer.clientWidth;
  const H = mapContainer.clientHeight;
  svg.transition().duration(220).call(
    zoomBehavior.transform,
    d3.zoomIdentity.translate(W / 2 * (1 - k), H / 2 * (1 - k)).scale(k)
  );
}

export function syncMapZoomControl() {
  const slider = document.getElementById('zoomSlider');
  const val = document.getElementById('zoomVal');
  if (slider) {
    slider.min = '1';
    slider.max = '1.5';
    slider.step = '0.05';
    slider.value = currentZoomTransform.k;
  }
  if (val) val.textContent = currentZoomTransform.k.toFixed(1) + 'x';
  document.getElementById('mapWrap')?.classList.remove('crt-zoom');
}

/**
 * Handle window resize: update projection and re-render paths.
 */
export function handleResize(container) {
  const W = container.clientWidth;
  const H = container.clientHeight;
  svg.attr('viewBox', `0 0 ${W} ${H}`);
  const rwBounds = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [FALLBACK_BORDER] } };
  projection.fitExtent([[30, 30], [W - 30, H - 30]], rwBounds);
  // Reset zoom on resize to avoid stale transform on re-projected coords
  if (zoomBehavior) {
    currentZoomTransform = d3.zoomIdentity;
    svg.call(zoomBehavior.transform, d3.zoomIdentity);
  }

  gMap.selectAll('.rw-prov-poly').attr('d', pathGen);
  gMap.selectAll('path').attr('d', pathGen);
  gDist.selectAll('.rw-dist-poly').attr('d', pathGen);

  // Reposition province cards
  Object.entries(provinces).forEach(([name, p]) => {
    const pt = projection([p.center[1], p.center[0]]);
    if (pt) gProv.select(`[data-prov="${name}"]`).attr('transform', `translate(${pt[0]},${pt[1]})`);
  });

  // Reposition grid lines
  gGrid.selectAll('*').remove();
  for (let la = -3; la <= -1; la += 0.25) {
    const a = projection([28, la]), b = projection([31.5, la]);
    if (a && b) gGrid.append('line').attr('x1', a[0]).attr('y1', a[1]).attr('x2', b[0]).attr('y2', b[1]).attr('class', 'grid-ln');
  }
  for (let lo = 28.5; lo <= 31; lo += 0.25) {
    const a = projection([lo, -0.8]), b = projection([lo, -3]);
    if (a && b) gGrid.append('line').attr('x1', a[0]).attr('y1', a[1]).attr('x2', b[0]).attr('y2', b[1]).attr('class', 'grid-ln');
  }

  // Reposition cities
  gLbl.selectAll('.city-dot').each(function(d, i) {
    const p = projection([cities[i].lng, cities[i].lat]);
    d3.select(this).attr('cx', p[0]).attr('cy', p[1]);
  });
  gLbl.selectAll('.city-lbl').each(function(d, i) {
    const p = projection([cities[i].lng, cities[i].lat]);
    d3.select(this).attr('x', p[0] + 5).attr('y', p[1] + 3);
  });

  renderHistFamilyLabels();
}

/**
 * Load ADM2 district boundaries from geoBoundaries and render invisible polygons.
 * Called after initMap() during app init.
 */
export async function initDistricts() {
  try {
    rwDistData = await getDistrictGeoJson();
    if (rwDistData?.features?.length) {
      gDist.selectAll('.rw-dist-poly')
        .data(rwDistData.features)
        .enter().append('path')
        .attr('class', 'rw-dist-poly')
        .attr('d', pathGen)
        .attr('data-name', d => (d.properties.shapeName || '').toLowerCase());
    }
  } catch (e) {
    console.warn('ADM2 district layer unavailable', e);
  }
}

export async function getDistrictGeoJson() {
  if (rwDistData?.features?.length) return rwDistData;
  rwDistData = await loadGeoBoundary('ADM2');
  return rwDistData;
}

/**
 * Highlight the named district polygon and zoom the map to it.
 * Returns true if a match was found in the loaded ADM2 data.
 * @param {string} name - District name (fuzzy-matched)
 */
export function highlightDistrict(name) {
  gDist.selectAll('.rw-dist-poly').classed('dist-highlighted', false);
  if (!rwDistData) return false;

  const lower = name.toLowerCase().trim();
  let found = null;

  gDist.selectAll('.rw-dist-poly').each(function(d) {
    if (found) return;
    const n = (d.properties.shapeName || '').toLowerCase().trim();
    if (n === lower || n.includes(lower) || lower.includes(n)) {
      d3.select(this).classed('dist-highlighted', true);
      found = d;
    }
  });

  if (found) {
    svg.transition().duration(650).call(
      zoomBehavior.transform,
      districtFocusTransform(pathGen.bounds(found), 90)
    );
    return true;
  }
  return false;
}

/** Remove any district highlight and heat circles. */
export function clearDistrictHighlight() {
  gDist.selectAll('.rw-dist-poly').classed('dist-highlighted', false);
  gDist.selectAll('.dist-heat-circle').remove();
}

/**
 * Zoom the map to a geographic point at scale k.
 * @param {number} lng
 * @param {number} lat
 * @param {number} k - zoom scale (default 3.5)
 */
export function zoomToPoint(lng, lat, k = 1.5) {
  const pt = projection([lng, lat]);
  if (!pt) return;
  const W = mapContainer.clientWidth;
  const H = mapContainer.clientHeight;
  svg.transition().duration(650).call(
    zoomBehavior.transform,
    d3.zoomIdentity.translate(W / 2 - k * pt[0], H / 2 - k * pt[1]).scale(k)
  );
}

/**
 * Focus a district: always draws a red heatmap indicator at (lng, lat),
 * additionally highlights the ADM2 polygon when available, and optionally zooms in.
 * Works even before geoBoundaries has loaded.
 * @param {string}  name     - district name for polygon fuzzy-match
 * @param {number}  lng
 * @param {number}  lat
 * @param {boolean} zoom     - whether to pan/zoom the map (default true; pass false for HIST mode)
 */
export function focusDistrictAt(name, lng, lat, zoom = true) {
  // ── Clear previous state ──────────────────────────────
  gDist.selectAll('.rw-dist-poly').classed('dist-highlighted', false);
  gDist.selectAll('.dist-heat-circle').remove();

  const pt = projection([lng, lat]);

  // ── Always draw red heat indicator at centre ──────────
  if (pt) {
    // Outer expanding sonar ring (SVG SMIL animation)
    const ring = gDist.append('circle')
      .attr('class', 'dist-heat-circle')
      .attr('cx', pt[0]).attr('cy', pt[1])
      .attr('r', 5)
      .style('fill', 'none')
      .style('stroke', '#ff2244')
      .style('stroke-width', '1.5px')
      .style('pointer-events', 'none');
    ring.append('animate')
      .attr('attributeName', 'r')
      .attr('from', 5).attr('to', 30)
      .attr('dur', '2s').attr('repeatCount', 'indefinite');
    ring.append('animate')
      .attr('attributeName', 'opacity')
      .attr('from', 0.9).attr('to', 0)
      .attr('dur', '2s').attr('repeatCount', 'indefinite');

    // Radial gradient glow using existing #heat defs
    gDist.append('circle')
      .attr('class', 'dist-heat-circle')
      .attr('cx', pt[0]).attr('cy', pt[1])
      .attr('r', 18)
      .style('fill', 'url(#heat)')
      .style('pointer-events', 'none');

    // Solid centre dot
    gDist.append('circle')
      .attr('class', 'dist-heat-circle dist-heat-dot')
      .attr('cx', pt[0]).attr('cy', pt[1])
      .attr('r', 3.5)
      .style('fill', '#ff2244')
      .style('stroke', 'rgba(255,255,255,0.7)')
      .style('stroke-width', '1px')
      .style('pointer-events', 'none');
  }

  // ── Try ADM2 polygon highlight ────────────────────────
  let polygonBounds = null;
  if (rwDistData) {
    const lower = name.toLowerCase().trim();
    gDist.selectAll('.rw-dist-poly').each(function(d) {
      if (polygonBounds) return;
      const n = (d.properties.shapeName || '').toLowerCase().trim();
      if (n === lower || n.includes(lower) || lower.includes(n)) {
        d3.select(this).classed('dist-highlighted', true);
        polygonBounds = pathGen.bounds(d);
      }
    });
  }

  // ── Zoom (skipped in HIST mode) ───────────────────────
  if (zoom) {
    const W = mapContainer.clientWidth;
    const H = mapContainer.clientHeight;

    if (polygonBounds) {
      svg.transition().duration(700).call(
        zoomBehavior.transform,
        districtFocusTransform(polygonBounds)
      );
    } else if (pt) {
      const k = 1.5;
      svg.transition().duration(700).call(
        zoomBehavior.transform,
        d3.zoomIdentity.translate(W / 2 - k * pt[0], H / 2 - k * pt[1]).scale(k)
      );
    }
  }
}
