/**
 * Stats module: updates the side panel with cumulative data.
 */
import { provSigmoid, TOTAL_LIVES, dayToDate, formatDate } from './sigmoid.js';
import { showInfoCard } from './infocard.js';
import { projection } from './map.js';
import provinces from '../data/provinces.json';

/**
 * Build province progress bars (called once at init).
 */
export function buildProvinceBars() {
  const el = document.getElementById('provBars');
  el.innerHTML = Object.entries(provinces).map(([k, v]) =>
    `<div class="prov-bar">` +
    `<span class="pb-name">${k}</span>` +
    `<div class="pb-track"><div class="pb-fill" id="pb_${k}" style="width:0;background:${v.color}"></div></div>` +
    `<span class="pb-val" id="pv_${k}">0</span>` +
    `</div>`
  ).join('');
}

/**
 * Update all stats panel values.
 * @param {number} cumulativeLives - Total lives lost to date (from sigmoid)
 * @param {number} rate - Current daily killing rate
 * @param {Array} activeEvents - Events that have occurred by current day
 * @param {number} day - Current timeline day
 */
export function updateStats(cumulativeLives, rate, activeEvents, day) {
  document.getElementById('bigCount').textContent = cumulativeLives.toLocaleString();
  document.getElementById('rateVal').textContent = rate.toLocaleString();
  document.getElementById('sLives').textContent = cumulativeLives.toLocaleString();
  document.getElementById('sSites').textContent = activeEvents.filter(e => e.lives > 0).length;

  const provs = [...new Set(activeEvents.map(e => e.prov))];
  document.getElementById('sProv').textContent = provs.length;

  // Province progress bars
  Object.entries(provinces).forEach(([k, v]) => {
    const val = Math.round(provSigmoid(day, v.onset, v.share));
    const el = document.getElementById('pb_' + k);
    const vl = document.getElementById('pv_' + k);
    if (el) el.style.width = Math.min(100, (val / TOTAL_LIVES * 100) * 5) + '%';
    if (vl) vl.textContent = val.toLocaleString();
  });
}

/**
 * Render the event list in the side panel.
 * @param {Array} activeEvents
 */
export function renderEventList(activeEvents) {
  const el = document.getElementById('evList');
  if (!activeEvents.length) {
    el.innerHTML = '<div style="text-align:center;padding:12px;color:var(--tx3);font-size:9px;letter-spacing:1px">Advance timeline</div>';
    return;
  }

  const sorted = [...activeEvents]
    .filter(e => e.type !== 'Memorial')
    .sort((a, b) => b.day - a.day || b.lives - a.lives);

  el.innerHTML = sorted.slice(0, 12).map(ev => {
    const typeClass = (ev.type === 'Massacre' || ev.type === 'Resistance') ? 'massacre'
      : (ev.type === 'Military' || ev.type === 'Intervention') ? 'military' : '';
    return `<div class="evi ${typeClass}" onclick="window.__showEventById(${ev.id})">` +
      `<div class="en">${ev.name}</div>` +
      `<div class="ed">${formatDate(dayToDate(ev.day))} // ${ev.type}</div>` +
      (ev.lives > 0 ? `<div class="ec">${ev.lives.toLocaleString()} lives</div>` : '') +
      `</div>`;
  }).join('');
}
