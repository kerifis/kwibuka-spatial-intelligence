/**
 * Kwibuka Voice Controller — Google Gemini Multimodal Live API
 * Real-time bidirectional voice and tool-calling agent.
 */
import {
  DEFAULT_VOICE_TIER,
  VOICE_COST_LIMITS,
  createVoiceCostTracker,
  formatCostUsd,
  isKnownVoiceTier,
  normalizeCostLimits,
  resolveVoiceModel,
  serializeCostLimits,
} from './voiceCost.js';

const CONFIG_URL = '/api/gemini/config';
const GEMINI_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
const DEFAULT_MODEL = 'models/gemini-2.5-flash-native-audio-latest';
const MINI_MODEL = 'models/gemini-3.1-flash-live-preview';

const STATUS = {
  idle: 'OFF',
  connecting: 'CONNECTING',
  listening: 'LISTENING',
  executing: 'EXECUTING',
  error: 'ERROR',
};

const DISCONNECT_GRACE_MS = 6000;
const MICROPHONE_VISUALIZER_GATE = 0.10;
const ASSISTANT_VISUALIZER_GATE = 0.04;
const VOICE_TIER_STORAGE_KEY = 'kwibuka.voiceCost.tier';
const VOICE_LIMITS_STORAGE_KEY = 'kwibuka.voiceCost.limits';

/* ── Tool Declarations for Gemini ────────────────────────── */

