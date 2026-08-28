/**
 * KWIBUKA // Real-Time Presentation & Cast Synchronization Module
 * Synchronizes laptop controller state to TV/receiver displays in real time via:
 * 1. Presentation API (Chromecast, Google Cast, Wireless Display)
 * 2. BroadcastChannel (Same-device multi-window / extended desktop / dual display)
 * 3. LocalStorage storage event fallback
 * 4. Local Network SSE / HTTP Relay (Smart TV browsers & cross-device local Wi-Fi)
 */

const SYNC_CHANNEL_NAME = 'kwibuka_presentation_sync';
const STORAGE_KEY = 'kwibuka_cast_state_v1';

let isReceiver = false;
let isController = true;
let isApplyingRemoteState = false;
let broadcastChannel = null;
let activePresentationConnections = new Set();
let networkEventSource = null;
let laserPointerEnabled = true;
let localNetworkInfo = null;

// Callbacks registered by main.js
let stateGetter = null;
let stateApplier = null;
let toastNotifier = null;

/**
 * Check if the current window/tab is running as a presentation receiver.
 */
export function checkIsReceiver() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const castParam = params.get('cast') || params.get('role') || params.get('mode');
  if (castParam === 'receiver' || castParam === 'tv' || castParam === 'display' || castParam === 'presentation') {
    return true;
  }
  if (typeof navigator !== 'undefined' && 'presentation' in navigator && navigator.presentation?.receiver) {
    return true;
  }
  return false;
}

/**
 * Initialize Cast & Presentation Synchronization.
 * @param {Object} options
 * @param {Function} options.getState - Function returning current application state object
 * @param {Function} options.applyState - Function applying remote state object to application
 * @param {Function} options.showToast - Function to show notifications in UI
 */
export async function initCastSync({ getState, applyState, showToast }) {
  stateGetter = getState;
  stateApplier = applyState;
  toastNotifier = showToast;

  isReceiver = checkIsReceiver();
  isController = !isReceiver;

  if (typeof window === 'undefined') return;

  // 1. Setup BroadcastChannel (multi-window / same-origin cross-tab)
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      broadcastChannel.onmessage = (event) => {
        handleIncomingMessage(event.data, 'broadcast-channel');
      };
    } catch (e) {
      console.warn('[CastSync] BroadcastChannel init error:', e);
    }
  }

  // 2. Setup LocalStorage fallback listener
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          handleIncomingMessage(data, 'local-storage');
        } catch (_) {}
      }
    });
  }

  // 3. Setup Presentation API Receiver
  if (isReceiver && typeof navigator !== 'undefined' && 'presentation' in navigator && navigator.presentation?.receiver) {
    setupPresentationReceiver();
  }

  // 4. Setup Local Network SSE connection (works for Smart TV browsers on Wi-Fi)
  setupNetworkSyncStream();

  // 5. Query local network info from Vite server
  fetchNetworkInfo();

  // 6. Setup Receiver UI if running in display mode
  if (isReceiver && typeof document !== 'undefined') {
    document.body.classList.add('cast-receiver-mode');

    // ── 4K / HiDPI Resolution Detection ──────────────────────
    // A 4K TV reports screen.width >= 3840 OR a high devicePixelRatio.
    // Some TVs report 1920×1080 at DPR=2 (effective 3840×2160).
    const screenW = window.screen?.width ?? 1920;
    const screenH = window.screen?.height ?? 1080;
    const dpr = window.devicePixelRatio ?? 1;
    const is4K = screenW >= 3840 || screenH >= 2160 || (screenW * dpr) >= 3840;

    if (is4K) {
      document.body.classList.add('display-4k');
      // Force viewport to physical pixel count — no browser UA scaling
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.content = `width=${screenW}, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`;
      }
      // Notify museum renderer to lift DPR cap for 4K output
      window.__receiverIs4K = true;
    }

    // Auto-enter fullscreen on the receiver for maximum resolution utilization
    const tryFullscreen = () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
      }
    };
    // Attempt immediately, then again after first user gesture (some TVs require interaction)
    tryFullscreen();
    document.addEventListener('click', tryFullscreen, { once: true });
    document.addEventListener('keydown', tryFullscreen, { once: true });

    createReceiverUiBadge();
    setupReceiverIdleCursor();

    // Ask controller for latest state
    setTimeout(() => {
      broadcastMessage({ type: 'REQUEST_STATE', timestamp: Date.now() });
    }, 300);
  } else {

    // Setup Laser Pointer tracking on map container
    setupLaserPointerEmitter();
  }

  // Bind window helpers for cast dialog
  if (typeof window !== 'undefined') {
    window.closeCastModal = closeCastModal;
    window.triggerBrowserCast = () => {
      closeCastModal();
      castToTV();
    };
    window.forceResyncCast = () => {
      broadcastFullState();
      if (toastNotifier) toastNotifier('Sent full state synchronization to TV display');
    };
    window.copyCastTvUrl = () => {
      const input = document.getElementById('castTvUrlInput');
      if (input) {
        input.select();
        navigator.clipboard?.writeText(input.value);
        if (toastNotifier) toastNotifier('TV Direct URL copied to clipboard');
      }
    };
    window.setLaserPointer = (enabled) => {
      laserPointerEnabled = enabled;
    };
  }

  return {
    isReceiver,
    isController,
    castToTV,
    broadcastChange,
    broadcastFullState,
    getNetworkInfo: () => localNetworkInfo,
  };
}

