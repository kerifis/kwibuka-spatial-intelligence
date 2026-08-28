/**
 * KWIBUKA // Real-Time Presentation & Cast Synchronization Module
 * Synchronizes laptop controller state to TV/receiver displays in real time via:
 * 1. WebRTC Peer-to-Peer DataChannels (works anywhere on Vercel / internet via PeerJS)
 * 2. Presentation API (Chromecast, Google Cast, Wireless Display)
 * 3. BroadcastChannel (Same-device multi-window / extended desktop / dual display)
 * 4. LocalStorage storage event fallback
 * 5. Local Network SSE / HTTP Relay (Smart TV browsers on local Wi-Fi when running dev server)
 */

const SYNC_CHANNEL_NAME = 'kwibuka_presentation_sync';
const STORAGE_KEY = 'kwibuka_cast_state_v1';
const ROOM_STORAGE_KEY = 'kwibuka_cast_room_id_v1';
const DEFAULT_VERCEL_HOST = 'https://kwibuka-spatial-intelligence.vercel.app';

let isReceiver = false;
let isController = true;
let isApplyingRemoteState = false;
let broadcastChannel = null;
let activePresentationConnections = new Set();
let activeWebRtcConnections = new Set();
let networkEventSource = null;
let laserPointerEnabled = true;
let localNetworkInfo = null;
let currentRoomCode = null;
let hostPeer = null;
let clientPeer = null;
let activeClientConn = null;
let PeerClass = null;

// Callbacks registered by main.js
let stateGetter = null;
let stateApplier = null;
let toastNotifier = null;

/**
 * Generate or retrieve persistent 6-character session room code (e.g. KWB-7492).
 */
export function getOrCreateRoomCode() {
  if (currentRoomCode) return currentRoomCode;
  if (typeof window === 'undefined') return 'KWB-1994';
  
  let saved = localStorage.getItem(ROOM_STORAGE_KEY);
  if (!saved || !saved.startsWith('KWB-')) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    saved = `KWB-${rand}`;
    try {
      localStorage.setItem(ROOM_STORAGE_KEY, saved);
    } catch (_) {}
  }
  currentRoomCode = saved;
  return currentRoomCode;
}

export function sanitizePeerId(code) {
  const clean = String(code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `kwibuka-v1-${clean || 'kwb1994'}`;
}

/**
 * Dynamically load PeerJS library with fallback.
 */
async function loadPeerJS() {
  if (PeerClass) return PeerClass;
  if (typeof window !== 'undefined' && window.Peer) {
    PeerClass = window.Peer;
    return PeerClass;
  }
  try {
    const mod = await import('https://esm.sh/peerjs@1.5.4?bundle');
    PeerClass = mod.Peer || mod.default?.Peer || mod.default;
    if (PeerClass) return PeerClass;
  } catch (e) {
    console.debug('[CastSync] ESM PeerJS load failed, falling back to script tag:', e);
  }

  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('No document'));
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
    s.async = true;
    s.onload = () => {
      PeerClass = window.Peer;
      resolve(PeerClass);
    };
    s.onerror = (err) => {
      console.warn('[CastSync] PeerJS script load error:', err);
      reject(err);
    };
    document.head.appendChild(s);
  });
}

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

  // 4. Setup Local Network SSE connection (when running local dev server)
  setupNetworkSyncStream();

  // 5. Query local network info from Vite server
  fetchNetworkInfo();

  // 6. Initialize WebRTC Peer-to-Peer Cloud Sync
  initWebRtcSync();

  // 7. Setup Receiver UI if running in display mode
  if (isReceiver && typeof document !== 'undefined') {
    document.body.classList.add('cast-receiver-mode');

    // ── 4K / HiDPI Resolution Detection ──────────────────────
    const screenW = window.screen?.width ?? 1920;
    const screenH = window.screen?.height ?? 1080;
    const dpr = window.devicePixelRatio ?? 1;
    const is4K = screenW >= 3840 || screenH >= 2160 || (screenW * dpr) >= 3840;

    if (is4K) {
      document.body.classList.add('display-4k');
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.content = `width=${screenW}, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`;
      }
      window.__receiverIs4K = true;
    }

    // Auto-enter fullscreen on the receiver for maximum display area
    const tryFullscreen = () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
      }
    };
    tryFullscreen();
    document.addEventListener('click', tryFullscreen, { once: true });
    document.addEventListener('keydown', tryFullscreen, { once: true });

    createReceiverUiBadge();
    setupReceiverIdleCursor();

    // Check if room code is needed
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (!roomParam) {
      promptReceiverRoomCode();
    }

    // Ask controller for latest state
    setTimeout(() => {
      broadcastMessage({ type: 'REQUEST_STATE', timestamp: Date.now() });
    }, 400);
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
        if (toastNotifier) toastNotifier('TV WebRTC URL copied to clipboard');
      }
    };
    window.copyCastRoomCode = () => {
      const code = getOrCreateRoomCode();
      navigator.clipboard?.writeText(code);
      if (toastNotifier) toastNotifier(`Room code ${code} copied`);
    };
    window.setLaserPointer = (enabled) => {
      laserPointerEnabled = enabled;
    };
    window.refreshCastRoom = () => {
      const rand = Math.floor(1000 + Math.random() * 9000);
      currentRoomCode = `KWB-${rand}`;
      localStorage.setItem(ROOM_STORAGE_KEY, currentRoomCode);
      if (hostPeer) {
        try { hostPeer.destroy(); } catch (_) {}
      }
      initWebRtcHost();
      updateCastModalFields();
      if (toastNotifier) toastNotifier(`New Room Code generated: ${currentRoomCode}`);
    };
  }

  return {
    isReceiver,
    isController,
    castToTV,
    broadcastChange,
    broadcastFullState,
    getRoomCode: () => getOrCreateRoomCode(),
    getNetworkInfo: () => localNetworkInfo,
    getConnectedReceiversCount: () => activeWebRtcConnections.size + activePresentationConnections.size,
  };
}

