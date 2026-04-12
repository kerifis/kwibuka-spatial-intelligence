/**
 * Heatmap module: radial gradient circles that grow with time.
 */
import { gHeat, projection } from './map.js';
import { provSigmoid, TOTAL_LIVES } from './sigmoid.js';
import provinces from '../data/provinces.json';

/**
 * Render heatmap circles for active events + province ambient heat.
 * @param {Array} events - Active events up to current day
 * @param {number} day - Current timeline day
 * @param {string} mode - Display mode (std, nvg, crt, flir)
 */
export function renderHeatmap(events, day, mode) {
  gHeat.selectAll('*').remove();
  const gradId = mode === 'nvg' ? 'heatG' : mode === 'crt' ? 'heatA' : 'heat';

  // Per-event heatmap circles
  events.filter(e => e.lives > 100 && e.type !== 'Memorial').forEach(ev => {
    const p = projection([ev.lng, ev.lat]);
    if (!p) return;
    const age = day - ev.day;
    const growthFactor = Math.min(1, age / 15);
    const baseR = Math.sqrt(ev.lives / 50000) * 60;
    const r = baseR * growthFactor + 8;
    const op = Math.min(0.55, ev.lives / 50000 + 0.08) * growthFactor;
    gHeat.append('circle')
      .attr('cx', p[0]).attr('cy', p[1]).attr('r', r)
      .attr('fill', `url(#${gradId})`).attr('opacity', op);
  });

  // Province-level ambient heat
  Object.entries(provinces).forEach(([, v]) => {
    const val = provSigmoid(day, v.onset, v.share);
    if (val < 1000) return;
    const p = projection([v.center[1], v.center[0]]);
    if (!p) return;
    const r = Math.sqrt(val / TOTAL_LIVES) * 120 + 10;
    const op = Math.min(0.3, val / TOTAL_LIVES + 0.03);
    gHeat.append('circle')
      .attr('cx', p[0]).attr('cy', p[1]).attr('r', r)
      .attr('fill', `url(#${gradId})`).attr('opacity', op);
  });
}