/**
 * Set up Presentation API Receiver.
 */
function setupPresentationReceiver() {
  if (typeof navigator === 'undefined' || !navigator.presentation?.receiver) return;
  navigator.presentation.receiver.connectionList
    .then((list) => {
      list.connections.forEach((conn) => addReceiverConnection(conn));
      list.onconnectionavailable = (evt) => addReceiverConnection(evt.connection);
    })
    .catch((err) => {
      console.warn('[CastSync] Presentation receiver error:', err);
    });
}

function addReceiverConnection(conn) {
  conn.addEventListener('message', (event) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      handleIncomingMessage(data, 'presentation-api');
    } catch (e) {
      console.warn('[CastSync] Receiver message parse error:', e);
    }
  });

  conn.addEventListener('connect', () => {
    updateReceiverBadgeStatus(true);
    conn.send(JSON.stringify({ type: 'REQUEST_STATE', timestamp: Date.now() }));
  });

  conn.addEventListener('close', () => {
    updateReceiverBadgeStatus(false);
  });
  conn.addEventListener('terminate', () => {
    updateReceiverBadgeStatus(false);
  });
}

/**
 * Connect to SSE Stream on dev server (/api/cast-sync/events).
 */
function setupNetworkSyncStream() {
  try {
    if (typeof EventSource !== 'undefined') {
      networkEventSource = new EventSource('/api/cast-sync/events');
      networkEventSource.onmessage = (event) => {
        try {
          if (!event.data) return;
          const data = JSON.parse(event.data);
          handleIncomingMessage(data, 'network-sse');
        } catch (_) {}
      };
      networkEventSource.onerror = () => {
        // SSE silent fallback
      };
    }
  } catch (e) {
    console.debug('[CastSync] SSE not available:', e);
  }
}

/**
 * Fetch local Wi-Fi IP address from Vite dev server if available.
 */
async function fetchNetworkInfo() {
  try {
    if (typeof fetch === 'undefined') return;
    const res = await fetch('/api/cast-sync/info');
    if (res.ok) {
      localNetworkInfo = await res.json();
    }
  } catch (_) {}
}

/**
 * Handle incoming sync messages from any transport.
 */
function handleIncomingMessage(msg, source) {
  if (!msg || typeof msg !== 'object') return;

  // Ignore our own messages if sender matches
  if (msg.sender === (isReceiver ? 'receiver' : 'controller') && source === 'broadcast-channel') {
    return;
  }

  if (msg.type === 'REQUEST_STATE') {
    if (isController && stateGetter) {
      broadcastFullState();
    }
    return;
  }

  if (msg.type === 'FULL_STATE' && msg.state) {
    if (isReceiver && stateApplier) {
      isApplyingRemoteState = true;
      try {
        stateApplier(msg.state, { isFull: true });
        updateReceiverBadgeStatus(true);
      } finally {
        isApplyingRemoteState = false;
      }
    }
    return;
  }

  if (msg.type === 'STATE_CHANGE' && msg.change) {
    if (isReceiver && stateApplier) {
      isApplyingRemoteState = true;
      try {
        stateApplier(msg.change, { isFull: false });
        updateReceiverBadgeStatus(true);
      } finally {
        isApplyingRemoteState = false;
      }
    }
    return;
  }

  if (msg.type === 'LASER_POINTER' && msg.coords) {
    if (isReceiver) {
      renderReceiverLaser(msg.coords);
    }
    return;
  }
}

/**
 * Broadcast message over all active transports.
 */
function broadcastMessage(payload) {
  const jsonStr = JSON.stringify(payload);

  // 1. BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (_) {}
  }

  // 2. LocalStorage
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, jsonStr);
    } catch (_) {}
  }

  // 3. Presentation Connections (Controller -> TV)
  for (const conn of activePresentationConnections) {
    try {
      if (conn.state === 'connected') {
        conn.send(jsonStr);
      }
    } catch (_) {}
  }

  // 4. Local Network HTTP POST Relay (Cross-device / Smart TV)
  if (typeof fetch !== 'undefined') {
    try {
      fetch('/api/cast-sync/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
      }).catch(() => {});
    } catch (_) {}
  }
}