/**
 * Initialize WebRTC P2P Sync (Host on Controller, Client on Receiver).
 */
async function initWebRtcSync() {
  try {
    const Peer = await loadPeerJS();
    if (!Peer) return;

    if (isController) {
      initWebRtcHost();
    } else {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
        connectWebRtcReceiver(room);
      }
    }
  } catch (e) {
    console.debug('[CastSync] WebRTC PeerJS init bypassed:', e);
  }
}

/**
 * Initialize Host Peer on presenter laptop.
 */
function initWebRtcHost() {
  if (!PeerClass || !isController) return;
  const roomCode = getOrCreateRoomCode();
  const hostId = sanitizePeerId(roomCode);

  try {
    hostPeer = new PeerClass(hostId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    });

    hostPeer.on('open', (id) => {
      console.debug('[CastSync] WebRTC Host Peer active:', id);
      updateModalStatusText();
    });

    hostPeer.on('connection', (conn) => {
      console.debug('[CastSync] Receiver connected via WebRTC:', conn.peer);
      activeWebRtcConnections.add(conn);
      updateModalStatusText();

      conn.on('open', () => {
        // Send initial full state immediately to this receiver
        if (stateGetter) {
          const state = stateGetter();
          conn.send({
            type: 'FULL_STATE',
            sender: 'controller',
            state,
            timestamp: Date.now(),
          });
        }
        if (toastNotifier) {
          toastNotifier('⚡ Smart TV connected via WebRTC live cloud sync');
        }
      });

      conn.on('data', (data) => {
        handleIncomingMessage(data, 'webrtc-host');
      });

      conn.on('close', () => {
        activeWebRtcConnections.delete(conn);
        updateModalStatusText();
      });

      conn.on('error', () => {
        activeWebRtcConnections.delete(conn);
        updateModalStatusText();
      });
    });

    hostPeer.on('error', (err) => {
      console.debug('[CastSync] Host Peer error (will keep existing transports active):', err);
    });
  } catch (err) {
    console.debug('[CastSync] Host Peer creation error:', err);
  }
}

/**
 * Connect Receiver TV to Host Peer via WebRTC.
 */
export function connectWebRtcReceiver(roomCode) {
  if (!PeerClass) {
    loadPeerJS().then(() => connectWebRtcReceiver(roomCode));
    return;
  }

  const hostId = sanitizePeerId(roomCode);
  updateReceiverBadgeStatus(false, `CONNECTING TO ${roomCode.toUpperCase()}...`);

  try {
    if (clientPeer) {
      try { clientPeer.destroy(); } catch (_) {}
    }

    clientPeer = new PeerClass(null, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      },
    });

    clientPeer.on('open', () => {
      const conn = clientPeer.connect(hostId, { reliable: true });
      activeClientConn = conn;

      conn.on('open', () => {
        console.debug('[CastSync] Receiver WebRTC data channel OPEN');
        updateReceiverBadgeStatus(true);
        hideReceiverRoomPrompt();
        conn.send({ type: 'REQUEST_STATE', timestamp: Date.now() });
      });

      conn.on('data', (data) => {
        handleIncomingMessage(data, 'webrtc-receiver');
      });

      conn.on('close', () => {
        updateReceiverBadgeStatus(false, 'DISCONNECTED // RETRYING...');
        setTimeout(() => connectWebRtcReceiver(roomCode), 3000);
      });

      conn.on('error', (e) => {
        console.debug('[CastSync] WebRTC Receiver connection error:', e);
        updateReceiverBadgeStatus(false, 'CONNECTING...');
      });
    });

    clientPeer.on('error', (err) => {
      console.debug('[CastSync] Client Peer error:', err);
      updateReceiverBadgeStatus(false, 'WAITING FOR CONTROLLER...');
      setTimeout(() => connectWebRtcReceiver(roomCode), 4000);
    });
  } catch (err) {
    console.debug('[CastSync] Error starting WebRTC client:', err);
  }
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
        // SSE silent fallback for static Vercel hosts
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
 * Broadcast message over all active transports (WebRTC P2P, Presentation API, BroadcastChannel, LocalStorage, SSE).
 */
