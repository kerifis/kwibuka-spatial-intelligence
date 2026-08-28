/**
 * KWIBUKA // Spatial Intelligence Dashboard
 * Main entry point: initializes all modules and binds global state.
 */
import './styles.css';

import events from '../data/events.json';
import histFamilies from '../data/histFamilies.json';
import { synthesizeMatrix } from './gemini.js';
import { sigmoid, sigmoidRate, dayToDate, formatDate, TOTAL_DAYS } from './sigmoid.js';
import {
  initMap, projection, handleResize, renderProvLabels, setMapZoom,
  syncMapZoomControl, currentZoomTransform, initDistricts, highlightDistrict,
  clearDistrictHighlight, zoomToPoint, focusDistrictAt, highlightProvince,
  clearProvinceHighlight, setZoomTransform, activeProvince
} from './map.js';
import { renderHeatmap } from './heatmap.js';
import { renderMarkers } from './markers.js';
import { renderMemorialMarkers, toggleMemorials as toggleMemLayer, showMemorials } from './memorials.js';
import { renderRpfAdvance, toggleRpfLayer, hideRpfLayer, showRpfLayer } from './rpf.js';
import {
  showInfoCard, closeInfoCard, showTab, openTestimoniesModal,
  testimoniesPrev, testimoniesNext, renderMemoryKeepers, renderRwandaTech
} from './infocard.js';
import { setMode, currentMode } from './filters.js';
import {
  initGoogleMap, showGoogleMap, hideGoogleMap, showGoogleMapError,
  updateGmMarkers, searchGmPlace, focusGmDistrict, toggleGmStreetView,
  isGmReady, setGmZoom, zoomGmIn, zoomGmOut, getGmState, applyGmState
} from './googlemap.js';
import { hideHistLayer, toggleHistLayer, histVisible } from './hist.js';
import {
  openMuseum, closeMuseum, rotateMuseum, resetMuseum,
  zoomMuseumTimeline, resetMuseumTimeline, playMuseumTestimony
} from './museum.js';
import {
  buildTimeline, updateTimelinePosition, bindTimelineEvents,
  togglePlay, setSpeed, getPhase, isPlaying, getSpeed, setPlayingState
} from './timeline.js';
import { buildProvinceBars, updateStats, renderEventList } from './stats.js';
import { createKwibukActionRunner } from './voice/kwibukActions.js';
import { initKwibukVoice } from './voice/kwibukVoice.js';
import {
  initCastSync, broadcastChange, broadcastFullState,
  castToTV, checkIsReceiver
} from './castSync.js';

// ── Global State ──────────────────────────────────────────
let currentDay = 0;
let currentFocusedDistrict = null;
let currentFocusedHistArea = null;
let currentOpenEventId = null;
let currentOpenInfoTab = 'overview';
let currentTestNavTab = 'home';
let currentTestPage = 1;
let currentAiDay = null;

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
function update(day, broadcast = false) {
  currentDay = day;
  const dt = dayToDate(day);
  const phase = getPhase(day);
  const active = getActiveEvents(day);
  const cumul = Math.round(sigmoid(day));
  const rate = Math.round(sigmoidRate(day));
  const mode = currentMode;

  // Header
  const hDate = document.getElementById('hDate');
  const hPhase = document.getElementById('hPhase');
  const hDay = document.getElementById('hDay');
  if (hDate) hDate.textContent = formatDate(dt);
  if (hPhase) hPhase.textContent = phase.n.toUpperCase();
  if (hDay) hDay.textContent = `DAY ${Math.max(0, day)} / 100`;

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

  if (broadcast) {
    broadcastChange('day', day);
  }
}

