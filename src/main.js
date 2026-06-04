/**
 * KWIBUKA // Spatial Intelligence Dashboard
 * Main entry point: initializes all modules and binds global state.
 */
import './styles.css';

import events from '../data/events.json';
import histFamilies from '../data/histFamilies.json';
import { synthesizeMatrix } from './gemini.js';
import { sigmoid, sigmoidRate, dayToDate, formatDate, TOTAL_DAYS } from './sigmoid.js';
import { initMap, projection, handleResize, renderProvLabels, setMapZoom, syncMapZoomControl, currentZoomTransform, initDistricts, highlightDistrict, clearDistrictHighlight, zoomToPoint, focusDistrictAt } from './map.js';
import { renderHeatmap } from './heatmap.js';
import { renderMarkers } from './markers.js';
import { renderMemorialMarkers, toggleMemorials as toggleMemLayer } from './memorials.js';
import { renderRpfAdvance, toggleRpfLayer, hideRpfLayer } from './rpf.js';
import { showInfoCard, closeInfoCard, showTab, openTestimoniesModal, testimoniesPrev, testimoniesNext, renderMemoryKeepers, renderRwandaTech } from './infocard.js';
import { setMode, currentMode } from './filters.js';
import { initGoogleMap, showGoogleMap, hideGoogleMap, showGoogleMapError, updateGmMarkers, searchGmPlace, focusGmDistrict, toggleGmStreetView, isGmReady, setGmZoom, zoomGmIn, zoomGmOut } from './googlemap.js';
import { hideHistLayer, toggleHistLayer } from './hist.js';
import { buildTimeline, updateTimelinePosition, bindTimelineEvents, togglePlay, setSpeed, getPhase } from './timeline.js';
import { buildProvinceBars, updateStats, renderEventList } from './stats.js';

// ── Global State ──────────────────────────────────────────
let currentDay = 0;

// ── District Index Data (Rwanda's 30 districts) ───────────
const PROV_COLORS = {
  Kigali: '#ff2244', Eastern: '#ff4466', Northern: '#ff6644',
  Western: '#ff3355', Southern: '#ff2244',
};

const DISTRICTS = [
  // Kigali City
  { name: 'Gasabo',     province: 'Kigali',   lat: -1.890,  lng: 30.112 },
  { name: 'Kicukiro',   province: 'Kigali',   lat: -1.999,  lng: 30.068 },
  { name: 'Nyarugenge', province: 'Kigali',   lat: -1.951,  lng: 30.059 },
  // Eastern Province
  { name: 'Bugesera',   province: 'Eastern',  lat: -2.167,  lng: 30.167 },
  { name: 'Gatsibo',    province: 'Eastern',  lat: -1.683,  lng: 30.467 },
  { name: 'Kayonza',    province: 'Eastern',  lat: -1.917,  lng: 30.583 },
  { name: 'Kirehe',     province: 'Eastern',  lat: -2.350,  lng: 30.683 },
  { name: 'Ngoma',      province: 'Eastern',  lat: -2.150,  lng: 30.517 },
  { name: 'Nyagatare',  province: 'Eastern',  lat: -1.300,  lng: 30.325 },
  { name: 'Rwamagana',  province: 'Eastern',  lat: -1.950,  lng: 30.433 },
  // Northern Province
  { name: 'Burera',     province: 'Northern', lat: -1.467,  lng: 29.850 },
  { name: 'Gakenke',    province: 'Northern', lat: -1.683,  lng: 29.783 },
  { name: 'Gicumbi',    province: 'Northern', lat: -1.567,  lng: 30.100 },
  { name: 'Musanze',    province: 'Northern', lat: -1.500,  lng: 29.633 },
  { name: 'Rulindo',    province: 'Northern', lat: -1.717,  lng: 29.933 },
  // Southern Province
  { name: 'Gisagara',   province: 'Southern', lat: -2.617,  lng: 29.850 },
  { name: 'Huye',       province: 'Southern', lat: -2.583,  lng: 29.750 },
  { name: 'Kamonyi',    province: 'Southern', lat: -2.033,  lng: 29.867 },
  { name: 'Muhanga',    province: 'Southern', lat: -2.083,  lng: 29.750 },
  { name: 'Nyamagabe',  province: 'Southern', lat: -2.450,  lng: 29.483 },
  { name: 'Nyanza',     province: 'Southern', lat: -2.350,  lng: 29.750 },
  { name: 'Nyaruguru',  province: 'Southern', lat: -2.650,  lng: 29.533 },
  { name: 'Ruhango',    province: 'Southern', lat: -2.217,  lng: 29.783 },
  // Western Province
  { name: 'Karongi',    province: 'Western',  lat: -2.083,  lng: 29.333 },
  { name: 'Ngororero',  province: 'Western',  lat: -1.867,  lng: 29.550 },
  { name: 'Nyabihu',    province: 'Western',  lat: -1.650,  lng: 29.500 },
  { name: 'Nyamasheke', province: 'Western',  lat: -2.350,  lng: 29.150 },
  { name: 'Rubavu',     province: 'Western',  lat: -1.683,  lng: 29.333 },
  { name: 'Rutsiro',    province: 'Western',  lat: -1.967,  lng: 29.367 },
  { name: 'Rusizi',     province: 'Western',  lat: -2.483,  lng: 28.917 },
];

