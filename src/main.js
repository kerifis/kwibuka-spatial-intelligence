/**
 * KWIBUKA // Spatial Intelligence Dashboard
 * Main entry point: initializes all modules and binds global state.
 */
import './styles.css';

import events from '../data/events.json';
import { synthesizeMatrix } from './gemini.js';
import { sigmoid, sigmoidRate, dayToDate, formatDate, TOTAL_DAYS } from './sigmoid.js';
import { initMap, projection, handleResize, renderProvLabels, setMapZoom, currentZoomTransform } from './map.js';
import { renderHeatmap } from './heatmap.js';
import { renderMarkers } from './markers.js';
import { renderMemorialMarkers, toggleMemorials as toggleMemLayer } from './memorials.js';
import { renderRpfAdvance, toggleRpfLayer } from './rpf.js';
import { showInfoCard, closeInfoCard, showTab, openTestimoniesModal, testimoniesPrev, testimoniesNext, renderMemoryKeepers, renderRwandaTech } from './infocard.js';
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

  // Initial UI state
  document.querySelector('.prov-layer')?.classList.add('hidden');
  setSpeed(0.5, day => update(day), () => currentDay);

  update(0);
  togglePlay(day => update(day), () => currentDay);

  const bgAudio = document.getElementById('bgAudio');
  if (bgAudio) {
    bgAudio.volume = 0.5;
  }

  // Coordinate display on mouse move — invert zoom transform before inverting projection
  container.addEventListener('mousemove', e => {
    const rect = container.getBoundingClientRect();
    const [svgX, svgY] = currentZoomTransform.invert([e.clientX - rect.left, e.clientY - rect.top]);
    const coords = projection.invert([svgX, svgY]);
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

  // Arrow key zoom
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMapZoom(Math.min(8, currentZoomTransform.k * 1.5));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMapZoom(Math.max(1, currentZoomTransform.k / 1.5));
    }
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
window.closeIC          = () => closeInfoCard();
const _hideSidePanels = () => {
  document.getElementById('mkPanel').style.display = 'none';
  document.getElementById('rtPanel').style.display = 'none';
};
window.openTestimonies = () => {
  openTestimoniesModal(1);
  document.querySelectorAll('.test-nav-btn').forEach(b => b.classList.remove('test-nav-on'));
  document.querySelector('.test-nav-btn[onclick*="home"]')?.classList.add('test-nav-on');
  document.getElementById('testContent').style.display = '';
  _hideSidePanels();
  document.querySelector('.test-pagination').style.display = '';
  window.updateModalAux?.();
};
window.openPodcast = () => {
  openTestimoniesModal(6);
  document.querySelectorAll('.test-nav-btn').forEach(b => b.classList.remove('test-nav-on'));
  document.querySelector('.test-nav-btn[onclick*="podcast"]')?.classList.add('test-nav-on');
  document.getElementById('testContent').style.display = '';
  _hideSidePanels();
  document.querySelector('.test-pagination').style.display = 'none';
  window.updateModalAux?.();
};
window.closeTestimonies = () => document.getElementById('testModal').classList.remove('vis');
window.testimoniesPrev  = () => testimoniesPrev();
window.testimoniesNext  = () => testimoniesNext();
window.setTestNav = (btn, tab) => {
  document.querySelectorAll('.test-nav-btn').forEach(b => b.classList.remove('test-nav-on'));
  btn.classList.add('test-nav-on');

  const content    = document.getElementById('testContent');
  const mkPanel    = document.getElementById('mkPanel');
  const rtPanel    = document.getElementById('rtPanel');
  const pagination = document.querySelector('.test-pagination');

  const hideSidePanels = () => {
    mkPanel.style.display = 'none';
    rtPanel.style.display = 'none';
  };

  if (tab === 'memkeepers') {
    content.style.display = 'none';
    hideSidePanels();
    mkPanel.style.display = 'flex';
    mkPanel.style.flexDirection = 'column';
    renderMemoryKeepers();
  } else if (tab === 'rwandatech') {
    content.style.display = 'none';
    hideSidePanels();
    rtPanel.style.display = 'flex';
    rtPanel.style.flexDirection = 'column';
    const frame = document.getElementById('rtMeetFrame');
    if (frame && !frame.src) frame.src = frame.dataset.src;
  } else if (tab === 'podcast') {
    content.style.display = '';
    hideSidePanels();
    pagination.style.display = 'none';
    openTestimoniesModal(6);
  } else {
    content.style.display = '';
    hideSidePanels();
    pagination.style.display = '';
    if (tab === 'home') openTestimoniesModal(1);
  }
};
window.filterMK = (btn, region) => {
  document.querySelectorAll('.mk-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.mk-card').forEach(card => {
    card.style.display = (region === 'all' || card.dataset.region === region) ? '' : 'none';
  });
};
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
  const mobile = window.innerWidth < 768;
  if (mobile) {
    document.getElementById('sPan').classList.toggle('mob-open');
    document.getElementById('mobBackdrop').classList.toggle('vis');
  } else {
    document.getElementById('sPan').classList.toggle('panel-closed');
  }
};

window.setZoom = v => setMapZoom(+v);
window.zoomIn  = () => setMapZoom(Math.min(8, currentZoomTransform.k * 1.5));
window.zoomOut = () => setMapZoom(Math.max(1, currentZoomTransform.k / 1.5));

window.castToTV = async () => {
  const btn = document.getElementById('castBtn');
  if ('PresentationRequest' in window) {
    const req = new PresentationRequest([window.location.href]);
    try {
      const conn = await req.start();
      btn.classList.add('on');
      btn.title = 'Connected to display';
      conn.addEventListener('terminate', () => {
        btn.classList.remove('on');
        btn.title = 'Cast to TV';
      });
      return;
    } catch (_) {}
  }
  // Fallback: show browser cast instructions
  const toast = document.getElementById('castToast');
  toast.classList.add('vis');
  setTimeout(() => toast.classList.remove('vis'), 5000);
};

window.toggleAudio = () => {
  const audio = document.getElementById('bgAudio');
  const btn = document.getElementById('audioBtn');
  if (audio.paused) {
    audio.play();
    btn.textContent = '‖ AUX';
    btn.classList.add('playing');
  } else {
    audio.pause();
    btn.textContent = '▶ AUX';
    btn.classList.remove('playing');
  }
};

window.updateModalAux = () => {
  const audio = document.getElementById('bgAudio');
  const btn = document.getElementById('modalAuxBtn');
  if (!btn) return;
  if (audio.paused) {
    btn.textContent = '▶ AUX';
    btn.classList.remove('playing');
  } else {
    btn.textContent = '‖ AUX';
    btn.classList.add('playing');
  }
};

window.setVolume = v => {
  document.getElementById('bgAudio').volume = +v;
};

window.toggleDeathCount = () => {
  const layer = document.querySelector('.prov-layer');
  const btn = document.getElementById('countBtn');
  if (!layer) return;
  const hidden = layer.classList.toggle('hidden');
  btn.classList.toggle('on', !hidden);
};

// Re-render trail when fade timer fires from rpf.js
document.addEventListener('rpf-fade-tick', () => update(currentDay));

// ── Boot ──────────────────────────────────────────────────
init();