export const GEMINI_FUNCTION_DECLARATIONS = [
  {
    name: 'set_timeline_day',
    description: 'Jump the Kwibuka 100-day timeline to a specific day between 0 (April 6, 1994) and 102 (July 15, 1994). Updates event markers, daily rate, cumulative death count (sigmoid model), and provincial stats.',
    parameters: {
      type: 'OBJECT',
      properties: {
        day: {
          type: 'NUMBER',
          description: 'Day number to jump to (0 to 102). Day 0 is April 6, Day 1 is April 7, Day 100 is July 15.',
        },
      },
      required: ['day'],
    },
  },
  {
    name: 'play_timeline',
    description: 'Play, pause, or resume the 100-day chronological timeline progression.',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          enum: ['play', 'pause', 'toggle'],
          description: 'Playback action: play, pause, or toggle.',
        },
      },
    },
  },
  {
    name: 'set_timeline_speed',
    description: 'Set timeline playback speed multiplier (0.5x, 1x, 2x, 4x, 8x).',
    parameters: {
      type: 'OBJECT',
      properties: {
        speed: {
          type: 'NUMBER',
          description: 'Playback speed multiplier (0.5, 1, 2, 4, 8).',
        },
      },
      required: ['speed'],
    },
  },
  {
    name: 'set_display_mode',
    description: 'Switch the visual display mode of the dashboard. Modes: std (Standard relief map), nvg (Night Vision / green phosphor HUD), crt (CRT / Google Maps satellite imagery), flir (Thermal FLIR / heat spectrum).',
    parameters: {
      type: 'OBJECT',
      properties: {
        mode: {
          type: 'STRING',
          enum: ['std', 'nvg', 'crt', 'flir'],
          description: 'Target display mode: std (Standard), nvg (Night Vision), crt (Satellite), flir (Thermal).',
        },
      },
      required: ['mode'],
    },
  },
  {
    name: 'zoom_map',
    description: 'Zoom the map in or out, or set an exact zoom scale level.',
    parameters: {
      type: 'OBJECT',
      properties: {
        direction: {
          type: 'STRING',
          enum: ['in', 'out'],
          description: 'Zoom in or out.',
        },
        level: {
          type: 'NUMBER',
          description: 'Optional explicit zoom level (e.g. 1.2 in vector map, or 10-18 in CRT satellite map).',
        },
      },
    },
  },
  {
    name: 'visit_kigali',
    description: 'Enter the Visit Kigali CRT satellite explorer to explore landmarks, memorials, and Street View in Kigali. Optionally searches for a specific location.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Optional place or landmark name to search in Kigali (e.g. "Kigali Genocide Memorial", "Hotel des Mille Collines", "Kigali Convention Centre", "Kimironko Market", "Nyamirambo").',
        },
      },
    },
  },
  {
    name: 'search_place',
    description: 'Search for a landmark, memorial, hotel, or location in Kigali within CRT satellite mode.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Name of the location or landmark to search.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'toggle_street_view',
    description: 'Enter or exit 360 interactive Google Street View panorama in CRT satellite mode.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'focus_district',
    description: 'Focus, zoom into, and highlight one of Rwanda\'s 30 administrative districts (e.g. Gasabo, Nyarugenge, Kicukiro, Bugesera, Huye, Rubavu, Musanze, Gicumbi, etc.).',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: {
          type: 'STRING',
          description: 'District name to focus (e.g. "Gasabo", "Bugesera", "Huye", "Kigali").',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'clear_district_highlight',
    description: 'Clear district focus highlight and reset map framing back to the full Rwanda overview.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'navigate_tab',
    description: 'Navigate to any tab, menu, or modal across the entire dashboard: 100 Voices testimonies, Podcast, Memory Keepers, Rwanda Tech, District Index, Historical Families panel, AI synthesis briefing, situation overview stats panel, or 3D Virtual Museum.',
    parameters: {
      type: 'OBJECT',
      properties: {
        tab: {
          type: 'STRING',
          enum: [
            'testimonies',
            'podcast',
            'memory_keepers',
            'rwanda_tech',
            'district_index',
            'hist_panel',
            'ai_synthesis',
            'overview_panel',
            'museum',
            'visit_kigali'
          ],
          description: 'Target tab or menu to open.',
        },
        room: {
          type: 'STRING',
          enum: ['origins', 'preparation', 'hundredDays', 'testimonies'],
          description: 'Optional room identifier if opening 3D Museum.',
        },
      },
      required: ['tab'],
    },
  },
  {
    name: 'close_modal',
    description: 'Close any active popup modal, dialog, or info panel (testimonies, AI synthesis, infocard, district index, 3D museum, or all).',
    parameters: {
      type: 'OBJECT',
      properties: {
        modal: {
          type: 'STRING',
          enum: ['testimonies', 'ai_synthesis', 'infocard', 'district_panel', 'museum', 'all'],
          description: 'Which modal to close (defaults to all).',
        },
      },
    },
  },
  {
    name: 'paginate_testimonies',
    description: 'Navigate to next or previous page in the 100 Voices survivor testimonies archive.',
    parameters: {
      type: 'OBJECT',
      properties: {
        direction: {
          type: 'STRING',
          enum: ['next', 'prev'],
          description: 'Direction to paginate.',
        },
      },
      required: ['direction'],
    },
  },
  {
    name: 'control_infocard',
    description: 'Control the event or memorial intelligence popup card: switch tabs (Overview, Testimony, Resources, Video) or open/close.',
    parameters: {
      type: 'OBJECT',
      properties: {
        tab: {
          type: 'STRING',
          enum: ['overview', 'testimony', 'resources', 'video'],
          description: 'Tab to switch to.',
        },
        action: {
          type: 'STRING',
          enum: ['close', 'switch_tab', 'open'],
          description: 'Card action.',
        },
        eventId: {
          type: 'STRING',
          description: 'Event ID to open.',
        },
      },
    },
  },
  {
    name: 'control_audio',
    description: 'Control the background AUX song playback or adjust volume.',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          enum: ['play', 'pause', 'toggle', 'volume'],
          description: 'Audio action.',
        },
        volume: {
          type: 'NUMBER',
          description: 'Volume level from 0 to 100 (or 0.0 to 1.0).',
        },
      },
    },
  },
  {
    name: 'control_museum',
    description: 'Control the 3D virtual memorial museum: open, close, enter specific room (origins, preparation, hundredDays, testimonies), rotate, or reset view.',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          enum: ['open', 'close', 'rotate', 'reset'],
          description: 'Museum action.',
        },
        room: {
          type: 'STRING',
          enum: ['origins', 'preparation', 'hundredDays', 'testimonies'],
          description: 'Room name.',
        },
        delta: {
          type: 'NUMBER',
          description: 'Rotation angle delta.',
        },
      },
    },
  },
  {
    name: 'toggle_layer',
    description: 'Toggle any visual overlay layer on or off: memorials (133 mass grave / memorial sites), rpf (advance routes), hist (historical cohorts), death_count (provincial casualties), districts (district panel), panel (stats sidebar).',
    parameters: {
      type: 'OBJECT',
      properties: {
        layer: {
          type: 'STRING',
          enum: ['memorials', 'rpf', 'hist', 'death_count', 'districts', 'panel'],
          description: 'Layer to toggle.',
        },
      },
      required: ['layer'],
    },
  },
  {
    name: 'cast_to_tv',
    description: 'Initiate Presentation API cast to TV or external display.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'get_current_state',
    description: 'Read the current dashboard state including timeline day, date, phase, death toll estimates, active events, and active layers.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
];

/* ── localStorage helpers ─────────────────────────────────── */