/**
 * Broadcast a single incremental state change.
 * @param {string} key - State property name
 * @param {*} value - New value
 */
export function broadcastChange(key, value) {
  if (isApplyingRemoteState || !isController) return;

  const payload = {
    type: 'STATE_CHANGE',
    sender: 'controller',
    change: { key, value },
    timestamp: Date.now(),
  };
  broadcastMessage(payload);
}

/**
 * Broadcast complete state snapshot to all connected receivers.
 */
export function broadcastFullState() {
  if (isApplyingRemoteState || !isController || !stateGetter) return;

  const state = stateGetter();
  const payload = {
    type: 'FULL_STATE',
    sender: 'controller',
    state,
    timestamp: Date.now(),
  };
  broadcastMessage(payload);
}

/**
 * Broadcast laser pointer position across map.
 */
export function broadcastLaser(x, y, active, geo = null) {
  if (isApplyingRemoteState || !isController || !laserPointerEnabled) return;

  const payload = {
    type: 'LASER_POINTER',
    sender: 'controller',
    coords: { x, y, active, geo },
  };
  broadcastMessage(payload);
}

/**
 * Initiate Cast to TV / External Display via Presentation API or Open Presentation Dialog.
 */
export async function castToTV() {
  if (typeof window === 'undefined') return;
  const castBtn = document.getElementById('castBtn');

  // If Presentation API is supported
  if ('PresentationRequest' in window) {
    const receiverUrl = `${window.location.origin}/?cast=receiver`;
    const urls = [receiverUrl, window.location.href];
    const req = new PresentationRequest(urls);

    try {
      const conn = await req.start();
      activePresentationConnections.add(conn);

      conn.addEventListener('connect', () => {
        activePresentationConnections.add(conn);
        castBtn?.classList.add('on', 'casting-live');
        if (castBtn) castBtn.title = 'Live Synced to TV';
        broadcastFullState();
      });

      conn.addEventListener('close', () => {
        activePresentationConnections.delete(conn);
        if (activePresentationConnections.size === 0) {
          castBtn?.classList.remove('on', 'casting-live');
          if (castBtn) castBtn.title = 'Cast to TV';
        }
      });

      conn.addEventListener('terminate', () => {
        activePresentationConnections.delete(conn);
        if (activePresentationConnections.size === 0) {
          castBtn?.classList.remove('on', 'casting-live');
          if (castBtn) castBtn.title = 'Cast to TV';
        }
      });

      conn.addEventListener('message', (event) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          handleIncomingMessage(data, 'presentation-controller');
        } catch (_) {}
      });

      // Send initial full state immediately
      setTimeout(() => broadcastFullState(), 200);
      openCastModal(true);
      return;
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
        console.debug('[CastSync] Presentation start:', err);
      }
    }
  }

  // Fallback: Open Cast & Presentation Modal with direct Smart TV URL & instructions
  openCastModal(false);
}

/**
 * Open Cast & Presentation Dialog Modal.
 */
export function openCastModal(isConnected = false) {
  if (typeof document === 'undefined') return;
  let modal = document.getElementById('castModal');
  if (!modal) {
    modal = createCastModalElement();
    document.body.appendChild(modal);
  }

  const ip = localNetworkInfo?.localIp || window.location.hostname || 'localhost';
  const port = localNetworkInfo?.port || window.location.port || '5173';
  const tvUrl = `http://${ip}:${port}/?cast=receiver`;

  const urlInput = document.getElementById('castTvUrlInput');
  if (urlInput) urlInput.value = tvUrl;

  const statusText = document.getElementById('castStatusText');
  if (statusText) {
    if (isConnected || activePresentationConnections.size > 0) {
      statusText.innerHTML = '<span class="cast-dot live"></span> Connected to TV // Live Real-Time Sync Active';
    } else {
      statusText.innerHTML = '<span class="cast-dot ready"></span> Ready to Cast // Broadcast Channel & Wi-Fi Active';
    }
  }

  modal.classList.add('vis');
}

/**
 * Close Cast & Presentation Dialog Modal.
 */
export function closeCastModal() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('castModal');
  if (modal) modal.classList.remove('vis');
}

/**
 * Build Cast Modal DOM Element.
 */
