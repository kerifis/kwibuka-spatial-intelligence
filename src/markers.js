/**
 * Markers module: event markers with scaling, pulse animation, tooltips.
 */
import * as d3 from 'd3';
import { gMark, projection } from './map.js';
import events from '../data/events.json';
import { showInfoCard } from './infocard.js';

const MAX_LIVES = Math.max(...events.map(e => e.lives), 1);

/**
 * Render event markers for the current day.
 * @param {Array} activeEvents - Events that have occurred by current day
 * @param {number} day - Current timeline day
 * @param {string} mode - Display mode
 */
export function renderMarkers(activeEvents, day, mode) {
  gMark.selectAll('*').remove();

  const mc = mode === 'nvg' ? 'var(--grn)' : mode === 'crt' ? 'var(--amb)' : 'var(--red)';
  const mc2 = mode === 'nvg' ? 'rgba(0,255,136,.45)' : mode === 'crt' ? 'rgba(255,184,0,.45)' : 'rgba(255,34,68,.5)';

  activeEvents.forEach(ev => {
    const p = projection([ev.lng, ev.lat]);
    if (!p) return;

    // Memorial type handled by memorials.js
    if (ev.type === 'Memorial') {
      gMark.append('circle')
        .attr('cx', p[0]).attr('cy', p[1]).attr('r', 6)
        .attr('fill', 'none').attr('stroke', 'rgba(255,255,255,.2)')
        .attr('stroke-width', 0.5).attr('stroke-dasharray', '2,2')
        .attr('cursor', 'pointer')
        .on('click', () => showInfoCard(ev, p));
      return;
    }

    const age = day - ev.day;
    const growFactor = Math.min(1, age / 8);
    const baseR = ev.lives === 0 ? 3 : Math.max(3, Math.sqrt(ev.lives / MAX_LIVES) * 22 * growFactor);
    const opacity = ev.lives === 0 ? 0.35 : Math.max(0.25, 1 - age * 0.006) * growFactor;

    // Dashed outer ring for significant events
    if (ev.lives > 500) {
      gMark.append('circle')
        .attr('cx', p[0]).attr('cy', p[1]).attr('r', baseR + 3)
        .attr('fill', 'none').attr('stroke', mc)
        .attr('stroke-width', 0.4).attr('stroke-opacity', opacity * 0.3)
        .attr('stroke-dasharray', '2,2');
    }

    // Main marker circle
    gMark.append('circle')
      .attr('cx', p[0]).attr('cy', p[1]).attr('r', baseR)
      .attr('fill', (ev.type === 'Military' || ev.type === 'Intervention') ? 'var(--amb)' : mc2)
      .attr('fill-opacity', ev.lives === 0 ? 0.3 : opacity * 0.5)
      .attr('stroke', (ev.type === 'Military' || ev.type === 'Intervention') ? 'var(--amb)' : mc)
      .attr('stroke-width', ev.lives === 0 ? 0.5 : 1)
      .attr('stroke-opacity', opacity * 0.7)
      .attr('cursor', 'pointer')
      .on('click', () => showInfoCard(ev, p))
      .on('mouseenter', function () {
        d3.select(this).attr('stroke-width', 2).attr('stroke-opacity', 1);
        const t = document.getElementById('ttip');
        t.textContent = ev.name + (ev.lives > 0 ? ` — ${ev.lives.toLocaleString()} lives` : '');
        t.style.left = p[0] + 'px';
        t.style.top = (p[1] - baseR) + 'px';
        t.classList.add('vis');
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke-width', ev.lives === 0 ? 0.5 : 1).attr('stroke-opacity', opacity * 0.7);
        document.getElementById('ttip').classList.remove('vis');
      });

    // Pulse animation for recent high-casualty events
    if (age <= 5 && ev.lives > 2000) {
      const pulse = gMark.append('circle')
        .attr('cx', p[0]).attr('cy', p[1]).attr('r', baseR)
        .attr('fill', 'none').attr('stroke', mc).attr('stroke-width', 1.2);
      pulse.append('animate')
        .attr('attributeName', 'r').attr('from', baseR).attr('to', baseR + 30)
        .attr('dur', '2s').attr('repeatCount', 'indefinite');
      pulse.append('animate')
        .attr('attributeName', 'stroke-opacity').attr('from', '.5').attr('to', '0')
        .attr('dur', '2s').attr('repeatCount', 'indefinite');
    }
  });
}