// ── Application State Representation ──────────────────────
function getAppState() {
  const audio = document.getElementById('bgAudio');
  const icard = document.getElementById('icard');
  const testModal = document.getElementById('testModal');
  const aiModal = document.getElementById('aiModal');
  const distPanel = document.getElementById('distPanel');
  const countLayer = document.querySelector('.prov-layer');

  return {
    day: currentDay,
    playing: isPlaying(),
    speed: getSpeed(),
    mode: currentMode,
    memorials: showMemorials,
    rpf: showRpfLayer,
    hist: histVisible,
    deathCount: countLayer ? !countLayer.classList.contains('hidden') : true,
    province: activeProvince,
    district: currentFocusedDistrict,
    histArea: currentFocusedHistArea,
    zoom: { k: currentZoomTransform.k, x: currentZoomTransform.x, y: currentZoomTransform.y },
    infoCard: {
      vis: icard?.classList.contains('vis') || false,
      eventId: currentOpenEventId,
      tab: currentOpenInfoTab || 'overview',
    },
    modals: {
      testimonies: testModal?.classList.contains('vis') || false,
      testTab: currentTestNavTab || 'home',
      testPage: currentTestPage || 1,
      ai: aiModal?.style.display === 'flex',
      aiDay: currentAiDay || currentDay,
      museum: document.body.classList.contains('museum-open'),
      districtPanel: distPanel?.classList.contains('open') || false,
      visitKigali: currentMode === 'crt',
    },
    audio: {
      playing: audio ? !audio.paused : false,
      volume: audio ? audio.volume : 0.5,
    },
    gmState: (currentMode === 'crt') ? getGmState() : null,
    situationPanel: (() => {
      const p = document.getElementById('sPan');
      if (!p) return false;
      // On mobile, panel is open when it has mob-open; on desktop, open when NOT panel-closed
      return window.innerWidth < 768
        ? p.classList.contains('mob-open')
        : !p.classList.contains('panel-closed');
    })(),
    timestamp: Date.now(),
  };
}