function voiceStorage(storage) {
  if (storage) return storage;
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readStoredVoiceTier(storage) {
  try {
    const raw = voiceStorage(storage)?.getItem(VOICE_TIER_STORAGE_KEY);
    return isKnownVoiceTier(raw) ? resolveVoiceModel(raw).tier : DEFAULT_VOICE_TIER;
  } catch {
    return DEFAULT_VOICE_TIER;
  }
}

export function writeStoredVoiceTier(tier, storage) {
  const resolved = resolveVoiceModel(tier).tier;
  try {
    voiceStorage(storage)?.setItem(VOICE_TIER_STORAGE_KEY, resolved);
  } catch { /* best effort */ }
  return resolved;
}

export function readStoredVoiceLimits(storage) {
  try {
    const raw = voiceStorage(storage)?.getItem(VOICE_LIMITS_STORAGE_KEY);
    if (!raw) return normalizeCostLimits(null);
    return normalizeCostLimits(JSON.parse(raw));
  } catch {
    return normalizeCostLimits(null);
  }
}

export function writeStoredVoiceLimits(limits, storage) {
  const normalized = normalizeCostLimits(limits);
  try {
    voiceStorage(storage)?.setItem(
      VOICE_LIMITS_STORAGE_KEY,
      JSON.stringify(serializeCostLimits(normalized))
    );
  } catch { /* best effort */ }
  return normalized;
}

/* ── Push-to-talk helpers ─────────────────────────────────── */

function isPushToTalkKey(event) {
  return event.code === 'Space' || event.key === ' ';
}

function shouldHandlePushToTalkKeyDown(event) {
  if (!isPushToTalkKey(event)) return false;
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return false;
  const tag = event.target?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;
  if (event.target?.isContentEditable) return false;
  return true;
}

function shouldIgnoreVoiceButtonClick(spaceKeyHeld) {
  return Boolean(spaceKeyHeld);
}

/* ── Audio Encoding Helpers ───────────────────────────────── */

function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

function base64FromArrayBuffer(arrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function pcm24kToFloat32(base64Data) {
  const binary = atob(base64Data);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

function downsampleBuffer(buffer, inputSampleRate, outputSampleRate = 16000) {
  if (inputSampleRate === outputSampleRate) return buffer;
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

/* ── Visualizer helpers ───────────────────────────────────── */

function gateLevel(normalized, gate) {
  return normalized < gate ? 0 : (normalized - gate) / (1 - gate);
}

function resetVisualizerBars(bars) {
  if (!bars) return;
  const list = bars instanceof NodeList ? Array.from(bars) : (Array.isArray(bars) ? bars : []);
  list.forEach((bar) => {
    bar.style.setProperty('--audio-level', '5px');
    bar.style.setProperty('--audio-opacity', '0.5');
  });
}

/* ── UI creation ──────────────────────────────────── */

function createVoiceControl({ reset = false } = {}) {
  let root = document.getElementById('kwibuka-voice-control');
  if (root && reset) {
    root.remove();
    root = null;
  }
  if (!root) {
    root = document.createElement('div');
    root.id = 'kwibuka-voice-control';
    root.dataset.status = 'idle';
    root.dataset.speaker = 'idle';
    root.innerHTML = `
      <div class="kv-heading">
        <div class="kv-kicker">GOOGLE AI VOICE</div>
        <div id="kv-status">OFF</div>
        <div class="kv-cost">
          <button id="kv-tier" class="kv-tier-btn" type="button" aria-pressed="false" title="Voice Model — Gemini Live">GEMINI</button>
          <span id="kv-cost-value" class="kv-cost-value" data-level="ok" title="Estimated session cost">~$0.00</span>
        </div>
      </div>
      <button id="kv-button" type="button" aria-label="Voice control — hold Space to speak; click to toggle voice">
        <span class="kv-mic-orbit"><img src="/mic.svg" alt="" /></span>
        <span class="kv-mic-label">ON/OFF</span>
      </button>
      <div class="kv-visualizer" aria-hidden="true">
        ${Array.from({ length: 15 }, (_, i) => `<span style="--bar:${i}"></span>`).join('')}
      </div>
      <div class="kv-readout">
        <div id="kv-detail">VOICE STANDBY</div>
      </div>
      <div class="kv-error-tray" role="alert" aria-live="assertive">
        <div class="kv-error-header">
          <span>VOICE SYSTEM ERROR</span>
          <button class="kv-error-dismiss" type="button">DISMISS</button>
        </div>
        <div id="kv-error-detail"></div>
        <div class="kv-error-hint">Check microphone permission and Gemini API key in .env.</div>
      </div>
    `;
    const hdr = document.querySelector('.hdr');
    if (hdr) {
      hdr.appendChild(root);
    } else {
      document.body.appendChild(root);
    }
    root.querySelector('.kv-error-dismiss')?.addEventListener('click', () => {
      root.classList.add('error-dismissed');
    });
  }
  return {
    root,
    button: root.querySelector('#kv-button'),
    buttonLabel: root.querySelector('.kv-mic-label'),
    status: root.querySelector('#kv-status'),
    detail: root.querySelector('#kv-detail'),
    errorDetail: root.querySelector('#kv-error-detail'),
    tierButton: root.querySelector('#kv-tier'),
    costValue: root.querySelector('#kv-cost-value'),
  };
}

/* ── Main Gemini Voice Controller Class ───────────────────── */

export class KwibukVoiceController {
  constructor({ runner, ui, duckAudio = null }) {
    this.runner = runner;
    this.ui = ui;
    this.duckAudio = duckAudio;
    this.audioDucked = false;

    this.ws = null;
    this.mediaStream = null;
    this.audioInputContext = null;
    this.audioOutputContext = null;
    this.audioProcessorNode = null;
    this.nextAudioStartTime = 0;
    this.activeAudioSources = new Set();

    this.visualizerAnalyser = null;
    this.visualizerOutputAnalyser = null;
    this.visualizerFrame = null;
    this.visualizerSpeaker = 'idle';

    this.buttonHandler = null;
    this.tierHandler = null;
    this.voiceTier = readStoredVoiceTier();
    this.voiceLimits = readStoredVoiceLimits();
    this.costTracker = createVoiceCostTracker({
      tier: this.voiceTier,
      limits: this.voiceLimits,
    });
    this.pushToTalkMode = false;
    this.pushToTalkKeyHeld = false;
    this.spaceKeyHeld = false;
    this.shortcutKeyDownHandler = null;
    this.shortcutKeyUpHandler = null;
    this.shortcutBlurHandler = null;
    this.shortcutVisibilityHandler = null;
    this.status = 'idle';
    this.startEpoch = 0;
    this.apiKey = null;
  }

  isActive() {
    return this.status !== 'idle' && this.status !== 'error';
  }

  duckAudioForVoice() {
    if (this.audioDucked) return;
    this.audioDucked = true;
    this.duckAudio?.(true);
  }

  restoreAudio() {
    if (!this.audioDucked) return;
    this.audioDucked = false;
    this.duckAudio?.(false);
  }

  /* ── Session Lifecycle ──────────────────────────────────── */

  async fetchApiKey() {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
    if (envKey) return envKey;
    try {
      const res = await fetch(CONFIG_URL);
      if (res.ok) {
        const data = await res.json();
        if (data.key) return data.key;
      }
    } catch { /* fallback to localStorage */ }
    return localStorage.getItem('GEMINI_API_KEY') || localStorage.getItem('GOOGLE_API_KEY') || null;
  }

  async start({ pushToTalk = false } = {}) {
    if (this.isActive()) return;
    this.duckAudioForVoice();
    const pushToTalkKeyHeld = pushToTalk && this.pushToTalkKeyHeld;
    const spaceKeyHeld = this.spaceKeyHeld;
    this.stop({ preserveStatus: true });
    this.pushToTalkMode = pushToTalk;
    this.pushToTalkKeyHeld = pushToTalkKeyHeld;
    this.spaceKeyHeld = spaceKeyHeld;

    const epoch = ++this.startEpoch;
    this.setStatus('connecting', 'Connecting to Google Gemini');

    try {
      this.apiKey = await this.fetchApiKey();
      if (!this.apiKey) {
        throw new Error('GEMINI_API_KEY is not set. Add it to .env or localStorage to enable Gemini Voice.');
      }

      // Initialize Mic Capture
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      if (epoch !== this.startEpoch) {
        this.stop();
        return;
      }

      // Initialize Output AudioContext for Gemini audio stream (24000Hz)
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioOutputContext = new AudioCtx({ sampleRate: 24000 });
      this.nextAudioStartTime = this.audioOutputContext.currentTime;
      this.visualizerOutputAnalyser = this.audioOutputContext.createAnalyser();
      this.visualizerOutputAnalyser.fftSize = 64;
      this.visualizerOutputAnalyser.smoothingTimeConstant = 0.72;

      // Start Visualizer Loop
      this.startVisualizerLoop();

      // Connect WebSocket to Gemini Live API
      const wsUrl = `${GEMINI_WS_URL}?key=${encodeURIComponent(this.apiKey)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (epoch !== this.startEpoch) return;
        try {
          this.sendSetupMessage();
          this.startMicStreaming();
          const detail = this.pushToTalkMode
            ? (this.pushToTalkKeyHeld ? 'Release Space to send' : 'Hold Space to talk')
            : 'Ask or command';
          this.setStatus('listening', detail);
        } catch (e) {
          console.error('[Gemini Voice Init Error]', e);
          this.reportError('Gemini Voice Init', e);
        }
      };

      this.ws.onmessage = async (event) => {
        if (epoch !== this.startEpoch) return;
        await this.handleGeminiMessage(event.data);
      };

      this.ws.onerror = (err) => {
        console.error('[Gemini Voice WebSocket Error]', err);
        if (epoch === this.startEpoch) {
          this.reportError('Google Gemini Live API', new Error('Connection error. Check API key.'));
        }
      };

      this.ws.onclose = (ev) => {
        console.log('[Gemini Voice WebSocket Closed]', ev.code, ev.reason);
        if (epoch === this.startEpoch && this.status !== 'idle' && this.status !== 'error') {
          this.setStatus('idle', 'Voice off');
          this.stop();
        }
      };

    } catch (error) {
      if (epoch === this.startEpoch) {
        this.stop({ preserveStatus: true });
        this.reportError('Gemini Voice', error);
      }
    }
  }

  sendSetupMessage() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const model = this.voiceTier === 'mini' ? MINI_MODEL : DEFAULT_MODEL;
    const voiceName = this.voiceTier === 'mini' ? 'Aoede' : 'Puck';

    const setupPayload = {
      setup: {
        model,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
        },
        systemInstruction: {
          parts: [
            {
              text: [
                'You are the AI Voice Guide for KWIBUKA Spatial Intelligence, a digital memorial and geospatial intelligence dashboard documenting the 1994 Genocide against the Tutsi in Rwanda.',
                'Maintain a respectful, dignified, and historically accurate tone at all times. Treat the memory of the victims and survivors with the utmost reverence.',
                'You have comprehensive hands-free voice control over every feature, menu, tab, and layer in the dashboard:',
                '1. TIMELINE & PLAYBACK: set_timeline_day (day 0 to 102), play_timeline (play/pause), set_timeline_speed (0.5x, 1x, 2x, 4x, 8x).',
                '2. DISPLAY MODES: set_display_mode (Standard "std", Night Vision "nvg", CRT Satellite "crt", Thermal "flir").',
                '3. MAP ZOOM: zoom_map (zoom in, zoom out, or set zoom level).',
                '4. VISIT KIGALI & CRT SEARCH: visit_kigali (opens satellite explorer) and search_place (searches Kigali landmarks, memorials, hotels in CRT mode), toggle_street_view (360 Google Street View panorama).',
                '5. DISTRICTS: focus_district (focuses on any of Rwanda\'s 30 districts with heatmap pulse) and clear_district_highlight.',
                '6. TABS & MENUS: navigate_tab (opens testimonies / 100 Voices, podcast, memory keepers, rwanda tech, district index, historical families panel, AI synthesis briefing, stats overview panel, or 3D virtual museum with rooms origins/preparation/hundredDays/testimonies).',
                '7. MODAL CONTROLS: close_modal (closes active popups), paginate_testimonies (next/previous page), control_infocard (switches card tabs: overview, testimony, resources, video).',
                '8. AUDIO & MEDIA: control_audio (plays, pauses, sets volume on the background AUX song).',
                '9. LAYERS: toggle_layer (memorials, rpf, hist, death_count, districts, panel), cast_to_tv.',
                'Direct control requests should immediately trigger the corresponding function calls.',
                'When users ask historical questions about the 1994 genocide, the 100 days, specific memorial sites (Kigali Memorial Center, Bisesero, Ntarama, Nyamata, Murambi, Nyarubuye), RPF rescue operations, or statistical data, answer knowledgeably, concisely, and with historical fidelity.',
                'After executing a tool call, give a brief, natural confirmation (e.g. "Zoomed in", "Searching Kigali for Hotel des Mille Collines", "Opened 100 Voices archive", "Display mode set to Night Vision", "Focusing on Bugesera").',
              ].join('\n'),
            },
          ],
        },
        tools: [
          {
            functionDeclarations: GEMINI_FUNCTION_DECLARATIONS,
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(setupPayload));
  }

  startMicStreaming() {
    if (!this.mediaStream) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.audioInputContext = new AudioCtx();
    const source = this.audioInputContext.createMediaStreamSource(this.mediaStream);
    const sampleRate = this.audioInputContext.sampleRate;

    // Create Mic Visualizer Analyser inside the SAME audioInputContext
    this.visualizerAnalyser = this.audioInputContext.createAnalyser();
    this.visualizerAnalyser.fftSize = 64;
    this.visualizerAnalyser.smoothingTimeConstant = 0.72;
    source.connect(this.visualizerAnalyser);

    // ScriptProcessor for PCM audio chunking
    const processor = this.audioInputContext.createScriptProcessor(2048, 1, 1);
    this.audioProcessorNode = processor;

    processor.onaudioprocess = (e) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      if (this.pushToTalkMode && !this.pushToTalkKeyHeld) return;

      const inputBuffer = e.inputBuffer.getChannelData(0);
      const downsampled = downsampleBuffer(inputBuffer, sampleRate, 16000);
      const pcm16 = floatTo16BitPCM(downsampled);
      const base64Audio = base64FromArrayBuffer(pcm16);

      const chunk = {
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio,
            },
          ],
        },
      };

      try {
        this.ws.send(JSON.stringify(chunk));
        this.visualizerSpeaker = 'user';
        if (this.ui?.root) this.ui.root.dataset.speaker = 'user';
      } catch { /* no-op */ }
    };

    source.connect(processor);
    processor.connect(this.audioInputContext.destination);
  }

  /* ── Incoming Gemini Messages & Audio Playback ──────────── */

  async handleGeminiMessage(data) {
    let msg;
    if (data instanceof Blob) {
      const text = await data.text();
      try { msg = JSON.parse(text); } catch { return; }
    } else if (typeof data === 'string') {
      try { msg = JSON.parse(data); } catch { return; }
    } else {
      return;
    }

    if (msg.setupComplete) {
      console.log('[Gemini Live Session Ready]');
      return;
    }

    // Handle incoming audio chunk from Gemini
    if (msg.serverContent?.modelTurn?.parts) {
      for (const part of msg.serverContent.modelTurn.parts) {
        if (part.inlineData?.data) {
          this.playAudioChunk(part.inlineData.data);
        }
      }
    }

    // Handle Turn Complete / Interrupted
    if (msg.serverContent?.turnComplete) {
      this.visualizerSpeaker = 'idle';
      if (this.ui?.root) this.ui.root.dataset.speaker = 'idle';
    }

    if (msg.serverContent?.interrupted) {
      this.clearAudioQueue();
      this.visualizerSpeaker = 'idle';
      if (this.ui?.root) this.ui.root.dataset.speaker = 'idle';
    }

    // Handle Tool Calls (Function Calls from Gemini)
    if (msg.toolCall?.functionCalls) {
      for (const call of msg.toolCall.functionCalls) {
        await this.handleToolCall(call);
      }
    }
  }

  playAudioChunk(base64Pcm24k) {
    if (!this.audioOutputContext) return;
    try {
      const float32 = pcm24kToFloat32(base64Pcm24k);
      const audioBuffer = this.audioOutputContext.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const source = this.audioOutputContext.createBufferSource();
      source.buffer = audioBuffer;

      // Connect to output visualizer
      if (this.visualizerOutputAnalyser) {
        source.connect(this.visualizerOutputAnalyser);
      }
      source.connect(this.audioOutputContext.destination);

      const now = this.audioOutputContext.currentTime;
      const startTime = Math.max(now, this.nextAudioStartTime);
      source.start(startTime);
      this.nextAudioStartTime = startTime + audioBuffer.duration;

      this.activeAudioSources.add(source);
      source.onended = () => {
        this.activeAudioSources.delete(source);
      };

      this.visualizerSpeaker = 'ai';
      if (this.ui?.root) this.ui.root.dataset.speaker = 'ai';
    } catch (e) {
      console.warn('[Gemini Audio Decode Error]', e);
    }
  }

  clearAudioQueue() {
    for (const src of this.activeAudioSources) {
      try { src.stop(); } catch { /* no-op */ }
    }
    this.activeAudioSources.clear();
    if (this.audioOutputContext) {
      this.nextAudioStartTime = this.audioOutputContext.currentTime;
    }
  }

  async handleToolCall(call) {
    const name = call.name;
    const args = call.args || {};
    this.setStatus('executing', name.replace(/_/g, ' '));

    let result;
    try {
      result = await this.runner(name, args);
    } catch (e) {
      result = { ok: false, error: e?.message || 'Tool execution failed' };
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const responsePayload = {
        toolResponse: {
          functionResponses: [
            {
              id: call.id,
              name: call.name,
              response: { result },
            },
          ],
        },
      };
      this.ws.send(JSON.stringify(responsePayload));
    }

    if (this.status === 'executing') {
      this.setStatus('listening', this.pushToTalkMode
        ? (this.pushToTalkKeyHeld ? 'Release Space to send' : 'Hold Space to talk')
        : 'Ask or command');
    }
  }

  /* ── Visualizer Setup ───────────────────────────────────── */

  startVisualizerLoop() {
    const bars = Array.from(this.ui.root.querySelectorAll('.kv-visualizer span'));
    if (!bars.length) return;

    const micData = new Uint8Array(32);
    const outData = new Uint8Array(32);

    const render = () => {
      let isAi = this.visualizerSpeaker === 'ai';
      let analyser = isAi ? this.visualizerOutputAnalyser : this.visualizerAnalyser;
      let data = isAi ? outData : micData;

      if (analyser && data) {
        analyser.getByteFrequencyData(data);
        const binCount = data.length;
        bars.forEach((bar, index) => {
          const start = Math.floor((index / bars.length) * binCount);
          const end = Math.max(start + 1, Math.floor(((index + 1) / bars.length) * binCount));
          let energy = 0;
          for (let bin = start; bin < end; bin++) energy += data[bin];
          const normalized = Math.min(1, (energy / (end - start)) / 190);
          const gate = isAi ? ASSISTANT_VISUALIZER_GATE : MICROPHONE_VISUALIZER_GATE;
          const shaped = Math.pow(gateLevel(normalized, gate), 0.72);
          bar.style.setProperty('--audio-level', `${Math.round(5 + shaped * 29)}px`);
          bar.style.setProperty('--audio-opacity', `${(0.5 + shaped * 0.5).toFixed(2)}`);
        });
      } else {
        resetVisualizerBars(bars);
      }

      this.visualizerFrame = requestAnimationFrame(render);
    };

    render();
  }

  stopVisualizer() {
    if (this.visualizerFrame) cancelAnimationFrame(this.visualizerFrame);
    this.visualizerFrame = null;
    this.visualizerAnalyser = null;
    this.visualizerOutputAnalyser = null;
    resetVisualizerBars(this.ui?.root?.querySelectorAll('.kv-visualizer span'));
  }

  /* ── Stop & Cleanup ─────────────────────────────────────── */

  stop(options = {}) {
    const { removeUi = false, preserveStatus = false } = options;
    this.startEpoch++;
    this.clearAudioQueue();
    this.stopVisualizer();

    if (this.ws) {
      try { this.ws.close(); } catch { /* no-op */ }
      this.ws = null;
    }

    if (this.audioProcessorNode) {
      try { this.audioProcessorNode.disconnect(); } catch { /* no-op */ }
      this.audioProcessorNode = null;
    }

    if (this.audioInputContext) {
      try { this.audioInputContext.close(); } catch { /* no-op */ }
      this.audioInputContext = null;
    }

    if (this.audioOutputContext) {
      try { this.audioOutputContext.close(); } catch { /* no-op */ }
      this.audioOutputContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.pushToTalkMode = false;
    this.pushToTalkKeyHeld = false;
    this.spaceKeyHeld = false;

    if (this.ui?.root) {
      delete this.ui.root.dataset.pushToTalk;
      delete this.ui.root.dataset.microphone;
      delete this.ui.root.dataset.speaker;
    }

    if (removeUi && this.ui?.button && this.buttonHandler) {
      this.ui.button.removeEventListener('click', this.buttonHandler);
      this.buttonHandler = null;
    }

    if (removeUi && this.ui?.tierButton && this.tierHandler) {
      this.ui.tierButton.removeEventListener('click', this.tierHandler);
      this.tierHandler = null;
    }

    if (removeUi) {
      if (this.shortcutKeyDownHandler) document.removeEventListener('keydown', this.shortcutKeyDownHandler);
      if (this.shortcutKeyUpHandler) document.removeEventListener('keyup', this.shortcutKeyUpHandler);
      if (this.shortcutBlurHandler) window.removeEventListener('blur', this.shortcutBlurHandler);
      if (this.shortcutVisibilityHandler) {
        document.removeEventListener('visibilitychange', this.shortcutVisibilityHandler);
      }
      this.shortcutKeyDownHandler = null;
      this.shortcutKeyUpHandler = null;
      this.shortcutBlurHandler = null;
      this.shortcutVisibilityHandler = null;
      this.ui?.root?.remove();
    }

    if (!preserveStatus && !removeUi) {
      this.setStatus('idle', 'Voice off');
    }

    this.restoreAudio();
  }

  /* ── Push-to-Talk ───────────────────────────────────────── */

  bindPushToTalkShortcut() {
    if (this.shortcutKeyDownHandler) return;
    this.shortcutKeyDownHandler = (event) => {
      if (!shouldHandlePushToTalkKeyDown(event)) return;
      if (event.repeat) {
        if (this.spaceKeyHeld) event.preventDefault();
        return;
      }
      this.spaceKeyHeld = true;
      event.preventDefault();
      this.duckAudioForVoice();
      if (this.pushToTalkKeyHeld) return;
      if (this.isActive() && !this.pushToTalkMode) return;
      this.pushToTalkKeyHeld = true;
      this.ui.root.dataset.pushToTalk = 'held';
      if (this.isActive()) {
        if (this.status === 'listening') this.setStatus('listening', 'Release Space to send');
      } else {
        this.start({ pushToTalk: true });
      }
    };
    this.shortcutKeyUpHandler = (event) => {
      if (!isPushToTalkKey(event)) return;
      const wasHoldingSpace = this.spaceKeyHeld;
      this.spaceKeyHeld = false;
      if (!this.pushToTalkKeyHeld) {
        if (wasHoldingSpace) event.preventDefault();
        return;
      }
      event.preventDefault();
      this.releasePushToTalkKey();
    };
    this.shortcutBlurHandler = () => {
      this.spaceKeyHeld = false;
      this.releasePushToTalkKey();
    };
    this.shortcutVisibilityHandler = () => {
      if (document.visibilityState === 'hidden') this.shortcutBlurHandler();
    };
    document.addEventListener('keydown', this.shortcutKeyDownHandler);
    document.addEventListener('keyup', this.shortcutKeyUpHandler);
    window.addEventListener('blur', this.shortcutBlurHandler);
    document.addEventListener('visibilitychange', this.shortcutVisibilityHandler);
  }

  releasePushToTalkKey() {
    if (!this.pushToTalkKeyHeld) return;
    this.pushToTalkKeyHeld = false;
    delete this.ui.root.dataset.pushToTalk;
    if (!this.pushToTalkMode) return;
    if (this.status === 'listening') this.setStatus('listening', 'Hold Space to talk');
    else this.updateVoiceButtonLabel();
  }

  /* ── UI Status Updates ──────────────────────────────────── */

  setStatus(status, detail) {
    this.status = status;
    if (this.ui?.root) {
      this.ui.root.dataset.status = status;
      this.ui.root.classList.remove('error-dismissed');
    }
    if (this.ui?.status) this.ui.status.textContent = STATUS[status] || status.toUpperCase();
    if (this.ui?.detail && detail) this.ui.detail.textContent = detail;
    this.updateVoiceButtonLabel();
  }

  updateVoiceButtonLabel() {
    if (!this.ui?.buttonLabel) return;
    this.ui.buttonLabel.textContent = this.isActive() ? 'STOP' : 'ON/OFF';
  }

  reportError(source, error) {
    const message = error?.message || String(error || source || 'Unknown error');
    console.error(`[Google Voice] ${source}:`, message);
    this.setStatus('error', message);
    if (this.ui?.errorDetail) this.ui.errorDetail.textContent = message;
  }

  syncCostUi() {
    const state = this.costTracker.state();
    if (this.ui?.costValue) {
      this.ui.costValue.textContent = state.display;
    }
    if (this.ui?.tierButton) {
      this.ui.tierButton.textContent = this.voiceTier === 'mini' ? 'AOEDE' : 'PUCK';
    }
  }

  toggleVoiceTier() {
    const next = this.voiceTier === 'standard' ? 'mini' : 'standard';
    this.voiceTier = writeStoredVoiceTier(next);
    this.syncCostUi();
  }
}

/* ── Init Entry Point ─────────────────────────────────────── */

export function initKwibukVoice({ runner, duckAudio = null }) {
  if (window.__kwibukVoice && typeof window.__kwibukVoice.stop === 'function') {
    window.__kwibukVoice.stop({ removeUi: true });
  }
  const ui = createVoiceControl({ reset: true });
  const controller = new KwibukVoiceController({ runner, ui, duckAudio });
  controller.buttonHandler = () => {
    if (shouldIgnoreVoiceButtonClick(controller.spaceKeyHeld)) return;
    if (controller.isActive()) controller.stop();
    else controller.start({ pushToTalk: false });
  };
  ui.button.addEventListener('click', controller.buttonHandler);
  if (ui.tierButton) {
    controller.tierHandler = () => controller.toggleVoiceTier();
    ui.tierButton.addEventListener('click', controller.tierHandler);
  }
  controller.syncCostUi();
  controller.bindPushToTalkShortcut();
  window.__kwibukVoice = controller;
  return controller;
}
