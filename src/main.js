/**
 * KWIBUKA // Spatial Intelligence Dashboard
 * Main entry point: initializes all modules and binds global state.
 */
import './styles.css';

import events from '../data/events.json';
import { synthesizeMatrix } from './gemini.js';
import { sigmoid, sigmoidRate, dayToDate, formatDate, TOTAL_DAYS } from './sigmoid.js';
import { initMap, projection, handleResize, renderProvLabels } from './map.js';
import { renderHeatmap } from './heatmap.js';
import { renderMarkers } from './markers.js';
import { renderMemorialMarkers, toggleMemorials as toggleMemLayer } from './memorials.js';
import { renderRpfAdvance, toggleRpfLayer } from './rpf.js';
import { showInfoCard, closeInfoCard, showTab } from './infocard.js';
import { setMode, currentMode } from './filters.js';
import { hideHistLayer, toggleHistLayer } from './hist.js';
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
  renderRpfAdvance(day, mode);
  renderMarkers(active, day, mode);
  renderMemorialMarkers(mode);
  renderProvLabels(day);
  renderEventList(active);

  // AI Synthesis Button
  const aiBtn = document.getElementById('aiBtn');
  if (aiBtn) {
    if (day >= 45) {
      aiBtn.disabled = false;
      aiBtn.innerHTML = "✨ ANALYZE '94 MATRIX (DAY " + day + ")";
      aiBtn.classList.add('ready');
    } else {
      aiBtn.disabled = true;
      aiBtn.innerHTML = "✨ ANALYZE '94 MATRIX (LOCKED)";
      aiBtn.classList.remove('ready');
    }
  }
}

// ── Initialization ────────────────────────────────────────
async function init() {
  const container = document.getElementById('mapWrap');

  await initMap(container);
  document.getElementById('ldg').style.display = 'none';

  buildProvinceBars();
  buildTimeline();
  bindTimelineEvents(day => update(day));
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

window.setMode = (mode) => {
  hideHistLayer();
  setMode(mode, () => update(currentDay));
};
window.togglePlay = () => togglePlay(day => update(day), () => currentDay);
window.setSpd = (s) => setSpeed(s, day => update(day), () => currentDay);
window.toggleMemorials = () => { toggleMemLayer(); update(currentDay); };
window.toggleRpf = () => { hideHistLayer(); toggleRpfLayer(); update(currentDay); };
window.toggleHist = () => {
  const on = toggleHistLayer();
  if (on) {
    closeInfoCard();
    document.querySelectorAll('.fbtn[data-m]').forEach(btn => btn.classList.remove('on', 'on-a', 'on-r', 'on-h'));
    document.querySelectorAll('[data-m="hist"]').forEach(b => b.classList.add('on-h'));
  } else {
    setMode(currentMode, () => update(currentDay));
  }
};
window.closeIC = () => closeInfoCard();
window.showTab = (t) => showTab(t);

window.analyzeMatrix = async () => {
  const day = currentDay;
  if (day < 45) return;
  const active = getActiveEvents(day);
  const cumul = Math.round(sigmoid(day));
  const rate = Math.round(sigmoidRate(day));

  const modal = document.getElementById('aiModal');
  modal.style.display = 'flex';
  document.getElementById('aiDay').textContent = day;
  const contentArea = document.getElementById('aiContent');
  contentArea.innerHTML = '<div class="ai-loading">Accessing Gemini Intelligence Layer...</div>';

  const report = await synthesizeMatrix(day, cumul, rate, active);
  contentArea.innerHTML = report.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
};

window.closeAI = () => {
  document.getElementById('aiModal').style.display = 'none';
};

window.togglePanel = () => {
  document.getElementById('sPan').classList.toggle('mob-open');
  document.getElementById('mobBackdrop').classList.toggle('vis');
};

// ── Boot ──────────────────────────────────────────────────
init();
