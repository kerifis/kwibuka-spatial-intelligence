/**
 * KWIBUKA // Spatial Intelligence Dashboard
 * Main entry point: initializes all modules and binds global state.
 */
import './styles.css';

import events from '../data/events.json';
import { sigmoid, sigmoidRate, dayToDate, formatDate, TOTAL_DAYS } from './sigmoid.js';
import { initMap, projection, handleResize } from './map.js';
import { renderHeatmap } from './heatmap.js';
import { renderMarkers } from './markers.js';
import { renderMemorialMarkers, toggleMemorials as toggleMemLayer } from './memorials.js';
import { togglePrefectures, initPrefectures, updatePrefLives } from './prefectures.js';
import { showInfoCard, closeInfoCard, showTab } from './infocard.js';
import { setMode, currentMode } from './filters.js';
import { buildTimeline, updateTimelinePosition, bindTimelineEvents, togglePlay, setSpeed, getPhase } from './timeline.js';
import { buildProvinceBars, updateStats, renderEventList } from './stats.js';

// ── Global State ──────────────────────────────────────────
let currentDay = 0;

function getActiveEvents(day) {
  return events.filter(e => e.day <= day);
}

// ── Core Update Loop ──────────────────────────────────────
function update(day) {
  currentDay = day;
  const dt = dayToDate(day);
  const phase = getPhase(day);
  const active = getActiveEvents(day);
  const cumul = Math.round(sigmoid(day));
  const rate = Math.round(sigmoidRate(day));
  const mode = currentMode;

  // Header
  document.getElementById('hDate').textContent = formatDate(dt);
  document.getElementById('hPhase').textContent = phase.n.toUpperCase();
  document.getElementById('hDay').textContent = `DAY ${Math.max(0, day)} / 100`;

  // Timeline
  updateTimelinePosition(day, mode);

  // Stats
  updateStats(cumul, rate, active, day);

  // Map layers
  renderHeatmap(active, day, mode);
  renderMarkers(active, day, mode);
  renderMemorialMarkers(mode);
  updatePrefLives(day);
  renderEventList(active);
}

// ── Initialization ────────────────────────────────────────
async function init() {
  const container = document.getElementById('mapWrap');

  await initMap(container);
  document.getElementById('ldg').style.display = 'none';

  buildProvinceBars();
  buildTimeline();
  bindTimelineEvents(day => update(day));
  initPrefectures();
  update(0);
  togglePlay(day => update(day), () => currentDay);

  // Coordinate display on mouse move
  container.addEventListener('mousemove', e => {
    const rect = container.getBoundingClientRect();
    const coords = projection.invert([e.clientX - rect.left, e.clientY - rect.top]);
    if (coords) {
      document.getElementById('coordD').textContent =
        `${Math.abs(coords[1]).toFixed(4)} ${coords[1] < 0 ? 'S' : 'N'}, ` +
        `${Math.abs(coords[0]).toFixed(4)} ${coords[0] < 0 ? 'W' : 'E'}`;
    }
  });

  // Resize handler
  window.addEventListener('resize', () => {
    handleResize(container);
    update(currentDay);
  });
}

// ── Global Event Handlers (bound to window for HTML onclick) ──
window.__showEventById = (id) => {
  const ev = events.find(e => e.id === id);
  if (!ev) return;
  const p = projection([ev.lng, ev.lat]);
  if (p) showInfoCard(ev, p);
};

window.setMode = (mode) => setMode(mode, () => update(currentDay));
window.togglePlay = () => togglePlay(day => update(day), () => currentDay);
window.setSpd = (s) => setSpeed(s, day => update(day), () => currentDay);
window.toggleMemorials = () => { toggleMemLayer(); update(currentDay); };
window.togglePref1994  = () => togglePrefectures();
window.closeIC = () => closeInfoCard();
window.showTab = (t) => showTab(t);

// ── Boot ──────────────────────────────────────────────────
init();