function broadcastMessage(payload) {
  const jsonStr = JSON.stringify(payload);

  // 1. WebRTC DataChannels (Controller -> All connected TV receivers)
  for (const conn of activeWebRtcConnections) {
    try {
      if (conn.open) {
        conn.send(payload);
      }
    } catch (_) {}
  }

  // 2. BroadcastChannel (Same-device tabs/screens)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (_) {}
  }

  // 3. LocalStorage
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, jsonStr);
    } catch (_) {}
  }

  // 4. Presentation Connections (Controller -> Wireless Cast Displays)
  for (const conn of activePresentationConnections) {
    try {
      if (conn.state === 'connected') {
        conn.send(jsonStr);
      }
    } catch (_) {}
  }

  // 5. Local Network HTTP POST Relay (Local dev server fallback)
  if (typeof fetch !== 'undefined' && localNetworkInfo) {
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
 * Initiate Cast to TV / External Display.
 */
export async function castToTV() {
  if (typeof window === 'undefined') return;
  const castBtn = document.getElementById('castBtn');

  // If Presentation API is supported
  if ('PresentationRequest' in window) {
    const room = getOrCreateRoomCode();
    const receiverUrl = `${window.location.origin}/?cast=receiver&room=${room}`;
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
        if (activePresentationConnections.size === 0 && activeWebRtcConnections.size === 0) {
          castBtn?.classList.remove('on', 'casting-live');
        }
      });

      conn.addEventListener('terminate', () => {
        activePresentationConnections.delete(conn);
        if (activePresentationConnections.size === 0 && activeWebRtcConnections.size === 0) {
          castBtn?.classList.remove('on', 'casting-live');
        }
      });

      conn.addEventListener('message', (event) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          handleIncomingMessage(data, 'presentation-controller');
        } catch (_) {}
      });

      setTimeout(() => broadcastFullState(), 200);
      openCastModal(true);
      return;
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
        console.debug('[CastSync] Presentation start:', err);
      }
    }
  }

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

  updateCastModalFields();
  modal.classList.add('vis');
}

function getTvDirectUrl() {
  const room = getOrCreateRoomCode();
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocal && localNetworkInfo?.localIp && localNetworkInfo.localIp !== 'localhost') {
    return `http://${localNetworkInfo.localIp}:${localNetworkInfo.port || '5173'}/?cast=receiver&room=${room}`;
  }
  
  const origin = window.location.origin.includes('localhost') ? DEFAULT_VERCEL_HOST : window.location.origin;
  return `${origin}/?cast=receiver&room=${room}`;
}