// ── Remote State Applier (for Receiver/TV) ──────────────────
function applyAppState(data, { isFull } = {}) {
  if (isFull) {
    const s = data;
    if (typeof s.day === 'number') update(s.day);
    if (typeof s.playing === 'boolean') {
      setPlayingState(s.playing, day => update(day, true), () => currentDay);
    }
    if (typeof s.speed === 'number') {
      setSpeed(s.speed, day => update(day, true), () => currentDay);
    }
    if (s.mode && s.mode !== currentMode) {
      window.setMode(s.mode, { silent: true });
    }
    if (typeof s.memorials === 'boolean' && s.memorials !== showMemorials) {
      window.toggleMemorials({ silent: true });
    }
    if (typeof s.rpf === 'boolean' && s.rpf !== showRpfLayer) {
      window.toggleRpf({ silent: true });
    }
    if (typeof s.hist === 'boolean' && s.hist !== histVisible) {
      window.toggleHist({ silent: true });
    }
    if (typeof s.deathCount === 'boolean') {
      const layer = document.querySelector('.prov-layer');
      const btn = document.getElementById('countBtn');
      if (layer) {
        layer.classList.toggle('hidden', !s.deathCount);
        btn?.classList.toggle('on', s.deathCount);
      }
    }
    if (s.province) highlightProvince(s.province);
    else clearProvinceHighlight();

    if (s.district) window.focusDistrict(s.district.name, { silent: true });
    else window.clearDistHighlight({ silent: true });

    if (s.histArea) window.histFocusArea(s.histArea, { silent: true });
    else window.histClearHighlight({ silent: true });

    if (s.zoom) setZoomTransform(s.zoom);

    // Sync Google Maps state (CRT/Visit Kigali mode)
    if (s.gmState) {
      applyGmState(s.gmState);
    }

    // Sync Situation Overview panel open/closed
    if (typeof s.situationPanel === 'boolean') {
      const panel = document.getElementById('sPan');
      const backdrop = document.getElementById('mobBackdrop');
      if (panel) {
        if (window.innerWidth < 768) {
          panel.classList.toggle('mob-open', s.situationPanel);
          backdrop?.classList.toggle('vis', s.situationPanel);
        } else {
          panel.classList.toggle('panel-closed', !s.situationPanel);
        }
      }
    }

    if (s.infoCard?.vis && s.infoCard.eventId) {
      window.__showEventById(s.infoCard.eventId, { silent: true });
      if (s.infoCard.tab) window.showTab(s.infoCard.tab, { silent: true });
    } else {
      window.closeIC({ silent: true });
    }

    if (s.modals?.testimonies) {
      if (s.modals.testTab === 'podcast') window.openPodcast({ silent: true });
      else window.openTestimonies({ silent: true });
      if (s.modals.testPage) openTestimoniesModal(s.modals.testPage);
    } else {
      window.closeTestimonies({ silent: true });
    }

    if (s.modals?.museum) window.openMuseum(undefined, { silent: true });
    else if (document.body.classList.contains('museum-open')) window.closeMuseum({ silent: true });

    if (s.modals?.ai) window.analyzeMatrix({ silent: true });
    else window.closeAI({ silent: true });

    if (typeof s.modals?.districtPanel === 'boolean') {
      const panel = document.getElementById('distPanel');
      const btn = document.getElementById('distBtn');
      panel?.classList.toggle('open', s.modals.districtPanel);
      btn?.classList.toggle('on', s.modals.districtPanel);
    }
  } else {
    // Incremental change
    const { key, value } = data;
    switch (key) {
      case 'day':
        update(value);
        break;
      case 'play':
        setPlayingState(value, day => update(day, true), () => currentDay);
        break;
      case 'speed':
        setSpeed(value, day => update(day, true), () => currentDay);
        break;
      case 'mode':
        window.setMode(value, { silent: true });
        break;
      case 'province':
        if (value) highlightProvince(value);
        else clearProvinceHighlight();
        break;
      case 'district':
        if (value) window.focusDistrict(value.name, { silent: true });
        else window.clearDistHighlight({ silent: true });
        break;
      case 'histArea':
        if (value) window.histFocusArea(value, { silent: true });
        else window.histClearHighlight({ silent: true });
        break;
      case 'memorials':
        if (value !== showMemorials) window.toggleMemorials({ silent: true });
        break;
      case 'rpf':
        if (value !== showRpfLayer) window.toggleRpf({ silent: true });
        break;
      case 'hist':
        if (value !== histVisible) window.toggleHist({ silent: true });
        break;
      case 'deathCount': {
        const layer = document.querySelector('.prov-layer');
        const btn = document.getElementById('countBtn');
        if (layer) {
          layer.classList.toggle('hidden', !value);
          btn?.classList.toggle('on', value);
        }
        break;
      }
      case 'zoom':
        setZoomTransform(value);
        break;
      case 'gmState':
        applyGmState(value);
        break;
      case 'situationPanel': {
        const panel = document.getElementById('sPan');
        const backdrop = document.getElementById('mobBackdrop');
        if (panel) {
          if (window.innerWidth < 768) {
            panel.classList.toggle('mob-open', value);
            backdrop?.classList.toggle('vis', value);
          } else {
            panel.classList.toggle('panel-closed', !value);
          }
        }
        break;
      }
      case 'infoCard':
        if (value.vis && value.id) {
          window.__showEventById(value.id, { silent: true });
          if (value.tab) window.showTab(value.tab, { silent: true });
        } else {
          window.closeIC({ silent: true });
        }
        break;
      case 'infoTab':
        window.showTab(value, { silent: true });
        break;
      case 'testimonies':
        if (value.open) {
          if (value.tab === 'podcast') window.openPodcast({ silent: true });
          else window.openTestimonies({ silent: true });
          if (value.page) openTestimoniesModal(value.page);
        } else {
          window.closeTestimonies({ silent: true });
        }
        break;
      case 'museum':
        if (value.open) window.openMuseum(value.room, { silent: true });
        else window.closeMuseum({ silent: true });
        break;
      case 'ai':
        if (value.open) window.analyzeMatrix({ silent: true });
        else window.closeAI({ silent: true });
        break;
      case 'districtPanel': {
        const panel = document.getElementById('distPanel');
        const btn = document.getElementById('distBtn');
        panel?.classList.toggle('open', value);
        btn?.classList.toggle('on', value);
        break;
      }
      case 'audio': {
        const audio = document.getElementById('bgAudio');
        if (audio) {
          if (value.playing) audio.play().catch(() => {});
          else audio.pause();
          if (typeof value.volume === 'number') audio.volume = value.volume;
        }
        break;
      }
    }
  }
}

