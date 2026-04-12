/**
 * Filters module: display mode switching (STD, NVG, CRT, FLIR).
 * Manages scanline overlay, vignette, flicker, and color scheme changes.
 */

export let currentMode = 'std';

/**
 * Apply a display mode to the entire dashboard.
 * @param {string} mode - 'std', 'nvg', 'crt', or 'flir'
 * @param {Function} onUpdate - Callback to re-render the current view
 */
export function setMode(mode, onUpdate) {
  currentMode = mode;

  // Button states
  document.querySelectorAll('.fbtn').forEach(btn => {
    btn.classList.remove('on', 'on-a', 'on-r');
    if (btn.dataset.m === mode) {
      btn.classList.add(mode === 'crt' ? 'on-a' : mode === 'flir' ? 'on-r' : 'on');
    }
  });

  // Overlays
  document.getElementById('scanOv').classList.toggle('on', mode === 'nvg' || mode === 'crt');
  document.getElementById('vigOv').classList.toggle('on', mode !== 'std');
  document.getElementById('flkOv').classList.toggle('on', mode === 'crt');

  // Rwanda fill/stroke
  const rw = document.querySelector('.rw-fill');
  if (rw) {
    const fills = { nvg: 'rgba(0,255,136,.06)', crt: 'rgba(255,184,0,.04)', flir: 'rgba(255,34,68,.05)' };
    const strokes = { nvg: '#00ff88', crt: '#ffb800', flir: '#ff4444' };
    rw.style.fill = fills[mode] || '';
    rw.style.stroke = strokes[mode] || '';
  }

  // City labels
  const labelColors = { nvg: '#00ff88', crt: '#ffb800', flir: '#ff6644' };
  document.querySelectorAll('.city-lbl').forEach(c =>
    c.setAttribute('fill', labelColors[mode] || ''));

  // Province labels
  const provColors = { nvg: 'rgba(0,255,136,.15)', crt: 'rgba(255,184,0,.12)', flir: 'rgba(255,68,68,.12)' };
  document.querySelectorAll('.prov-lbl').forEach(c =>
    c.setAttribute('fill', provColors[mode] || ''));

  // Big counter color
  const bc = document.getElementById('bigCount');
  const counterColors = { nvg: 'var(--grn)', crt: 'var(--amb)', flir: 'var(--red)', std: 'var(--red)' };
  const shadows = { nvg: '0 0 40px rgba(0,255,136,.4)', crt: '0 0 40px rgba(255,184,0,.4)' };
  bc.style.color = counterColors[mode];
  bc.style.textShadow = shadows[mode] || '0 0 40px rgba(255,34,68,.4)';
  document.getElementById('rateVal').style.color = counterColors[mode];

  // Re-render
  if (onUpdate) onUpdate();
}