function updateCastModalFields() {
  const roomCode = getOrCreateRoomCode();
  const tvUrl = getTvDirectUrl();

  const codeEl = document.getElementById('castRoomCodeDisplay');
  if (codeEl) codeEl.textContent = roomCode;

  const urlInput = document.getElementById('castTvUrlInput');
  if (urlInput) urlInput.value = tvUrl;

  const qrImg = document.getElementById('castQrImage');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=00ff88&bgcolor=080f1a&data=${encodeURIComponent(tvUrl)}`;
  }

  updateModalStatusText();
}

function updateModalStatusText() {
  const statusText = document.getElementById('castStatusText');
  if (!statusText) return;

  const count = activeWebRtcConnections.size + activePresentationConnections.size;
  if (count > 0) {
    statusText.innerHTML = `<span class="cast-dot live"></span> LIVE SYNCHRONIZED // ${count} Display${count > 1 ? 's' : ''} Connected via WebRTC`;
  } else {
    statusText.innerHTML = '<span class="cast-dot ready"></span> Ready to Cast // WebRTC Cloud & Local Wi-Fi Active';
  }
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
        <span class="cast-dot ready"></span> Ready to Cast // WebRTC Cloud & Local Wi-Fi Active
      </div>

      <!-- Room Code & QR Header -->
      <div class="cast-room-banner">
        <div class="cast-room-info">
          <div class="cast-room-lbl">PRESENTATION ROOM CODE</div>
          <div class="cast-room-code-wrap">
            <span class="cast-room-code" id="castRoomCodeDisplay">KWB-1994</span>
            <button class="cast-room-btn" onclick="window.copyCastRoomCode()" title="Copy Room Code">COPY CODE</button>
            <button class="cast-room-btn alt" onclick="window.refreshCastRoom()" title="Generate New Room">↻ NEW</button>
          </div>
          <div class="cast-room-hint">Type this code on your TV or scan the QR code to connect instantly anywhere on Vercel or Wi-Fi.</div>
        </div>
        <div class="cast-qr-box">
          <img id="castQrImage" alt="Cast QR Code" src="" width="96" height="96" />
          <span class="cast-qr-lbl">SCAN WITH TV/PHONE</span>
        </div>
      </div>

      <div class="cast-modal-section">
        <div class="cast-section-label">OPTION 1: SMART TV BROWSER DIRECT URL (VERCEL / WEB / WI-FI)</div>
        <p class="cast-section-desc">Open your TV or second screen's web browser and navigate directly to this live link:</p>
        <div class="cast-url-box">
          <input type="text" id="castTvUrlInput" readonly value="" />
          <button class="cast-copy-btn" onclick="window.copyCastTvUrl()">COPY LINK</button>
        </div>
      </div>

      <div class="cast-modal-section">
        <div class="cast-section-label">OPTION 2: CHROMECAST / WIRELESS DISPLAY / AIRPLAY</div>
        <p class="cast-section-desc">Send this presentation to your Chromecast or Wireless display via native browser casting:</p>
        <div class="cast-btn-row">
          <button class="fbtn on" onclick="window.triggerBrowserCast()">▶ START WIRELESS CAST</button>
          <button class="fbtn" onclick="window.forceResyncCast()">⚡ FORCE RESYNC TV</button>
        </div>
      </div>

      <div class="cast-modal-options">
        <label class="cast-opt-label">
          <input type="checkbox" id="laserToggle" checked onchange="window.setLaserPointer(this.checked)" />
          <span>Show Presenter Laser Pointer dot on TV when moving mouse across laptop map</span>
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
 * Prompt receiver screen for room code if opened without ?room= parameter.
 */
function promptReceiverRoomCode() {
  if (typeof document === 'undefined') return;
  let prompt = document.getElementById('receiverRoomPrompt');
  if (prompt) return;

  prompt = document.createElement('div');
  prompt.id = 'receiverRoomPrompt';
  prompt.className = 'receiver-room-prompt';
  prompt.innerHTML = `
    <div class="rrp-box">
      <div class="rrp-title">KWIBUKA // TV PRESENTATION RECEIVER</div>
      <div class="rrp-subtitle">Enter the 6-character Presentation Room Code shown on your controller laptop:</div>
      <div class="rrp-input-row">
        <input type="text" id="rrpCodeInput" placeholder="e.g. KWB-7492" maxlength="12" autofocus />
        <button class="rrp-btn" id="rrpConnectBtn">CONNECT DISPLAY</button>
      </div>
      <div class="rrp-hint">Or open the direct URL from your laptop: <code>?cast=receiver&room=KWB-XXXX</code></div>
    </div>
  `;
  document.body.appendChild(prompt);

  const btn = document.getElementById('rrpConnectBtn');
  const input = document.getElementById('rrpCodeInput');

  const doConnect = () => {
    const code = input?.value?.trim();
    if (code) {
      connectWebRtcReceiver(code);
      const url = new URL(window.location.href);
      url.searchParams.set('room', code);
      window.history.replaceState({}, '', url.toString());
    }
  };

  btn?.addEventListener('click', doConnect);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doConnect();
  });
}

function hideReceiverRoomPrompt() {
  const prompt = document.getElementById('receiverRoomPrompt');
  if (prompt) prompt.remove();
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
  badge.className = 'receiver-live-badge';
  badge.innerHTML = `
    <span class="rl-dot"></span>
    <span class="rl-text">DISPLAY // CONNECTING...</span>
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

function updateReceiverBadgeStatus(isLive, customText = null) {
  if (typeof document === 'undefined') return;
  const badge = document.getElementById('receiverLiveBadge');
  if (badge) {
    badge.classList.toggle('live', isLive);
    const text = badge.querySelector('.rl-text');
    if (text) {
      if (customText) text.textContent = customText;
      else text.textContent = isLive ? 'LIVE PRESENTATION DISPLAY' : 'DISPLAY // CONNECTING...';
    }
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
