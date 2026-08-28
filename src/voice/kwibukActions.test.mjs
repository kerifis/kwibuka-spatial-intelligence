import assert from 'node:assert/strict';
import test from 'node:test';
import { createKwibukActionRunner } from './kwibukActions.js';

function createMockContext() {
  let day = 10;
  let playing = false;
  let speed = 0.5;
  let mode = 'std';
  let memorials = false;
  let rpf = true;
  let hist = false;
  let deathCount = true;
  let focusedDistrict = null;
  let testimoniesOpened = false;
  let podcastOpened = false;
  let activeNavTab = 'home';
  let aiMatrixRan = false;
  let zoomLevel = 1;
  let panelOpen = false;
  let visitKigaliOpened = false;
  let searchedQuery = null;
  let streetViewToggled = false;
  let audioPlaying = false;
  let audioVolume = 0.5;
  let activeMuseumRoom = null;
  let modalClosed = null;

  const districts = [
    { name: 'Gasabo', province: 'Kigali', lat: -1.89, lng: 30.112 },
    { name: 'Bugesera', province: 'Eastern', lat: -2.167, lng: 30.167 },
    { name: 'Huye', province: 'Southern', lat: -2.583, lng: 29.75 },
  ];

  const runner = createKwibukActionRunner({
    getDay: () => day,
    setDay: (d) => { day = d; },
    togglePlay: () => { playing = !playing; },
    setSpeed: (s) => { speed = s; },
    getPhase: (d) => ({ n: 'Systematic extermination', s: 16, e: 78 }),
    sigmoid: (d) => 100000 * (d / 100),
    sigmoidRate: (d) => 5000,
    getActiveEvents: (d) => [{ id: 'e1' }, { id: 'e2' }],
    setMode: (m) => { mode = m; },
    getMode: () => mode,
    focusDistrict: (name) => { focusedDistrict = name; },
    clearDistHighlight: () => { focusedDistrict = null; },
    toggleMemorials: () => { memorials = !memorials; },
    getMemorialsVisible: () => memorials,
    toggleRpf: () => { rpf = !rpf; },
    getRpfVisible: () => rpf,
    toggleHist: () => { hist = !hist; },
    getHistVisible: () => hist,
    toggleDeathCount: () => { deathCount = !deathCount; },
    openTestimonies: () => { testimoniesOpened = true; },
    openPodcast: () => { podcastOpened = true; },
    closeTestimonies: () => { modalClosed = 'testimonies'; },
    testimoniesNext: () => {},
    testimoniesPrev: () => {},
    setTestNav: (tab) => { activeNavTab = tab; },
    showTab: (t) => {},
    closeIC: () => { modalClosed = 'infocard'; },
    showEventById: (id) => {},
    analyzeMatrix: async () => { aiMatrixRan = true; },
    closeAI: () => { modalClosed = 'ai_synthesis'; },
    openMuseum: (r) => { activeMuseumRoom = r || 'origins'; },
    closeMuseum: () => { modalClosed = 'museum'; },
    museumRotate: (d) => {},
    museumReset: () => {},
    toggleDistrictPanel: () => {},
    openVisitKigali: () => { visitKigaliOpened = true; },
    searchPlace: (q) => { searchedQuery = q; },
    toggleStreetView: () => { streetViewToggled = true; },
    zoomIn: () => { zoomLevel += 0.5; },
    zoomOut: () => { zoomLevel = Math.max(0.5, zoomLevel - 0.5); },
    setZoom: (v) => { zoomLevel = v; },
    togglePanel: () => { panelOpen = !panelOpen; },
    toggleAudio: () => { audioPlaying = !audioPlaying; },
    setVolume: (v) => { audioVolume = v; },
    castToTV: () => {},
    districts,
  });

  return {
    runner,
    state: () => ({
      day,
      playing,
      speed,
      mode,
      memorials,
      rpf,
      hist,
      deathCount,
      focusedDistrict,
      testimoniesOpened,
      podcastOpened,
      activeNavTab,
      aiMatrixRan,
      zoomLevel,
      panelOpen,
      visitKigaliOpened,
      searchedQuery,
      streetViewToggled,
      audioPlaying,
      audioVolume,
      activeMuseumRoom,
      modalClosed,
    }),
  };
}

