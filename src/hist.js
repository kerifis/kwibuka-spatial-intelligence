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
  const view = document.getElementById('histView');
  if (!svg || !view) return;
  // Keep SVG visible so RPF layer renders over the historical map image
  svg.classList.toggle('hist-mode', histVisible);
  view.style.display = histVisible ? 'flex' : 'none';
  view.setAttribute('aria-hidden', histVisible ? 'false' : 'true');
  document.getElementById('mapWrap')?.classList.toggle('hist-active', histVisible);
}