// ── Initialization ────────────────────────────────────────
async function init() {
  const container = document.getElementById('mapWrap');

  await initMap(container);
  const ldg = document.getElementById('ldg');
  if (ldg) ldg.style.display = 'none';

  buildProvinceBars();
  buildTimeline();
  buildDistrictTable();
  buildHistFamilyTable();
  initDistricts(); // async, loads ADM2 polygons in background

  // Timeline scrubber drag / touch binding
  bindTimelineEvents(day => update(day, true));

  // Initial UI state
  document.querySelector('.prov-layer')?.classList.add('hidden');
  setSpeed(0.5, day => update(day, true), () => currentDay);

  const isDisplayReceiver = checkIsReceiver();

  update(0);
  if (!isDisplayReceiver) {
    togglePlay(day => update(day, true), () => currentDay);
  }

  const bgAudio = document.getElementById('bgAudio');
  if (bgAudio) {
    bgAudio.volume = 0.5;
  }

  // Coordinate display on mouse move
  container.addEventListener('mousemove', e => {
    if (currentMode === 'crt') return;
    const rect = container.getBoundingClientRect();
    const [svgX, svgY] = currentZoomTransform.invert([e.clientX - rect.left, e.clientY - rect.top]);
    const coords = projection.invert([svgX, svgY]);
    if (coords) {
      const coordD = document.getElementById('coordD');
      if (coordD) {
        coordD.textContent =
          `${Math.abs(coords[1]).toFixed(4)} ${coords[1] < 0 ? 'S' : 'N'}, ` +
          `${Math.abs(coords[0]).toFixed(4)} ${coords[0] < 0 ? 'W' : 'E'}`;
      }
    }
  });

  // Resize handler
  window.addEventListener('resize', () => {
    handleResize(container);
    update(currentDay);
  });

  // Manual zoom hook for broadcast
  window.__onManualZoomPan = (transform) => {
    broadcastChange('zoom', transform);
  };

  // Google Maps state change hook for broadcast (zoom, pan, street view, search)
  window.__onGmChange = (key, value) => {
    broadcastChange(key, value);
  };

  // Arrow key zoom
  window.addEventListener('keydown', e => {
    if (document.body.classList.contains('museum-open')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentMode === 'crt' && isGmReady()) zoomGmIn();
      else {
        const k = Math.min(1.5, currentZoomTransform.k * 1.2);
        setMapZoom(k);
        broadcastChange('zoom', { k, x: currentZoomTransform.x, y: currentZoomTransform.y });
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentMode === 'crt' && isGmReady()) zoomGmOut();
      else {
        const k = Math.max(1, currentZoomTransform.k / 1.5);
        setMapZoom(k);
        broadcastChange('zoom', { k, x: currentZoomTransform.x, y: currentZoomTransform.y });
      }
    }
  });

  // ── Voice Control Initialization ─────────────────────────
  const duckAudio = (ducked) => {
    const audio = document.getElementById('bgAudio');
    if (!audio) return;
    if (ducked) {
      if (!audio.paused) {
        audio._wasPlayingBeforeVoice = true;
        audio.volume = Math.min(audio.volume, 0.08);
      }
    } else {
      if (audio._wasPlayingBeforeVoice) {
        audio._wasPlayingBeforeVoice = false;
        const slider = document.getElementById('volSlider');
        audio.volume = slider ? Number(slider.value) : 0.5;
      }
    }
  };

  const actionRunner = createKwibukActionRunner({
    getDay: () => currentDay,
    setDay: (day) => update(day, true),
    togglePlay: () => window.togglePlay(),
    setSpeed: (spd) => window.setSpd(spd),
    getPhase: (day) => getPhase(day),
    sigmoid: (day) => sigmoid(day),
    sigmoidRate: (day) => sigmoidRate(day),
    getActiveEvents: (day) => getActiveEvents(day),
    setMode: (mode) => window.setMode(mode),
    getMode: () => currentMode,
    focusDistrict: (name) => window.focusDistrict(name),
    clearDistHighlight: () => window.clearDistHighlight(),
    toggleMemorials: () => window.toggleMemorials(),
    getMemorialsVisible: () => showMemorials,
    toggleRpf: () => window.toggleRpf(),
    getRpfVisible: () => showRpfLayer,
    toggleHist: () => window.toggleHist(),
    getHistVisible: () => histVisible,
    toggleDeathCount: () => window.toggleDeathCount(),
    openTestimonies: () => window.openTestimonies(),
    openPodcast: () => window.openPodcast(),
    closeTestimonies: () => window.closeTestimonies(),
    testimoniesNext: () => window.testimoniesNext(),
    testimoniesPrev: () => window.testimoniesPrev(),
    setTestNav: (tab) => {
      const btn = document.querySelector(`.test-nav-btn[onclick*="${tab}"]`) || document.querySelector('.test-nav-btn');
      if (btn) window.setTestNav(btn, tab);
    },
    showTab: (t) => window.showTab(t),
    closeIC: () => window.closeIC(),
    showEventById: (id) => window.__showEventById(id),
    analyzeMatrix: () => window.analyzeMatrix(),
    closeAI: () => window.closeAI(),
    openMuseum: (r) => window.openMuseum(r),
    closeMuseum: () => window.closeMuseum(),
    museumRotate: (d) => window.museumRotate(d),
    museumReset: () => window.museumReset(),
    toggleDistrictPanel: () => window.toggleDistrictPanel(),
    openVisitKigali: () => window.openVisitKigali(),
    searchPlace: (q) => searchGmPlace(q),
    toggleStreetView: () => window.toggleStreetView(),
    zoomIn: () => window.zoomIn(),
    zoomOut: () => window.zoomOut(),
    setZoom: (v) => window.setZoom(v),
    togglePanel: () => window.togglePanel(),
    toggleAudio: () => window.toggleAudio(),
    setVolume: (v) => window.setVolume(v),
    castToTV: () => window.castToTV(),
    districts: DISTRICTS,
  });

  initKwibukVoice({ runner: actionRunner, duckAudio });

  // ── Cast & Presentation Synchronization ──────────────────
  await initCastSync({
    getState: getAppState,
    applyState: applyAppState,
    showToast: (msg) => {
      const toast = document.getElementById('castToast');
      if (toast) {
        toast.innerHTML = `<span>⊡</span> ${msg}`;
        toast.classList.add('vis');
        setTimeout(() => toast.classList.remove('vis'), 4000);
      }
    }
  });
}

