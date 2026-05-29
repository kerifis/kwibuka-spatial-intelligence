/**
 * Google Maps satellite integration for CRT display mode.
 * Loaded lazily — API script is injected only on first CRT activation.
 */

const RWANDA = { lat: -1.9403, lng: 29.8739 };
const API_KEY = 'AIzaSyAq0VFLLNrgLELewy9wzPt_CjpLhJrT740';

let gmap = null;
let gmMarkers = [];
let apiPromise = null;

function loadAPI() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    window.__kwGmReady = resolve;
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=__kwGmReady`;
    s.async = true;
    s.onerror = () => reject(new Error('Google Maps API failed to load'));
    document.head.appendChild(s);
  });
  return apiPromise;
}

export async function initGoogleMap() {
  await loadAPI();
  if (gmap) return;

  const container = document.getElementById('gMapContainer');
  gmap = new google.maps.Map(container, {
    center: RWANDA,
    zoom: 9,
    mapTypeId: 'satellite',
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    tilt: 0,
    keyboardShortcuts: false,
  });

  // Sync coordinate display with Google Maps mouse position
  gmap.addListener('mousemove', (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const el = document.getElementById('coordD');
    if (el) el.textContent =
      `${Math.abs(lat).toFixed(4)} ${lat < 0 ? 'S' : 'N'}, ` +
      `${Math.abs(lng).toFixed(4)} ${lng < 0 ? 'W' : 'E'}`;
  });
}

export function showGoogleMap() {
  document.getElementById('gMapContainer').style.display = 'block';
  document.getElementById('mSvg').style.display = 'none';
  // Trigger resize in case map container was hidden during init
  if (gmap) google.maps.event.trigger(gmap, 'resize');
}

export function hideGoogleMap() {
  document.getElementById('gMapContainer').style.display = 'none';
  document.getElementById('mSvg').style.display = '';
  clearGmMarkers();
}

function clearGmMarkers() {
  gmMarkers.forEach(m => m.setMap(null));
  gmMarkers = [];
}

export function updateGmMarkers(activeEvents, day) {
  if (!gmap || !activeEvents.length) { clearGmMarkers(); return; }
  clearGmMarkers();

  const maxLives = Math.max(...activeEvents.map(e => e.lives), 1);

  activeEvents.forEach(ev => {
    const age = day - ev.day;
    const fillOpacity = Math.max(0.18, 0.82 - age / 38);
    const scale = Math.max(5, Math.sqrt(ev.lives / maxLives) * 18);

    const m = new google.maps.Marker({
      position: { lat: ev.lat, lng: ev.lng },
      map: gmap,
      title: ev.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale,
        fillColor: '#ff2244',
        fillOpacity,
        strokeColor: '#ff4466',
        strokeOpacity: Math.min(1, fillOpacity + 0.25),
        strokeWeight: 1.5,
      },
    });
    gmMarkers.push(m);
  });
}

export function panGmTo(lat, lng) {
  if (!gmap) return;
  gmap.panTo({ lat, lng });
  if (gmap.getZoom() < 11) gmap.setZoom(11);
}

export function isGmReady() { return !!gmap; }
