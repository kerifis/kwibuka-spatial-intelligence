/**
 * Stats module: updates the side panel with cumulative data.
 */
import { provSigmoid, TOTAL_LIVES, dayToDate, formatDate } from './sigmoid.js';
import provinces from '../data/provinces.json';

const MAX_RPF_SAVED = 300_000;

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

// Track the highest rate seen this session for the bar fill
let peakRate = 0;
let prevRate = 0;
let rateAnimFrame = null;

function animateCounter(el, from, to, duration = 350) {
  if (rateAnimFrame) cancelAnimationFrame(rateAnimFrame);
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    el.textContent = Math.round(from + (to - from) * eased).toLocaleString();
    if (t < 1) rateAnimFrame = requestAnimationFrame(step);
    else { el.textContent = to.toLocaleString(); rateAnimFrame = null; }
  };
  requestAnimationFrame(step);
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

  const savedProgress = Math.min(1, Math.max(0, day) / 100);
  const saved = Math.round(1 + (MAX_RPF_SAVED - 1) * savedProgress);
  document.getElementById('sSaved').textContent = saved.toLocaleString();
  document.getElementById('sSavedFill').style.width = `${savedProgress * 100}%`;

  // Daily-deaths counter card
  const dcVal = document.getElementById('dcVal');
  const dcFill = document.getElementById('dcFill');
  const dcPeak = document.getElementById('dcPeak');
  const dcCard = document.getElementById('dailyCounter');
  if (dcVal && dcFill && dcPeak && dcCard) {
    animateCounter(dcVal, prevRate, rate);
    prevRate = rate;
    dcCard.classList.remove('tick');
    void dcCard.offsetWidth;
    dcCard.classList.add('tick');
    // Update peak
    if (rate > peakRate) {
      peakRate = rate;
    }
    // Fill bar: 8500 is approx peak of the sigmoid derivative
    const MAX_RATE = 8500;
    const fillPct = Math.min(100, (rate / MAX_RATE) * 100);
    dcFill.style.width = fillPct + '%';
    dcPeak.textContent = `Peak seen: ${peakRate.toLocaleString()} lives/day`;
  }

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
