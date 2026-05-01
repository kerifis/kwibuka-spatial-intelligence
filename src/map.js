/**
 * Map module: D3 Mercator projection, topology loading, base layer rendering.
 */
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import cities from '../data/cities.json';
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

export let projection, pathGen, svg;
export let gGrid, gMap, gHeat, gRpf, gMark, gLbl, gProv;
let rwProvData = null;
let rwandaFeature = {
  type: 'Feature',
  geometry: { type: 'Polygon', coordinates: [FALLBACK_BORDER] },
};

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

  // Removed static bgImage. We will now load interactive modern provinces.

  // Create layer groups (order = z-index)
  gGrid = svg.append('g').attr('class', 'grid-layer');
  gMap  = svg.append('g').attr('class', 'map-layer');
  gHeat = svg.append('g').attr('class', 'heat-layer');
  gRpf  = svg.append('g').attr('class', 'rpf-layer');
  gProv = svg.append('g').attr('class', 'prov-layer');
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
    const res = await d3.json('https://www.geoboundaries.org/api/current/gbOpen/RWA/ADM1/');
    if (res && res.gjDownloadURL) {
      rwProvData = await d3.json(res.gjDownloadURL);
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
 * Handle window resize: update projection and re-render paths.
 */
export function handleResize(container) {
  const W = container.clientWidth;
  const H = container.clientHeight;
  svg.attr('viewBox', `0 0 ${W} ${H}`);
  const rwBounds = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [FALLBACK_BORDER] } };
  projection.fitExtent([[30, 30], [W - 30, H - 30]], rwBounds);

  gMap.selectAll('.rw-prov-poly').attr('d', pathGen);
  gMap.selectAll('path').attr('d', pathGen);

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
}
