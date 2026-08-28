/**
 * Kwibuka voice action runner — maps Google Gemini / OpenAI tool calls
 * to Kwibuka dashboard functions.
 *
 * Covers all tabs, menus, navigation, Kigali/CRT search, map zoom,
 * layer toggles, testimonies, 3D museum, AUX audio, and modals.
 */

const DISPLAY_MODES = new Set(['std', 'nvg', 'crt', 'flir']);

const MODE_ALIASES = new Map([
  ['standard', 'std'],
  ['normal', 'std'],
  ['default', 'std'],
  ['night vision', 'nvg'],
  ['night', 'nvg'],
  ['green', 'nvg'],
  ['crt', 'crt'],
  ['satellite', 'crt'],
  ['google map', 'crt'],
  ['google maps', 'crt'],
  ['amber', 'crt'],
  ['flir', 'flir'],
  ['thermal', 'flir'],
  ['infrared', 'flir'],
  ['heat', 'flir'],
]);

const DISTRICT_ALIASES = new Map([
  ['kigali', 'Gasabo'],
  ['kigali city', 'Gasabo'],
]);

/**
 * Create a Kwibuka action runner bound to live dashboard modules.
 */
export function createKwibukActionRunner(opts) {
  return async function runAction(name, rawArgs = {}) {
    const args = rawArgs && typeof rawArgs === 'object' ? rawArgs : {};

    /* ── Timeline Controls ────────────────────────────────── */

    if (name === 'set_timeline_day') {
      const day = Math.max(0, Math.min(102, Math.round(Number(args.day))));
      if (!Number.isFinite(day)) {
        return { ok: false, action: name, error: 'Invalid day number' };
      }
      opts.setDay(day);
      const phase = opts.getPhase(day);
      const cumulative = Math.round(opts.sigmoid(day));
      const rate = Math.round(opts.sigmoidRate(day));
      return {
        ok: true,
        action: name,
        day,
        date: dayToDateStr(day),
        phase: phase?.n || null,
        cumulativeLivesLost: cumulative,
        dailyRate: rate,
      };
    }

    if (name === 'play_timeline') {
      const action = String(args.action || 'toggle').toLowerCase();
      opts.togglePlay();
      return { ok: true, action: name, playAction: action };
    }

    if (name === 'set_timeline_speed') {
      const speed = Number(args.speed);
      if (![0.5, 1, 2, 4, 8].includes(speed)) {
        return { ok: false, action: name, error: 'Speed must be 0.5, 1, 2, 4, or 8' };
      }
      opts.setSpeed(speed);
      return { ok: true, action: name, speed };
    }

    /* ── Display Mode ─────────────────────────────────────── */

    if (name === 'set_display_mode') {
      const raw = String(args.mode || '').toLowerCase().trim();
      const mode = MODE_ALIASES.get(raw) || (DISPLAY_MODES.has(raw) ? raw : null);
      if (!mode) {
        return {
          ok: false,
          action: name,
          error: `Unknown display mode: ${args.mode}. Use std, nvg, crt, or flir.`,
        };
      }
      opts.setMode(mode);
      return {
        ok: true,
        action: name,
        mode,
        label: { std: 'Standard', nvg: 'Night Vision', crt: 'CRT Satellite', flir: 'Thermal FLIR' }[mode],
      };
    }

    /* ── Map Zoom ─────────────────────────────────────────── */

    if (name === 'zoom_map') {
      if (args.level !== undefined && Number.isFinite(Number(args.level))) {
        const lvl = Number(args.level);
        opts.setZoom(lvl);
        return { ok: true, action: name, level: lvl };
      }
      const direction = String(args.direction || 'in').toLowerCase();
      if (direction === 'out') opts.zoomOut();
      else opts.zoomIn();
      return { ok: true, action: name, direction };
    }

    /* ── Visit Kigali & CRT Search ────────────────────────── */

    if (name === 'visit_kigali' || name === 'search_place') {
      const query = String(args.query || args.place || '').trim();
      // Ensure in CRT mode
      if (opts.getMode() !== 'crt') {
        opts.setMode('crt');
      }
      if (query) {
        // Trigger place search in Google Maps
        opts.searchPlace(query);
        return { ok: true, action: name, query, status: `Searching Kigali for "${query}" in CRT mode` };
      } else {
        opts.openVisitKigali();
        return { ok: true, action: name, status: 'Visit Kigali satellite mode activated' };
      }
    }

    if (name === 'toggle_street_view') {
      opts.toggleStreetView();
      return { ok: true, action: name, status: 'Street View toggled' };
    }

    /* ── District Focus ────────────────────────────────────── */

    if (name === 'focus_district') {
      const query = String(args.name || '').trim();
      if (!query) {
        return { ok: false, action: name, error: 'District name is required' };
      }
      const lower = query.toLowerCase();
      const aliased = DISTRICT_ALIASES.get(lower);
      const match = opts.districts.find(d => {
        const n = d.name.toLowerCase();
        return n === lower || n === aliased?.toLowerCase() ||
               n.includes(lower) || lower.includes(n);
      });
      if (!match) {
        return { ok: false, action: name, error: `District not found: ${query}` };
      }
      opts.focusDistrict(match.name);
      return {
        ok: true,
        action: name,
        district: match.name,
        province: match.province,
      };
    }

    if (name === 'clear_district_highlight') {
      opts.clearDistHighlight();
      return { ok: true, action: name };
    }

    /* ── Tab & Modal Navigation ───────────────────────────── */

    if (name === 'navigate_tab') {
      const tab = String(args.tab || '').toLowerCase().trim();

      if (tab === 'testimonies' || tab === '100voices' || tab === '100 voices') {
        opts.openTestimonies();
        return { ok: true, action: name, tab: '100 Voices Testimonies' };
      }
      if (tab === 'podcast') {
        opts.openPodcast();
        return { ok: true, action: name, tab: 'Podcast' };
      }
      if (tab === 'memory_keepers' || tab === 'memkeepers') {
        opts.openTestimonies();
        opts.setTestNav?.('memkeepers');
        return { ok: true, action: name, tab: 'Memory Keepers' };
      }
      if (tab === 'rwanda_tech' || tab === 'rwandatech') {
        opts.openTestimonies();
        opts.setTestNav?.('rwandatech');
        return { ok: true, action: name, tab: 'Rwanda Tech' };
      }
      if (tab === 'district_index' || tab === 'dist' || tab === 'districts') {
        opts.toggleDistrictPanel();
        return { ok: true, action: name, tab: 'District Index' };
      }
      if (tab === 'hist_panel' || tab === 'hist' || tab === 'families') {
        opts.toggleHist();
        return { ok: true, action: name, tab: 'Historical Families' };
      }
      if (tab === 'ai_synthesis' || tab === 'ai' || tab === 'synthesis') {
        try {
          await opts.analyzeMatrix();
          return { ok: true, action: name, tab: 'AI Synthesis' };
        } catch (e) {
          return { ok: false, action: name, error: e?.message || 'AI synthesis failed' };
        }
      }
      if (tab === 'overview_panel' || tab === 'overview' || tab === 'panel' || tab === 'stats') {
        opts.togglePanel();
        return { ok: true, action: name, tab: 'Overview Panel' };
      }
      if (tab === 'museum' || tab === '3d_museum') {
        const room = args.room ? String(args.room).toLowerCase() : undefined;
        opts.openMuseum(room);
        return { ok: true, action: name, tab: '3D Virtual Museum', room: room || 'origins' };
      }
      if (tab === 'visit_kigali') {
        opts.openVisitKigali();
        return { ok: true, action: name, tab: 'Visit Kigali' };
      }

      return { ok: false, action: name, error: `Unknown tab: ${args.tab}` };
    }

    if (name === 'close_modal') {
      const target = String(args.modal || 'all').toLowerCase().trim();
      if (target === 'testimonies' || target === 'all') opts.closeTestimonies();
      if (target === 'ai_synthesis' || target === 'ai' || target === 'all') opts.closeAI();
      if (target === 'infocard' || target === 'ic' || target === 'all') opts.closeIC();
      if (target === 'museum' || target === 'all') opts.closeMuseum();
      return { ok: true, action: name, closed: target };
    }

    if (name === 'paginate_testimonies') {
      const direction = String(args.direction || 'next').toLowerCase();
      if (direction === 'prev' || direction === 'previous') {
        opts.testimoniesPrev();
        return { ok: true, action: name, direction: 'previous' };
      } else {
        opts.testimoniesNext();
        return { ok: true, action: name, direction: 'next' };
      }
    }

    /* ── Info Card (Event & Memorial Popups) ──────────────── */

    if (name === 'control_infocard') {
      const action = String(args.action || 'switch_tab').toLowerCase();
      if (action === 'open' && args.eventId) {
        opts.showEventById(args.eventId);
        return { ok: true, action: name, openedEvent: args.eventId };
      }
      if (action === 'close') {
        opts.closeIC();
        return { ok: true, action: name, closed: true };
      }
      if (args.tab) {
        const tab = String(args.tab).toLowerCase();
        opts.showTab(tab);
        return { ok: true, action: name, tab };
      }
      return { ok: true, action: name };
    }

    /* ── Audio Player Control ─────────────────────────────── */

    if (name === 'control_audio') {
      const action = String(args.action || 'toggle').toLowerCase();
      if (action === 'volume' || args.volume !== undefined) {
        let vol = Number(args.volume);
        if (vol > 1) vol = vol / 100; // normalize 0-100 to 0-1
        vol = Math.max(0, Math.min(1, vol));
        opts.setVolume(vol);
        return { ok: true, action: name, volume: Math.round(vol * 100) + '%' };
      }
      opts.toggleAudio();
      return { ok: true, action: name, actionType: action };
    }

    /* ── 3D Museum Control ────────────────────────────────── */

    if (name === 'control_museum') {
      const action = String(args.action || 'open').toLowerCase();
      if (action === 'open') {
        const room = args.room ? String(args.room) : undefined;
        opts.openMuseum(room);
        return { ok: true, action: name, room: room || 'origins' };
      }
      if (action === 'close') {
        opts.closeMuseum();
        return { ok: true, action: name, closed: true };
      }
      if (action === 'rotate') {
        const delta = Number(args.delta) || 0.5;
        opts.museumRotate(delta);
        return { ok: true, action: name, rotated: delta };
      }
      if (action === 'reset') {
        opts.museumReset();
        return { ok: true, action: name, reset: true };
      }
    }

    /* ── Layer Toggles ────────────────────────────────────── */

    if (name === 'toggle_layer') {
      const layer = String(args.layer || '').toLowerCase().trim();
      if (layer === 'memorials' || layer === 'mass_grave') {
        opts.toggleMemorials();
        return { ok: true, action: name, layer: 'memorials', visible: opts.getMemorialsVisible() };
      }
      if (layer === 'rpf') {
        opts.toggleRpf();
        return { ok: true, action: name, layer: 'rpf', visible: opts.getRpfVisible() };
      }
      if (layer === 'hist' || layer === 'families') {
        opts.toggleHist();
        return { ok: true, action: name, layer: 'hist', visible: opts.getHistVisible() };
      }
      if (layer === 'death_count' || layer === 'count') {
        opts.toggleDeathCount();
        return { ok: true, action: name, layer: 'death_count' };
      }
      if (layer === 'districts' || layer === 'dist') {
        opts.toggleDistrictPanel();
        return { ok: true, action: name, layer: 'districts' };
      }
      if (layer === 'panel' || layer === 'sidebar') {
        opts.togglePanel();
        return { ok: true, action: name, layer: 'panel' };
      }
      return { ok: false, action: name, error: `Unknown layer: ${args.layer}` };
    }

    // Direct toggle tool names for convenience
    if (name === 'toggle_memorials') {
      opts.toggleMemorials();
      return { ok: true, action: name, visible: opts.getMemorialsVisible() };
    }

    if (name === 'toggle_rpf') {
      opts.toggleRpf();
      return { ok: true, action: name, visible: opts.getRpfVisible() };
    }

    if (name === 'toggle_hist') {
      opts.toggleHist();
      return { ok: true, action: name, visible: opts.getHistVisible() };
    }

    if (name === 'toggle_death_count') {
      opts.toggleDeathCount();
      return { ok: true, action: name };
    }

    if (name === 'open_testimonies') {
      opts.openTestimonies();
      return { ok: true, action: name };
    }

    if (name === 'open_ai_synthesis') {
      try {
        await opts.analyzeMatrix();
        return { ok: true, action: name };
      } catch (e) {
        return { ok: false, action: name, error: e?.message || 'AI synthesis failed' };
      }
    }

    if (name === 'toggle_panel') {
      opts.togglePanel();
      return { ok: true, action: name };
    }

    if (name === 'cast_to_tv') {
      opts.castToTV();
      return { ok: true, action: name, status: 'Casting initiated' };
    }

    /* ── Read State ───────────────────────────────────────── */

    if (name === 'get_current_state') {
      const day = opts.getDay();
      const phase = opts.getPhase(day);
      const cumulative = Math.round(opts.sigmoid(day));
      const rate = Math.round(opts.sigmoidRate(day));
      const activeEvents = opts.getActiveEvents(day);
      return {
        ok: true,
        action: name,
        day,
        date: dayToDateStr(day),
        phase: phase?.n || null,
        cumulativeLivesLost: cumulative,
        dailyRate: rate,
        activeEventCount: activeEvents.length,
        displayMode: opts.getMode(),
        memorialsVisible: opts.getMemorialsVisible(),
        rpfVisible: opts.getRpfVisible(),
        histVisible: opts.getHistVisible(),
      };
    }

    return { ok: false, action: name, error: `Unknown action: ${name}` };
  };
}

function dayToDateStr(day) {
  const dt = new Date('1994-04-06');
  dt.setDate(dt.getDate() + day);
  return dt.toISOString().slice(0, 10);
}