// ── Global Event Handlers (bound to window for HTML onclick) ──
window.__showEventById = (id, opts = {}) => {
  currentOpenEventId = id;
  const ev = events.find(e => e.id === id);
  if (!ev) return;
  const p = projection([ev.lng, ev.lat]);
  if (p) showInfoCard(ev, p);
  if (!opts.silent) {
    broadcastChange('infoCard', { vis: true, id, tab: currentOpenInfoTab });
  }
};

window.selectProvince = (name, e, opts = {}) => {
  if (activeProvince === name) {
    clearProvinceHighlight();
    if (!opts.silent) broadcastChange('province', null);
    return;
  }
  highlightProvince(name);
  if (!opts.silent) broadcastChange('province', name);

  const count = document.querySelector(`[data-prov="${name}"] .pov-count`)?.textContent || '0';
  const ttip = document.getElementById('ttip');
  if (ttip) {
    ttip.innerHTML = `<div style="padding:4px"><div style="font-size:11px;font-weight:600;color:var(--amb)">${name.toUpperCase()} PROVINCE</div><div style="margin-top:4px;color:var(--tx0)"><span style="color:var(--red)">${count}</span> LIVES LOST</div></div>`;
    if (e && e.clientX) {
      ttip.style.left = (e.clientX + 15) + 'px';
      ttip.style.top = (e.clientY + 15) + 'px';
    }
    ttip.style.opacity = '1';
    ttip.classList.add('vis');
    setTimeout(() => {
      ttip.style.opacity = '0';
      ttip.classList.remove('vis');
    }, 3500);
  }
};

window.setMode = (mode, opts = {}) => {
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
  if (!opts.silent) {
    broadcastChange('mode', mode);
  }
};

window.togglePlay = (opts = {}) => {
  togglePlay(day => update(day, true), () => currentDay);
  if (!opts.silent) {
    broadcastChange('play', isPlaying());
  }
};

window.setSpd = (s, opts = {}) => {
  setSpeed(s, day => update(day, true), () => currentDay);
  if (!opts.silent) {
    broadcastChange('speed', s);
  }
};

window.openMuseum = (room, opts = {}) => {
  openMuseum(room);
  if (!opts.silent) {
    broadcastChange('museum', { open: true, room });
  }
};

// Deep link from the /museum landing page: /?museum=1 or /?museum=<room>
(() => {
  const room = new URLSearchParams(location.search).get('museum');
  if (room) window.addEventListener('load', () => openMuseum(room === '1' ? undefined : room));
})();

