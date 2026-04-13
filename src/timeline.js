/**
 * Timeline module: scrubber, playback, drag/touch handling.
 */
import events from '../data/events.json';
import { TOTAL_DAYS } from './sigmoid.js';

const PHASES = [
  { n: 'Trigger & initial killings',  s: 0,  e: 5,   c: 'var(--red)' },
  { n: 'Spread to all provinces',     s: 6,  e: 15,  c: 'var(--red2)' },
  { n: 'Systematic extermination',    s: 16, e: 78,  c: 'var(--red3)' },
  { n: 'Intervention & RPF advance',  s: 79, e: 102, c: 'var(--amb2)' },
];

let playing = false;
let speed = 1;
let interval = null;

/**
 * Get the current phase for a given day.
 */
export function getPhase(day) {
  for (let i = PHASES.length - 1; i >= 0; i--) {
    if (day >= PHASES[i].s) return PHASES[i];
  }
  return PHASES[0];
}

/**
 * Build static timeline elements (ticks, phase bars, event markers).
 */
export function buildTimeline() {
  const markers = document.getElementById('tMarkers');

  // Month ticks
  [
    { l: 'APR 7', d: 1 }, { l: 'APR 15', d: 9 },
    { l: 'MAY 1', d: 25 }, { l: 'MAY 15', d: 39 },
    { l: 'JUN 1', d: 56 }, { l: 'JUN 15', d: 70 },
    { l: 'JUL 1', d: 86 }, { l: 'JUL 15', d: 100 },
  ].forEach(m => {
    const pct = (m.d / TOTAL_DAYS) * 100;
    const tick = document.createElement('div');
    tick.className = 'ttick';
    tick.style.left = pct + '%';
    markers.appendChild(tick);
    const lbl = document.createElement('div');
    lbl.className = 'ttlbl';
    lbl.style.left = pct + '%';
    lbl.textContent = m.l;
    markers.appendChild(lbl);
  });

  // Phase bars
  PHASES.forEach(ph => {
    const s = (ph.s / TOTAL_DAYS) * 100;
    const e = (ph.e / TOTAL_DAYS) * 100;
    const bar = document.createElement('div');
    bar.className = 'tph';
    bar.style.left = s + '%';
    bar.style.width = (e - s) + '%';
    bar.style.background = ph.c;
    markers.appendChild(bar);
  });

  // Event tick marks (significant events only)
  events.filter(e => e.lives >= 3000).forEach(ev => {
    const pct = (ev.day / TOTAL_DAYS) * 100;
    const tick = document.createElement('div');
    tick.className = 'tmrk';
    tick.style.left = pct + '%';
    tick.style.background = 'var(--red)';
    markers.appendChild(tick);
  });
}

/**
 * Update timeline visual position.
 * @param {number} day - Current day
 * @param {string} mode - Display mode for progress bar color
 */
export function updateTimelinePosition(day, mode) {
  const pct = (day / TOTAL_DAYS) * 100;
  const progColor = mode === 'nvg'
    ? 'linear-gradient(90deg,var(--grn3),var(--grn))'
    : mode === 'crt'
      ? 'linear-gradient(90deg,rgba(255,184,0,.2),var(--amb))'
      : 'linear-gradient(90deg,var(--grn3),var(--red))';
  document.getElementById('tProg').style.width = pct + '%';
  document.getElementById('tProg').style.background = progColor;
  document.getElementById('tHandle').style.left = pct + '%';
}

/**
 * Bind timeline drag/touch interactions.
 * @param {Function} onDayChange - Callback with new day number
 */
export function bindTimelineEvents(onDayChange) {
  const track = document.getElementById('tTrack');
  let dragging = false;

  const scrub = (clientX) => {
    const rect = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onDayChange(Math.round(pct * TOTAL_DAYS));
  };

  track.addEventListener('mousedown', e => { dragging = true; scrub(e.clientX); });
  window.addEventListener('mousemove', e => { if (dragging) scrub(e.clientX); });
  window.addEventListener('mouseup', () => { dragging = false; });
  track.addEventListener('touchstart', e => { dragging = true; scrub(e.touches[0].clientX); }, { passive: true });
  window.addEventListener('touchmove', e => { if (dragging) scrub(e.touches[0].clientX); }, { passive: true });
  window.addEventListener('touchend', () => { dragging = false; });
}

/**
 * Toggle playback.
 * @param {Function} onTick - Called each tick with new day
 * @param {Function} getCurrentDay - Returns current day
 */
export function togglePlay(onTick, getCurrentDay) {
  playing = !playing;
  document.getElementById('pBtn').innerHTML = playing ? '&#9646;&#9646;' : '&#9654;';
  if (playing) {
    let day = getCurrentDay();
    if (day >= TOTAL_DAYS) day = 0;
    interval = setInterval(() => {
      day++;
      if (day > TOTAL_DAYS) { day = 0; }
      onTick(day);
    }, 1000 / speed);
  } else {
    clearInterval(interval);
  }
}

/**
 * Set playback speed.
 * @param {number} s - Speed multiplier (1, 2, 4, 8)
 */
export function setSpeed(s, onTick, getCurrentDay) {
  speed = s;
  document.querySelectorAll('.sbtn').forEach(btn =>
    btn.classList.toggle('on', parseInt(btn.dataset.s) === s));
  if (playing) {
    clearInterval(interval);
    let day = getCurrentDay();
    interval = setInterval(() => {
      day++;
      if (day > TOTAL_DAYS) { day = 0; }
      onTick(day);
    }, 1000 / speed);
  }
}