test('kwibukActions: timeline, playback, and speed', async () => {
  const { runner, state } = createMockContext();

  const res1 = await runner('set_timeline_day', { day: 30 });
  assert.equal(res1.ok, true);
  assert.equal(res1.day, 30);
  assert.equal(state().day, 30);

  const playRes = await runner('play_timeline', { action: 'toggle' });
  assert.equal(playRes.ok, true);
  assert.equal(state().playing, true);

  const spdRes = await runner('set_timeline_speed', { speed: 2 });
  assert.equal(spdRes.ok, true);
  assert.equal(state().speed, 2);
});

test('kwibukActions: map zoom and display modes', async () => {
  const { runner, state } = createMockContext();

  const nvgRes = await runner('set_display_mode', { mode: 'night vision' });
  assert.equal(nvgRes.ok, true);
  assert.equal(nvgRes.mode, 'nvg');
  assert.equal(state().mode, 'nvg');

  const zoomInRes = await runner('zoom_map', { direction: 'in' });
  assert.equal(zoomInRes.ok, true);
  assert.equal(state().zoomLevel, 1.5);

  const zoomLvlRes = await runner('zoom_map', { level: 12 });
  assert.equal(zoomLvlRes.ok, true);
  assert.equal(state().zoomLevel, 12);
});

test('kwibukActions: visit_kigali, search_place, and toggle_street_view', async () => {
  const { runner, state } = createMockContext();

  const vkRes = await runner('visit_kigali');
  assert.equal(vkRes.ok, true);
  assert.equal(state().mode, 'crt');
  assert.equal(state().visitKigaliOpened, true);

  const searchRes = await runner('search_place', { query: 'Hotel des Mille Collines' });
  assert.equal(searchRes.ok, true);
  assert.equal(state().searchedQuery, 'Hotel des Mille Collines');

  const svRes = await runner('toggle_street_view');
  assert.equal(svRes.ok, true);
  assert.equal(state().streetViewToggled, true);
});

test('kwibukActions: navigate_tab and close_modal for all tabs', async () => {
  const { runner, state } = createMockContext();

  const testNav = await runner('navigate_tab', { tab: 'testimonies' });
  assert.equal(testNav.ok, true);
  assert.equal(state().testimoniesOpened, true);

  const podNav = await runner('navigate_tab', { tab: 'podcast' });
  assert.equal(podNav.ok, true);
  assert.equal(state().podcastOpened, true);

  const mkNav = await runner('navigate_tab', { tab: 'memory_keepers' });
  assert.equal(mkNav.ok, true);
  assert.equal(state().activeNavTab, 'memkeepers');

  const musNav = await runner('navigate_tab', { tab: 'museum', room: 'preparation' });
  assert.equal(musNav.ok, true);
  assert.equal(state().activeMuseumRoom, 'preparation');

  const closeRes = await runner('close_modal', { modal: 'testimonies' });
  assert.equal(closeRes.ok, true);
  assert.equal(state().modalClosed, 'testimonies');
});

test('kwibukActions: control_audio and control_museum', async () => {
  const { runner, state } = createMockContext();

  const audioRes = await runner('control_audio', { action: 'toggle' });
  assert.equal(audioRes.ok, true);
  assert.equal(state().audioPlaying, true);

  const volRes = await runner('control_audio', { action: 'volume', volume: 80 });
  assert.equal(volRes.ok, true);
  assert.equal(state().audioVolume, 0.8);

  const musOpen = await runner('control_museum', { action: 'open', room: 'hundredDays' });
  assert.equal(musOpen.ok, true);
  assert.equal(state().activeMuseumRoom, 'hundredDays');
});

test('kwibukActions: layer toggles and get_current_state', async () => {
  const { runner, state } = createMockContext();

  const layerRes = await runner('toggle_layer', { layer: 'memorials' });
  assert.equal(layerRes.ok, true);
  assert.equal(state().memorials, true);

  const snap = await runner('get_current_state');
  assert.equal(snap.ok, true);
  assert.equal(snap.day, 10);
});
