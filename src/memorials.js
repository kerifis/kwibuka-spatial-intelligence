/**
 * Memorials module: diamond markers, UNESCO badges, testimony integration.
 */
import * as d3 from 'd3';
import { gMark, projection } from './map.js';
import { showInfoCard } from './infocard.js';
import memorials from '../data/memorials.json';

export let showMemorials = true;

export function toggleMemorials() {
  showMemorials = !showMemorials;
  document.getElementById('memSw').classList.toggle('on', showMemorials);
}

/**
 * Render memorial diamond markers on the map.
 * @param {string} mode - Current display mode
 */
export function renderMemorialMarkers(mode) {
  if (!showMemorials) return;

  const mc = mode === 'nvg' ? '#00ff88' : mode === 'crt' ? '#ffb800' : '#ffffff';
  const mcDim = mode === 'nvg' ? 'rgba(0,255,136,.15)' : mode === 'crt' ? 'rgba(255,184,0,.12)' : 'rgba(255,255,255,.08)';
  const mcStroke = mode === 'nvg' ? 'rgba(0,255,136,.5)' : mode === 'crt' ? 'rgba(255,184,0,.4)' : 'rgba(255,255,255,.35)';

  memorials.forEach(m => {
    const p = projection([m.lng, m.lat]);
    if (!p) return;
    const sz = m.badge === 'unesco' ? 10 : m.badge === 'natl' ? 8 : 6;

    // Diamond shape (rotated square)
    gMark.append('polygon')
      .attr('points', `${p[0]},${p[1] - sz} ${p[0] + sz},${p[1]} ${p[0]},${p[1] + sz} ${p[0] - sz},${p[1]}`)
      .attr('fill', mcDim)
      .attr('stroke', mcStroke)
      .attr('stroke-width', m.badge === 'unesco' ? 1.5 : 1)
      .attr('class', 'memorial-diamond')
      .attr('cursor', 'pointer')
      .on('click', () => {
        const mem = { ...m, _isMemorial: true };
        showInfoCard(mem, p);
      })
      .on('mouseenter', function () {
        d3.select(this)
          .attr('stroke', mc).attr('stroke-width', 2)
          .attr('fill', mode === 'nvg' ? 'rgba(0,255,136,.25)' : mode === 'crt' ? 'rgba(255,184,0,.2)' : 'rgba(255,255,255,.15)');
        const t = document.getElementById('ttip');
        t.textContent = m.name;
        t.style.left = p[0] + 'px';
        t.style.top = (p[1] - sz - 2) + 'px';
        t.classList.add('vis');
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('stroke', mcStroke)
          .attr('stroke-width', m.badge === 'unesco' ? 1.5 : 1)
          .attr('fill', mcDim);
        document.getElementById('ttip').classList.remove('vis');
      });

    // Outer dashed diamond for UNESCO sites
    if (m.badge === 'unesco') {
      gMark.append('polygon')
        .attr('points', `${p[0]},${p[1] - sz - 4} ${p[0] + sz + 4},${p[1]} ${p[0]},${p[1] + sz + 4} ${p[0] - sz - 4},${p[1]}`)
        .attr('fill', 'none')
        .attr('stroke', mcStroke)
        .attr('stroke-width', 0.4)
        .attr('stroke-dasharray', '3,3')
        .attr('pointer-events', 'none');
    }
  });
}