window.closeMuseum = (opts = {}) => {
  closeMuseum();
  if (!opts.silent) {
    broadcastChange('museum', { open: false });
  }
};

window.museumRotate = (delta) => rotateMuseum(delta);
window.museumReset = () => resetMuseum();
window.museumTimelineZoom = (factor) => zoomMuseumTimeline(factor);
window.museumTimelineReset = () => resetMuseumTimeline();
window.museumPlayTestimony = (videoId) => playMuseumTestimony(videoId);
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

window.toggleMemorials = (opts = {}) => {
  toggleMemLayer();
  update(currentDay);
  if (!opts.silent) {
    broadcastChange('memorials', showMemorials);
  }
};

window.toggleRpf = (opts = {}) => {
  hideHistLayer();
  toggleRpfLayer();
  update(currentDay);
  if (!opts.silent) {
    broadcastChange('rpf', showRpfLayer);
  }
};

window.toggleHist = (opts = {}) => {
  const on = toggleHistLayer();
  if (on) {
    hideRpfLayer();
    closeInfoCard();
    document.querySelectorAll('.fbtn[data-m]').forEach(btn => btn.classList.remove('on', 'on-a', 'on-r', 'on-h'));
    document.querySelectorAll('[data-m="hist"]').forEach(b => b.classList.add('on-h'));
  } else {
    clearDistrictHighlight();
    document.querySelectorAll('.hist-family-row').forEach(r => r.classList.remove('active'));
    setMode(currentMode, () => update(currentDay));
  }
  if (!opts.silent) {
    broadcastChange('hist', on);
  }
};

window.closeIC = (opts = {}) => {
  currentOpenEventId = null;
  closeInfoCard();
  if (!opts.silent) {
    broadcastChange('infoCard', { vis: false });
  }
};

const _hideSidePanels = () => {
  const mk = document.getElementById('mkPanel');
  const rt = document.getElementById('rtPanel');
  if (mk) mk.style.display = 'none';
  if (rt) rt.style.display = 'none';
};

window.openTestimonies = (opts = {}) => {
  currentTestNavTab = 'home';
  currentTestPage = 1;
  openTestimoniesModal(1);
  document.querySelectorAll('.test-nav-btn').forEach(b => b.classList.remove('test-nav-on'));
  document.querySelector('.test-nav-btn[onclick*="home"]')?.classList.add('test-nav-on');
  const testContent = document.getElementById('testContent');
  if (testContent) testContent.style.display = '';
  _hideSidePanels();
  const pagination = document.querySelector('.test-pagination');
  if (pagination) pagination.style.display = '';
  window.updateModalAux?.();
  if (!opts.silent) {
    broadcastChange('testimonies', { open: true, tab: 'home', page: 1 });
  }
};

window.openPodcast = (opts = {}) => {
  currentTestNavTab = 'podcast';
  currentTestPage = 6;
  openTestimoniesModal(6);
  document.querySelectorAll('.test-nav-btn').forEach(b => b.classList.remove('test-nav-on'));
  document.querySelector('.test-nav-btn[onclick*="podcast"]')?.classList.add('test-nav-on');
  const testContent = document.getElementById('testContent');
  if (testContent) testContent.style.display = '';
  _hideSidePanels();
  const pagination = document.querySelector('.test-pagination');
  if (pagination) pagination.style.display = 'none';
  window.updateModalAux?.();
  if (!opts.silent) {
    broadcastChange('testimonies', { open: true, tab: 'podcast', page: 6 });
  }
};

window.closeTestimonies = (opts = {}) => {
  document.getElementById('testModal')?.classList.remove('vis');
  if (!opts.silent) {
    broadcastChange('testimonies', { open: false });
  }
};

window.testimoniesPrev = () => {
  testimoniesPrev();
  broadcastChange('testimonies', { open: true, tab: currentTestNavTab, page: currentTestPage - 1 });
};

window.testimoniesNext = () => {
  testimoniesNext();
  broadcastChange('testimonies', { open: true, tab: currentTestNavTab, page: currentTestPage + 1 });
};