function buildHistFamilyTable() {
  const body = document.getElementById('histDistBody');
  if (!body) return;
  body.innerHTML = histFamilies.map(area =>
    `<button class="hist-family-row" data-hist-area="${area.id}" onclick="histFocusArea('${area.id}')">` +
    `<span class="hist-family-area">${area.label}</span>` +
    `<span class="hist-family-value">${area.families.toLocaleString()} families</span>` +
    `<span class="hist-family-districts">${area.districts}</span>` +
    `</button>`
  ).join('') +
    `<div class="hist-family-source">DOCUMENTED COHORTS // GAERG SURVEY REPORTING<br>` +
    `Grouped areas reflect source reporting, not inferred district estimates.</div>`;
}

function buildDistrictTable() {
  const body = document.getElementById('distPanelBody');
  if (!body) return;
  const byProv = {};
  DISTRICTS.forEach(d => { (byProv[d.province] = byProv[d.province] || []).push(d); });
  const order = ['Kigali', 'Eastern', 'Northern', 'Southern', 'Western'];
  body.innerHTML = order.map(prov => {
    const list = byProv[prov] || [];
    const color = PROV_COLORS[prov];
    const rows = list.map(d =>
      `<div class="dist-row" data-district="${d.name}" onclick="focusDistrict('${d.name}')">` +
      `<span class="dist-dot" style="background:${color}"></span>` +
      `<span class="dist-name">${d.name}</span>` +
      `</div>`
    ).join('');
    return `<div class="dist-prov-section">` +
      `<div class="dist-prov-hdr" style="color:${color}">` +
      `${prov.toUpperCase()} <span class="dist-prov-count">${list.length}</span></div>` +
      rows +
      `</div>`;
  }).join('');
}

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

  // Google Maps satellite markers (CRT mode)
  if (mode === 'crt' && isGmReady()) updateGmMarkers(active, day);

}