function createCastModalElement() {
  const div = document.createElement('div');
  div.id = 'castModal';
  div.className = 'cast-modal';
  div.innerHTML = `
    <div class="cast-modal-backdrop" onclick="window.closeCastModal()"></div>
    <div class="cast-modal-panel">
      <div class="cast-modal-hdr">
        <div class="cast-modal-title">
          <span class="cast-icon">⊡</span> REAL-TIME TV PRESENTATION CAST
        </div>
        <button class="cast-modal-close" onclick="window.closeCastModal()">✕</button>
      </div>

      <div class="cast-modal-status" id="castStatusText">
        <span class="cast-dot ready"></span> Ready to Cast // Broadcast Channel & Wi-Fi Active
      </div>

      <div class="cast-modal-section">
        <div class="cast-section-label">OPTION 1: WIRELESS CAST / CHROMECAST / AIRPLAY</div>
        <p class="cast-section-desc">Click below or use browser <b>Menu → Cast…</b> to send this dashboard to your TV. All changes on your laptop will reflect in real time.</p>
        <div class="cast-btn-row">
          <button class="fbtn on" onclick="window.triggerBrowserCast()">▶ START WIRELESS CAST</button>
          <button class="fbtn" onclick="window.forceResyncCast()">⚡ FORCE RESYNC TV</button>
        </div>
      </div>

      <div class="cast-modal-section">
        <div class="cast-section-label">OPTION 2: SMART TV BROWSER / SECOND SCREEN DIRECT LINK</div>
        <p class="cast-section-desc">Open your TV's web browser and navigate to this local URL (laptop and TV must be on same Wi-Fi):</p>
        <div class="cast-url-box">
          <input type="text" id="castTvUrlInput" readonly value="http://localhost:5173/?cast=receiver" />
          <button class="cast-copy-btn" onclick="window.copyCastTvUrl()">COPY</button>
        </div>
      </div>

      <div class="cast-modal-options">
        <label class="cast-opt-label">
          <input type="checkbox" id="laserToggle" checked onchange="window.setLaserPointer(this.checked)" />
          <span>Show Presenter Laser Pointer on TV when hovering laptop map</span>
        </label>
      </div>

      <div class="cast-modal-footer">
        <button class="fbtn" onclick="window.closeCastModal()">CLOSE</button>
      </div>
    </div>
  `;
  return div;
}

/**
 * Setup Laser Pointer on Controller Map.
 */
function setupLaserPointerEmitter() {
  if (typeof document === 'undefined') return;
  const mapWrap = document.getElementById('mapWrap');
  if (!mapWrap) return;

  mapWrap.addEventListener('mousemove', (e) => {
    if (!laserPointerEnabled) return;
    const rect = mapWrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      broadcastLaser(x, y, true);
    }
  });

  mapWrap.addEventListener('mouseleave', () => {
    broadcastLaser(0, 0, false);
  });
}

/**
 * Render Presenter Laser Pointer Dot on Receiver Map.
 */
function renderReceiverLaser(coords) {
  if (typeof document === 'undefined') return;
  let laser = document.getElementById('receiverLaserDot');
  if (!laser) {
    laser = document.createElement('div');
    laser.id = 'receiverLaserDot';
    laser.className = 'receiver-laser-dot';
    document.getElementById('mapWrap')?.appendChild(laser);
  }

  if (!coords.active) {
    laser.style.opacity = '0';
    return;
  }

  const mapWrap = document.getElementById('mapWrap');
  if (!mapWrap) return;

  const W = mapWrap.clientWidth;
  const H = mapWrap.clientHeight;

  laser.style.left = `${coords.x * W}px`;
  laser.style.top = `${coords.y * H}px`;
  laser.style.opacity = '1';
}

/**
 * Create Receiver UI Badge on Display screen.
 */
function createReceiverUiBadge() {
  if (typeof document === 'undefined') return;
  const badge = document.createElement('div');
  badge.id = 'receiverLiveBadge';
  badge.className = 'receiver-live-badge live';
  badge.innerHTML = `
    <span class="rl-dot"></span>
    <span class="rl-text">LIVE PRESENTATION DISPLAY</span>
    <button class="rl-fs-btn" onclick="window.toggleReceiverFullscreen()" title="Toggle Fullscreen (F)">⛶</button>
  `;
  document.body.appendChild(badge);

  if (typeof window !== 'undefined') {
    window.toggleReceiverFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    };

    window.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F') {
        window.toggleReceiverFullscreen();
      }
    });
  }
}

function updateReceiverBadgeStatus(isLive) {
  if (typeof document === 'undefined') return;
  const badge = document.getElementById('receiverLiveBadge');
  if (badge) {
    badge.classList.toggle('live', isLive);
    const text = badge.querySelector('.rl-text');
    if (text) text.textContent = isLive ? 'LIVE PRESENTATION DISPLAY' : 'DISPLAY // CONNECTING...';
  }
}

/**
 * Auto-hide mouse cursor on TV after 2.5 seconds of inactivity.
 */
function setupReceiverIdleCursor() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  let idleTimer;
  const resetIdle = () => {
    document.body.classList.remove('hide-cursor');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      document.body.classList.add('hide-cursor');
    }, 2500);
  };

  window.addEventListener('mousemove', resetIdle);
  window.addEventListener('touchstart', resetIdle);
  idleTimer = setTimeout(() => {
    document.body.classList.add('hide-cursor');
  }, 2500);
}