window.setTestNav = (btn, tab) => {
  currentTestNavTab = tab;
  document.querySelectorAll('.test-nav-btn').forEach(b => b.classList.remove('test-nav-on'));
  btn.classList.add('test-nav-on');

  const content    = document.getElementById('testContent');
  const mkPanel    = document.getElementById('mkPanel');
  const rtPanel    = document.getElementById('rtPanel');
  const pagination = document.querySelector('.test-pagination');

  const hideSidePanels = () => {
    if (mkPanel) mkPanel.style.display = 'none';
    if (rtPanel) rtPanel.style.display = 'none';
  };

  if (tab === 'memkeepers') {
    if (content) content.style.display = 'none';
    hideSidePanels();
    if (mkPanel) {
      mkPanel.style.display = 'flex';
      mkPanel.style.flexDirection = 'column';
    }
    renderMemoryKeepers();
  } else if (tab === 'rwandatech') {
    if (content) content.style.display = 'none';
    hideSidePanels();
    if (rtPanel) {
      rtPanel.style.display = 'flex';
      rtPanel.style.flexDirection = 'column';
    }
    const frame = document.getElementById('rtMeetFrame');
    if (frame && !frame.src) frame.src = frame.dataset.src;
  } else if (tab === 'podcast') {
    if (content) content.style.display = '';
    hideSidePanels();
    if (pagination) pagination.style.display = 'none';
    openTestimoniesModal(6);
  } else {
    if (content) content.style.display = '';
    hideSidePanels();
    if (pagination) pagination.style.display = '';
    if (tab === 'home') openTestimoniesModal(1);
  }

  broadcastChange('testimonies', { open: true, tab, page: currentTestPage });
};

window.filterMK = (btn, region) => {
  document.querySelectorAll('.mk-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.mk-card').forEach(card => {
    card.style.display = (region === 'all' || card.dataset.region === region) ? '' : 'none';
  });
};

window.showTab = (t, opts = {}) => {
  currentOpenInfoTab = t;
  showTab(t);
  if (!opts.silent) {
    broadcastChange('infoTab', t);
  }
};

window.analyzeMatrix = async (opts = {}) => {
  const day = currentDay;
  currentAiDay = day;
  if (day < 45) return;
  const active = getActiveEvents(day);
  const cumul = Math.round(sigmoid(day));
  const rate = Math.round(sigmoidRate(day));

  const modal = document.getElementById('aiModal');
  if (modal) modal.style.display = 'flex';
  const aiDay = document.getElementById('aiDay');
  if (aiDay) aiDay.textContent = day;
  const contentArea = document.getElementById('aiContent');
  if (contentArea) {
    contentArea.innerHTML = '<div class="ai-loading">Accessing Gemini Intelligence Layer...</div>';
  }

  if (!opts.silent) {
    broadcastChange('ai', { open: true, day });
  }

  const report = await synthesizeMatrix(day, cumul, rate, active);
  if (contentArea) {
    contentArea.innerHTML = report.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
  }
};

window.closeAI = (opts = {}) => {
  const modal = document.getElementById('aiModal');
  if (modal) modal.style.display = 'none';
  if (!opts.silent) {
    broadcastChange('ai', { open: false });
  }
};

window.togglePanel = (opts = {}) => {
  const mobile = window.innerWidth < 768;
  let isOpen;
  if (mobile) {
    const panel = document.getElementById('sPan');
    const backdrop = document.getElementById('mobBackdrop');
    panel?.classList.toggle('mob-open');
    backdrop?.classList.toggle('vis');
    isOpen = panel?.classList.contains('mob-open') ?? false;
  } else {
    const panel = document.getElementById('sPan');
    panel?.classList.toggle('panel-closed');
    isOpen = panel ? !panel.classList.contains('panel-closed') : true;
  }
  if (!opts.silent) {
    broadcastChange('situationPanel', isOpen);
  }
};

window.setZoom = (v, opts = {}) => {
  if (currentMode === 'crt' && isGmReady()) setGmZoom(+v);
  else setMapZoom(+v);
  if (!opts.silent) {
    broadcastChange('zoom', { k: +v, x: currentZoomTransform.x, y: currentZoomTransform.y });
  }
};

window.zoomIn = (opts = {}) => {
  if (currentMode === 'crt' && isGmReady()) zoomGmIn();
  else {
    const k = Math.min(1.5, currentZoomTransform.k * 1.2);
    setMapZoom(k);
    if (!opts.silent) broadcastChange('zoom', { k, x: currentZoomTransform.x, y: currentZoomTransform.y });
  }
};