// ── Initialization ────────────────────────────────────────
async function init() {
  const container = document.getElementById('mapWrap');

  await initMap(container);
  document.getElementById('ldg').style.display = 'none';

  buildProvinceBars();
  buildTimeline();
  buildDistrictTable();
  buildHistFamilyTable();
  initDistricts(); // async, loads ADM2 polygons in background
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
    if (currentMode === 'crt') return;
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
      if (currentMode === 'crt' && isGmReady()) zoomGmIn();
      else setMapZoom(Math.min(1.5, currentZoomTransform.k * 1.2));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentMode === 'crt' && isGmReady()) zoomGmOut();
      else setMapZoom(Math.max(1, currentZoomTransform.k / 1.5));
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
  if (mode === 'crt') hideRpfLayer();
  setMode(mode, () => update(currentDay));
  const visitBtn = document.getElementById('visitKigaliBtn');
  visitBtn?.classList.toggle('active', mode === 'crt');
  visitBtn?.setAttribute('aria-pressed', mode === 'crt' ? 'true' : 'false');
  if (mode === 'crt') {
    initGoogleMap()
      .then(() => {
        showGoogleMap();
        updateGmMarkers(getActiveEvents(currentDay), currentDay);
      })
      .catch(e => {
        console.warn('Google Maps init failed', e);
        showGoogleMapError(e);
      });
  } else {
    hideGoogleMap();
    syncMapZoomControl();
  }
};
window.togglePlay = () => togglePlay(day => update(day), () => currentDay);
window.setSpd = (s) => setSpeed(s, day => update(day), () => currentDay);
window.toggleStreetView = () => toggleGmStreetView();
window.searchKigaliPlace = () => searchGmPlace(document.getElementById('gVisitInput')?.value);
window.openVisitKigali = () => {
  if (currentMode === 'crt') {
    window.setMode('std');
    document.getElementById('visitKigaliBtn')?.blur();
    return;
  }

  window.setMode('crt');
  let attempts = 0;
  const focusSearch = () => {
    const input = document.getElementById('gVisitInput');
    if (input && document.getElementById('gVisitShell')?.style.display === 'flex') {
      input.focus();
      return;
    }
    attempts += 1;
    if (attempts < 20) window.setTimeout(focusSearch, 150);
  };
  focusSearch();
};
window.toggleMemorials = () => { toggleMemLayer(); update(currentDay); };
window.toggleRpf = () => { hideHistLayer(); toggleRpfLayer(); update(currentDay); };
window.toggleHist = () => {
  const on = toggleHistLayer();
  if (on) {
    hideRpfLayer();
    closeInfoCard();
    document.querySelectorAll('.fbtn[data-m]').forEach(btn => btn.classList.remove('on', 'on-a', 'on-r', 'on-h'));
    document.querySelectorAll('[data-m="hist"]').forEach(b => b.classList.add('on-h'));
  } else {
    // Clear HIST highlights when exiting HIST mode
    clearDistrictHighlight();
    document.querySelectorAll('.hist-family-row').forEach(r => r.classList.remove('active'));
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

window.setZoom = v => {
  if (currentMode === 'crt' && isGmReady()) setGmZoom(+v);
  else setMapZoom(+v);
};
window.zoomIn = () => {
  if (currentMode === 'crt' && isGmReady()) zoomGmIn();
  else setMapZoom(Math.min(1.5, currentZoomTransform.k * 1.2));
};
window.zoomOut = () => {
  if (currentMode === 'crt' && isGmReady()) zoomGmOut();
  else setMapZoom(Math.max(1, currentZoomTransform.k / 1.5));
};

window.toggleDistrictPanel = () => {
  const panel = document.getElementById('distPanel');
  const btn   = document.getElementById('distBtn');
  const open  = panel.classList.toggle('open');
  btn.classList.toggle('on', open);
};

window.focusDistrict = (name) => {
  document.querySelectorAll('.dist-row').forEach(r => r.classList.remove('active'));
  document.querySelector(`.dist-row[data-district="${name}"]`)?.classList.add('active');
  const d = DISTRICTS.find(x => x.name === name);
  if (!d) return;
  if (currentMode === 'crt') {
    focusGmDistrict(d.name, d.lat, d.lng);
  } else {
    focusDistrictAt(name, d.lng, d.lat);
  }
};

window.clearDistHighlight = () => {
  clearDistrictHighlight();
  document.querySelectorAll('.dist-row').forEach(r => r.classList.remove('active'));
};

window.histFocusArea = (id) => {
  document.querySelectorAll('.hist-family-row').forEach(r => r.classList.remove('active'));
  document.querySelector(`.hist-family-row[data-hist-area="${id}"]`)?.classList.add('active');
  const area = histFamilies.find(x => x.id === id);
  if (area) focusDistrictAt(area.label, area.lng, area.lat, false);
};

window.histClearHighlight = () => {
  clearDistrictHighlight();
  document.querySelectorAll('.hist-family-row').forEach(r => r.classList.remove('active'));
};

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
