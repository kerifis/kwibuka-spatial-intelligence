/**
 * Prefectures module: 1994 historical prefecture overlay.
 * Renders 11 préfectures with colored fills, labels, capital markers,
 * and real-time lives-lost counters per prefecture.
 * Enabled by default. Toggled independently of display mode filters.
 */
import * as d3 from 'd3';
import { gPref, gLbl, projection, pathGen } from './map.js';
import { provSigmoid } from './sigmoid.js';
import provinces from '../data/provinces.json';
import prefData from '../data/prefectures1994.json';

// Map each 1994 prefecture to its modern province + intra-province share
const PREF_PROVINCE = {
  gs: { prov: 'Northern', subShare: 0.35 },
  rh: { prov: 'Northern', subShare: 0.40 },
  bm: { prov: 'Northern', subShare: 0.25 },
  kv: { prov: 'Kigali',   subShare: 0.55 },
  kg: { prov: 'Kigali',   subShare: 0.45 },
  gt: { prov: 'Southern', subShare: 0.36 },
  kb: { prov: 'Western',  subShare: 0.48 },
  cy: { prov: 'Western',  subShare: 0.52 },
  gk: { prov: 'Southern', subShare: 0.24 },
  bt: { prov: 'Southern', subShare: 0.40 },
  kn: { prov: 'Eastern',  subShare: 1.00 },
};

let prefVisible = true;

export function isPrefVisible() { return prefVisible; }

export function togglePrefectures() {
  prefVisible = !prefVisible;
  document.getElementById('pref94Sw').classList.toggle('on', prefVisible);
  document.getElementById('pref94Banner').style.display = prefVisible ? 'block' : 'none';
  // Fade out modern province labels when 1994 mode is active
  gLbl.selectAll('.prov-lbl').attr('opacity', prefVisible ? 0 : null);
  renderPrefectures();
}

/**
 * Initialize prefectures as enabled at startup (called once after map init).
 */
export function initPrefectures() {
  document.getElementById('pref94Sw').classList.add('on');
  document.getElementById('pref94Banner').style.display = 'block';
  gLbl.selectAll('.prov-lbl').attr('opacity', 0);
  renderPrefectures();
}

export function renderPrefectures() {
  gPref.selectAll('*').remove();
  if (!prefVisible) return;

  const tip = document.getElementById('ttip');

  prefData.forEach(p => {
    const feature = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [p.poly] }
    };

    // Filled polygon
    gPref.append('path')
      .datum(feature)
      .attr('d', pathGen)
      .attr('fill', p.color)
      .attr('fill-opacity', 0.10)
      .attr('stroke', p.color)
      .attr('stroke-width', 1.2)
      .attr('stroke-opacity', 0.75)
      .attr('stroke-dasharray', '5,2')
      .attr('class', 'pref-region')
      .on('mouseenter', function () {
        d3.select(this).attr('fill-opacity', 0.22).attr('stroke-opacity', 1.0);
        tip.innerHTML = `<b>${p.name}</b>${p.capital ? ' — ' + p.capital : ''}<br><span style="font-size:8px;opacity:.7">${p.note}</span>`;
        const pt = projection([p.lng, p.lat]);
        if (pt) {
          tip.style.left = pt[0] + 'px';
          tip.style.top = (pt[1] - 12) + 'px';
        }
        tip.classList.add('vis');
        tip.style.maxWidth = '260px';
        tip.style.whiteSpace = 'normal';
        tip.style.lineHeight = '1.5';
        tip.style.padding = '6px 10px';
      })
      .on('mouseleave', function () {
        d3.select(this).attr('fill-opacity', 0.10).attr('stroke-opacity', 0.75);
        tip.classList.remove('vis');
        tip.style.maxWidth = '';
        tip.style.whiteSpace = 'nowrap';
        tip.style.lineHeight = '';
        tip.style.padding = '';
      });

    // Prefecture name label
    const pt = projection([p.lng, p.lat]);
    if (pt) {
      gPref.append('text')
        .attr('x', pt[0]).attr('y', pt[1])
        .text(p.name)
        .attr('text-anchor', 'middle')
        .attr('class', 'pref-lbl')
        .style('fill', p.color);

      // Lives lost counter — updated each frame by updatePrefLives()
      gPref.append('text')
        .attr('id', `pl-${p.id}`)
        .attr('x', pt[0]).attr('y', pt[1] + 13)
        .text('0')
        .attr('text-anchor', 'middle')
        .attr('class', 'pref-lives-lbl')
        .style('fill', p.color)
        .style('opacity', 0.85);
    }

    // Capital marker + label
    if (p.capLat !== null && p.capLng !== null) {
      const cp = projection([p.capLng, p.capLat]);
      if (cp) {
        const s = 3.5;
        gPref.append('path')
          .attr('d', `M${cp[0]},${cp[1]-s} L${cp[0]+s},${cp[1]} L${cp[0]},${cp[1]+s} L${cp[0]-s},${cp[1]} Z`)
          .attr('fill', p.color)
          .attr('fill-opacity', 0.8)
          .attr('stroke', 'none')
          .attr('pointer-events', 'none');
        gPref.append('text')
          .attr('x', cp[0] + 5).attr('y', cp[1] + 3)
          .text(p.capital)
          .attr('class', 'pref-cap-lbl')
          .style('fill', p.color);
      }
    }
  });
}

/**
 * Update per-prefecture lives-lost numbers on the map.
 * Called every render frame from main.js update().
 * @param {number} day - Current timeline day
 */
export function updatePrefLives(day) {
  if (!prefVisible) return;
  prefData.forEach(p => {
    const mapping = PREF_PROVINCE[p.id];
    if (!mapping) return;
    const provData = provinces[mapping.prov];
    if (!provData) return;
    const val = Math.round(provSigmoid(day, provData.onset, provData.share) * mapping.subShare);
    const el = document.getElementById(`pl-${p.id}`);
    if (el) el.textContent = val > 0 ? val.toLocaleString() : '—';
  });
}
