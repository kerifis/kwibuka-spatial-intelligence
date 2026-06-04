export let histVisible = false;

export function toggleHistLayer() {
  setHistLayerVisible(!histVisible);
  return histVisible;
}

export function hideHistLayer() {
  const wasVisible = histVisible;
  setHistLayerVisible(false);
  return wasVisible;
}

function setHistLayerVisible(visible) {
  histVisible = visible;
  const svg = document.getElementById('mSvg');
  if (!svg) return;
  svg.classList.toggle('hist-mode', histVisible);
  document.getElementById('mapWrap')?.classList.toggle('hist-active', histVisible);
  document.querySelectorAll('[data-m="hist"]').forEach(btn => btn.classList.toggle('on-h', histVisible));
}