window.zoomOut = (opts = {}) => {
  if (currentMode === 'crt' && isGmReady()) zoomGmOut();
  else {
    const k = Math.max(1, currentZoomTransform.k / 1.5);
    setMapZoom(k);
    if (!opts.silent) broadcastChange('zoom', { k, x: currentZoomTransform.x, y: currentZoomTransform.y });
  }
};

window.toggleDistrictPanel = (opts = {}) => {
  const panel = document.getElementById('distPanel');
  const btn   = document.getElementById('distBtn');
  const open  = panel?.classList.toggle('open');
  btn?.classList.toggle('on', open);
  if (!opts.silent) {
    broadcastChange('districtPanel', open);
  }
};

window.focusDistrict = (name, opts = {}) => {
  document.querySelectorAll('.dist-row').forEach(r => r.classList.remove('active'));
  document.querySelector(`.dist-row[data-district="${name}"]`)?.classList.add('active');
  const d = DISTRICTS.find(x => x.name === name);
  if (!d) return;
  currentFocusedDistrict = d;
  if (currentMode === 'crt') {
    focusGmDistrict(d.name, d.lat, d.lng);
  } else {
    focusDistrictAt(name, d.lng, d.lat);
  }
  if (!opts.silent) {
    broadcastChange('district', { name: d.name, lat: d.lat, lng: d.lng });
  }
};

window.clearDistHighlight = (opts = {}) => {
  currentFocusedDistrict = null;
  clearDistrictHighlight();
  document.querySelectorAll('.dist-row').forEach(r => r.classList.remove('active'));
  if (!opts.silent) {
    broadcastChange('district', null);
  }
};

window.histFocusArea = (id, opts = {}) => {
  currentFocusedHistArea = id;
  document.querySelectorAll('.hist-family-row').forEach(r => r.classList.remove('active'));
  document.querySelector(`.hist-family-row[data-hist-area="${id}"]`)?.classList.add('active');
  const area = histFamilies.find(x => x.id === id);
  if (area) focusDistrictAt(area.label, area.lng, area.lat, false);
  if (!opts.silent) {
    broadcastChange('histArea', id);
  }
};

window.histClearHighlight = (opts = {}) => {
  currentFocusedHistArea = null;
  clearDistrictHighlight();
  document.querySelectorAll('.hist-family-row').forEach(r => r.classList.remove('active'));
  if (!opts.silent) {
    broadcastChange('histArea', null);
  }
};

window.castToTV = () => {
  castToTV();
};

window.toggleAudio = (opts = {}) => {
  const audio = document.getElementById('bgAudio');
  const btn = document.getElementById('audioBtn');
  if (!audio) return;
  if (audio.paused) {
    audio.play().catch(() => {});
    if (btn) {
      btn.textContent = '‖ AUX';
      btn.classList.add('playing');
    }
  } else {
    audio.pause();
    if (btn) {
      btn.textContent = '▶ AUX';
      btn.classList.remove('playing');
    }
  }
  if (!opts.silent) {
    broadcastChange('audio', { playing: !audio.paused, volume: audio.volume });
  }
};

window.updateModalAux = () => {
  const audio = document.getElementById('bgAudio');
  const btn = document.getElementById('modalAuxBtn');
  if (!btn || !audio) return;
  if (audio.paused) {
    btn.textContent = '▶ AUX';
    btn.classList.remove('playing');
  } else {
    btn.textContent = '‖ AUX';
    btn.classList.add('playing');
  }
};

window.setVolume = (v, opts = {}) => {
  const audio = document.getElementById('bgAudio');
  if (audio) audio.volume = +v;
  if (!opts.silent) {
    broadcastChange('audio', { playing: !audio?.paused, volume: +v });
  }
};

window.toggleDeathCount = (opts = {}) => {
  const layer = document.querySelector('.prov-layer');
  const btn = document.getElementById('countBtn');
  if (!layer) return;
  const hidden = layer.classList.toggle('hidden');
  btn?.classList.toggle('on', !hidden);
  if (!opts.silent) {
    broadcastChange('deathCount', !hidden);
  }
};

// Re-render trail when fade timer fires from rpf.js
document.addEventListener('rpf-fade-tick', () => update(currentDay));

// ── Boot ──────────────────────────────────────────────────
init();
