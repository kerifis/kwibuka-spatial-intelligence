/**
 * Google Maps satellite integration for CRT display mode.
 * Loaded lazily: API script is injected only on first CRT activation.
 */
import { getDistrictGeoJson } from './map.js';

const RWANDA = { lat: -1.9403, lng: 29.8739 };
const FALLBACK_API_KEY = 'AIzaSyAq0VFLLNrgLELewy9wzPt_CjpLhJrT740';
const rawKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const API_KEY = (rawKey && !rawKey.includes('your_google_maps_browser_key_here')) ? rawKey : FALLBACK_API_KEY;

const KIGALI = { lat: -1.9441, lng: 30.0619 };
const KIGALI_BOUNDS = { south: -2.12, west: 29.92, north: -1.78, east: 30.24 };
const HYBRID_ZOOM = 13;
const GM_MIN_ZOOM = 7;
const GM_MAX_ZOOM = 20;
const STREET_VIEW_MIN_ZOOM = 14;
const STREET_VIEW_RADIUS_METERS = 120;

let gmap = null;
let gmMarkers = [];
let gmDistrictOverlays = [];
let selectedDistrictName = '';
let apiPromise = null;
let streetViewService = null;
let streetPanorama = null;
let streetCandidate = null;
let streetCheckTimer = null;
let streetCheckSeq = 0;
let streetCoveragePending = false;
let visitMarker = null;
let visitSearchActive = false;
let activeMarkerState = { activeEvents: [], day: 0 };
let lastSearchQuery = '';
let lastSearchLat = null;
let lastSearchLng = null;

/**
 * Return a serializable snapshot of current Google Maps state.
 */
export function getGmState() {
  if (!gmap) return null;
  const center = gmap.getCenter();
  return {
    zoom: gmap.getZoom(),
    lat: center?.lat() ?? null,
    lng: center?.lng() ?? null,
    streetView: !!streetPanorama?.getVisible(),
    district: selectedDistrictName || null,
    searchQuery: lastSearchQuery || null,
    searchLat: lastSearchLat,
    searchLng: lastSearchLng,
  };
}

/**
 * Apply a previously-captured Google Maps state snapshot (for TV receiver sync).
 */
export async function applyGmState(s) {
  if (!s) return;
  // Ensure map is initialized first
  if (!gmap) {
    try {
      await initGoogleMap();
      showGoogleMap();
    } catch (_) { return; }
  }
  if (typeof s.lat === 'number' && typeof s.lng === 'number') {
    gmap.panTo({ lat: s.lat, lng: s.lng });
  }
  if (typeof s.zoom === 'number') {
    gmap.setZoom(clampGmZoom(s.zoom));
    syncGmZoomControl();
  }
  if (s.district) {
    applyDistrictHighlightToGoogleMap(s.district);
  }

  if (s.streetView && streetPanorama && !streetPanorama.getVisible()) {
    if (streetCandidate?.latLng) {
      // Candidate already available — enter street view immediately
      streetPanorama.setPosition(streetCandidate.latLng);
      streetPanorama.setVisible(true);
      syncStreetViewMode();
    } else if (streetViewService && typeof s.lat === 'number' && typeof s.lng === 'number') {
      // Receiver hasn't scouted this location yet — look up coverage at the
      // synced lat/lng and then enter street view if a panorama is found.
      const lookupLat = s.lat;
      const lookupLng = s.lng;
      streetViewService.getPanorama(
        {
          location: { lat: lookupLat, lng: lookupLng },
          radius: STREET_VIEW_RADIUS_METERS,
          preference: google.maps.StreetViewPreference.NEAREST,
          source: google.maps.StreetViewSource.DEFAULT,
        },
        (data, status) => {
          if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
            streetCandidate = {
              latLng: data.location.latLng,
              pano: data.location.pano,
              description: data.location.description || '',
            };
            if (streetPanorama && !streetPanorama.getVisible()) {
              streetPanorama.setPosition(streetCandidate.latLng);
              streetPanorama.setVisible(true);
              syncStreetViewMode();
            }
          }
        }
      );
    }
  } else if (!s.streetView && streetPanorama?.getVisible()) {
    streetPanorama.setVisible(false);
    syncStreetViewMode();
  }
}

function setStreetStatus(buttonText, noteText) {
  const shell = document.getElementById('gStreetShell');
  const btn = document.getElementById('gStreetBtn');
  const note = document.getElementById('gStreetNote');
  if (!shell || !btn || !note) return;

  shell.style.display = 'flex';
  btn.disabled = true;
  btn.classList.remove('active');
  btn.textContent = buttonText;
  note.textContent = noteText;
}

function setVisitStatus(message, busy = false, reveal = true) {
  visitSearchActive = reveal;
  const btn = document.getElementById('gVisitBtn');
  const note = document.getElementById('gVisitNote');
  if (btn) {
    btn.disabled = busy;
    btn.textContent = busy ? '...' : 'GO';
  }
  if (note) note.textContent = message;
  updateVisitUi();
  updateStreetUi();
}

function updateVisitUi() {
  const shell = document.getElementById('gVisitShell');
  const note = document.getElementById('gVisitNote');
  if (!shell) return;
  const mapVisible = !!gmap && document.getElementById('gMapContainer').style.display === 'block';
  const panoramaVisible = !!streetPanorama?.getVisible();
  shell.style.display = mapVisible && !panoramaVisible ? 'flex' : 'none';
  if (note) note.style.display = mapVisible && !panoramaVisible && visitSearchActive ? 'block' : 'none';
}

function syncStreetViewMode() {
  const panoramaVisible = !!streetPanorama?.getVisible();
  document.getElementById('mapWrap')?.classList.toggle(
    'street-view-active',
    panoramaVisible
  );
  setDistrictOverlaysVisible(!panoramaVisible && document.getElementById('gMapContainer')?.style.display === 'block');
  updateVisitUi();
}

function loadAPI() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve();
      return;
    }

    if (!API_KEY) {
      reject(new Error('Set VITE_GOOGLE_MAPS_API_KEY in .env to enable Google Maps Satellite View.'));
      return;
    }

    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      previousAuthFailure?.();
      showGoogleMapError(new Error('Invalid Google Maps API Key'));
    };

    window.__kwGmReady = resolve;
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geocoding&loading=async&callback=__kwGmReady`;
    s.async = true;
    s.onerror = () => reject(new Error('Google Maps API failed to load'));
    document.head.appendChild(s);
  });
  return apiPromise;
}

function formatCoord(lat, lng) {
  return (
    `${Math.abs(lat).toFixed(4)} ${lat < 0 ? 'S' : 'N'}, ` +
    `${Math.abs(lng).toFixed(4)} ${lng < 0 ? 'W' : 'E'}`
  );
}

function syncCoordDisplay(latLng) {
  if (!latLng) return;
  const el = document.getElementById('coordD');
  if (el) el.textContent = formatCoord(latLng.lat(), latLng.lng());
}

function clampGmZoom(value) {
  return Math.max(GM_MIN_ZOOM, Math.min(GM_MAX_ZOOM, Math.round(+value || GM_MIN_ZOOM)));
}

export function syncGmZoomControl() {
  if (!gmap) return;
  const zoom = clampGmZoom(gmap.getZoom());
  const slider = document.getElementById('zoomSlider');
  const val = document.getElementById('zoomVal');
  if (slider) {
    slider.min = String(GM_MIN_ZOOM);
    slider.max = String(GM_MAX_ZOOM);
    slider.step = '1';
    slider.value = String(zoom);
  }
  if (val) val.textContent = `Z${zoom}`;
  document.getElementById('mapWrap')?.classList.add('crt-zoom');
}

export function setGmZoom(value) {
  if (!gmap) return;
  gmap.setZoom(clampGmZoom(value));
  syncGmZoomControl();
}

export function zoomGmIn() {
  if (!gmap) return;
  setGmZoom((gmap.getZoom() || GM_MIN_ZOOM) + 1);
}

export function zoomGmOut() {
  if (!gmap) return;
  setGmZoom((gmap.getZoom() || GM_MIN_ZOOM) - 1);
}

function updateStreetUi() {
  const shell = document.getElementById('gStreetShell');
  const btn = document.getElementById('gStreetBtn');
  const note = document.getElementById('gStreetNote');
  if (!shell || !btn || !note) return;

  const mapVisible = document.getElementById('gMapContainer')?.style.display === 'block';
  if (!mapVisible) {
    shell.style.display = 'none';
    return;
  }

  const inPanorama = !!streetPanorama?.getVisible();
  if (inPanorama) {
    shell.style.display = 'flex';
    btn.disabled = false;
    btn.classList.add('active');
    btn.textContent = 'EXIT STREET VIEW';
    note.textContent = 'Interactive 360 panorama active';
    return;
  }

  const zoom = gmap?.getZoom() || 0;
  shell.style.display = 'flex';

  if (zoom < STREET_VIEW_MIN_ZOOM) {
    btn.disabled = true;
    btn.classList.remove('active');
    btn.textContent = 'STREET VIEW';
    note.textContent = `Zoom in closer (Z${zoom}/${STREET_VIEW_MIN_ZOOM}) to check Street View`;
    return;
  }

  if (streetCoveragePending) {
    btn.disabled = true;
    btn.classList.remove('active');
    btn.textContent = 'CHECKING...';
    note.textContent = 'Scanning for Google Street View coverage...';
    return;
  }

  if (streetCandidate) {
    btn.disabled = false;
    btn.classList.remove('active');
    btn.textContent = 'ENTER STREET VIEW';
    note.textContent = streetCandidate.description || 'Coverage available near viewport center';
    return;
  }

  btn.disabled = true;
  btn.classList.remove('active');
  btn.textContent = 'NO COVERAGE';
  note.textContent = 'No Street View coverage found at this location';
}

function scheduleStreetViewCheck() {
  if (!gmap || !streetViewService) return;
  clearTimeout(streetCheckTimer);
  streetCheckTimer = setTimeout(() => {
    const zoom = gmap.getZoom() || 0;
    if (zoom < STREET_VIEW_MIN_ZOOM) {
      streetCandidate = null;
      streetCoveragePending = false;
      updateStreetUi();
      return;
    }

    const center = gmap.getCenter();
    if (!center) return;

    const seq = ++streetCheckSeq;
    streetCoveragePending = true;
    updateStreetUi();

    streetViewService.getPanorama(
      {
        location: center,
        radius: STREET_VIEW_RADIUS_METERS,
        preference: google.maps.StreetViewPreference.NEAREST,
        source: google.maps.StreetViewSource.DEFAULT,
      },
      (data, status) => {
        if (seq !== streetCheckSeq) return;
        streetCoveragePending = false;
        if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
          streetCandidate = {
            latLng: data.location.latLng,
            pano: data.location.pano,
            description: data.location.description || 'Verified Kigali coverage',
          };
        } else {
          streetCandidate = null;
        }
        updateStreetUi();
      }
    );
  }, 350);
}

function createEventIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">` +
    `<circle cx="9" cy="9" r="7" fill="${color}" fill-opacity="0.35" stroke="${color}" stroke-width="2"/>` +
    `<circle cx="9" cy="9" r="3" fill="${color}"/>` +
    `</svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(18, 18),
    anchor: new google.maps.Point(9, 9),
  };
}

function createVisitIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">` +
    `<circle cx="13" cy="13" r="11" fill="#00ff88" fill-opacity="0.22" stroke="#00ff88" stroke-width="2"/>` +
    `<circle cx="13" cy="13" r="4" fill="#00ff88"/>` +
    `<line x1="13" y1="2" x2="13" y2="7" stroke="#00ff88" stroke-width="2"/>` +
    `<line x1="13" y1="19" x2="13" y2="24" stroke="#00ff88" stroke-width="2"/>` +
    `<line x1="2" y1="13" x2="7" y2="13" stroke="#00ff88" stroke-width="2"/>` +
    `<line x1="19" y1="13" x2="24" y2="13" stroke="#00ff88" stroke-width="2"/>` +
    `</svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(26, 26),
    anchor: new google.maps.Point(13, 13),
  };
}

function setDistrictOverlaysVisible(visible) {
  gmDistrictOverlays.forEach(item => {
    if (item.polygon) {
      item.polygon.setMap(visible ? gmap : null);
    }
  });
}

function initDistrictOverlays() {
  const geojson = getDistrictGeoJson();
  if (!geojson || !geojson.features || gmDistrictOverlays.length) return;

  geojson.features.forEach(feature => {
    const name = feature.properties?.name || '';
    const geometry = feature.geometry;
    if (!geometry) return;

    const paths = [];
    if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach(ring => {
        paths.push(ring.map(coord => ({ lat: coord[1], lng: coord[0] })));
      });
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(poly => {
        poly.forEach(ring => {
          paths.push(ring.map(coord => ({ lat: coord[1], lng: coord[0] })));
        });
      });
    }

    if (!paths.length) return;

    const polygon = new google.maps.Polygon({
      paths,
      strokeColor: '#ffb800',
      strokeOpacity: 0.28,
      strokeWeight: 1,
      fillColor: '#ffb800',
      fillOpacity: 0.03,
      clickable: true,
      map: gmap,
      zIndex: 2,
    });

    polygon.addListener('click', () => {
      window.focusDistrict?.(name);
    });

    polygon.addListener('mouseover', () => {
      if (selectedDistrictName !== name) {
        polygon.setOptions({
          strokeOpacity: 0.65,
          fillOpacity: 0.10,
        });
      }
    });

    polygon.addListener('mouseout', () => {
      if (selectedDistrictName !== name) {
        polygon.setOptions({
          strokeColor: '#ffb800',
          strokeOpacity: 0.28,
          strokeWeight: 1,
          fillColor: '#ffb800',
          fillOpacity: 0.03,
        });
      }
    });

    gmDistrictOverlays.push({ name, polygon });
  });
}

function applyDistrictHighlightToGoogleMap(name) {
  selectedDistrictName = name || '';
  gmDistrictOverlays.forEach(item => {
    const isTarget = item.name === selectedDistrictName;
    item.polygon?.setOptions({
      strokeColor: isTarget ? '#ff2244' : '#ffb800',
      strokeOpacity: isTarget ? 0.95 : 0.28,
      strokeWeight: isTarget ? 2.5 : 1,
      fillColor: isTarget ? '#ff2244' : '#ffb800',
      fillOpacity: isTarget ? 0.16 : 0.03,
      zIndex: isTarget ? 5 : 2,
    });
  });
}

export function focusGmDistrict(name, lat, lng) {
  if (!gmap) return;
  gmap.panTo({ lat, lng });
  gmap.setZoom(HYBRID_ZOOM);
  applyDistrictHighlightToGoogleMap(name);
  scheduleStreetViewCheck();
  syncGmZoomControl();
  window.__onGmChange?.('gmState', getGmState());
}

export function searchGmPlace(query) {
  if (!query || !query.trim()) {
    setVisitStatus('Type a location to search in Kigali');
    return;
  }

  const trimmed = query.trim();
  setVisitStatus(`Searching "${trimmed}"...`, true);

  const applySearchResult = (loc, name, address) => {
    if (!gmap) return;
    gmap.panTo(loc);
    gmap.setZoom(16);

    if (visitMarker) visitMarker.setMap(null);
    visitMarker = new google.maps.Marker({
      position: loc,
      map: gmap,
      icon: createVisitIcon(),
      title: name || trimmed,
      zIndex: 100,
    });

    // Track for state sync
    lastSearchQuery = trimmed;
    lastSearchLat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
    lastSearchLng = typeof loc.lng === 'function' ? loc.lng() : loc.lng;

    setVisitStatus(`${name || trimmed}${address ? ' — ' + address : ''}`, false);
    scheduleStreetViewCheck();
    syncGmZoomControl();
    window.__onGmChange?.('gmState', getGmState());
  };


  const tryGeocoder = () => {
    if (!google.maps?.Geocoder) {
      setVisitStatus(`No results found for "${trimmed}" in Kigali`, false);
      return;
    }
    const geocoder = new google.maps.Geocoder();
    const searchQuery = trimmed.toLowerCase().includes('rwanda') ? trimmed : `${trimmed}, Kigali, Rwanda`;
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const place = results[0];
        applySearchResult(place.geometry.location, place.formatted_address?.split(',')[0] || trimmed, place.formatted_address);
      } else {
        setVisitStatus(`No results found for "${trimmed}" in Kigali`, false);
      }
    });
  };

  const tryTextSearch = (service) => {
    service.textSearch(
      {
        query: `${trimmed}, Kigali, Rwanda`,
        location: new google.maps.LatLng(KIGALI.lat, KIGALI.lng),
        radius: 15000,
      },
      (textResults, textStatus) => {
        if (textStatus === google.maps.places.PlacesServiceStatus.OK && textResults?.[0]?.geometry?.location) {
          const place = textResults[0];
          applySearchResult(place.geometry.location, place.name || trimmed, place.formatted_address || 'Kigali, Rwanda');
        } else {
          tryGeocoder();
        }
      }
    );
  };

  if (!gmap || !window.google?.maps) {
    setVisitStatus('Google Maps engine not ready', false);
    return;
  }

  if (google.maps.places?.PlacesService) {
    const service = new google.maps.places.PlacesService(gmap);
    service.findPlaceFromQuery(
      {
        query: `${trimmed}, Kigali, Rwanda`,
        fields: ['name', 'geometry', 'formatted_address'],
        locationBias: new google.maps.LatLngBounds(
          new google.maps.LatLng(KIGALI_BOUNDS.south, KIGALI_BOUNDS.west),
          new google.maps.LatLng(KIGALI_BOUNDS.north, KIGALI_BOUNDS.east)
        ),
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.geometry?.location) {
          const place = results[0];
          applySearchResult(place.geometry.location, place.name || trimmed, place.formatted_address || 'Kigali, Rwanda');
        } else {
          tryTextSearch(service);
        }
      }
    );
  } else {
    tryGeocoder();
  }
}

export function toggleGmStreetView() {
  if (!streetPanorama || !gmap) return;
  const currentlyVisible = streetPanorama.getVisible();
  if (currentlyVisible) {
    streetPanorama.setVisible(false);
  } else if (streetCandidate?.latLng) {
    streetPanorama.setPosition(streetCandidate.latLng);
    streetPanorama.setVisible(true);
  }
  syncStreetViewMode();
  updateStreetUi();
  window.__onGmChange?.('gmState', getGmState());
}

export function updateGmMarkers(activeEvents, day) {
  activeMarkerState = { activeEvents, day };
  if (!gmap) return;

  gmMarkers.forEach(m => m.setMap(null));
  gmMarkers = [];

  activeEvents.forEach(ev => {
    const isTrigger = ev.type === 'trigger';
    const isRescue = ev.type === 'rescue';
    const color = isTrigger ? '#ffb800' : isRescue ? '#00ff88' : '#ff2244';

    const marker = new google.maps.Marker({
      position: { lat: ev.lat, lng: ev.lng },
      map: gmap,
      icon: createEventIcon(color),
      title: `${ev.title} (${ev.date})`,
      zIndex: 10,
    });

    marker.addListener('click', () => {
      window.__showEventById?.(ev.id);
    });

    gmMarkers.push(marker);
  });
}

export function showGoogleMap() {
  const container = document.getElementById('gMapContainer');
  if (container) container.style.display = 'block';
  updateVisitUi();
  updateStreetUi();
  syncGmZoomControl();
}

export function hideGoogleMap() {
  const container = document.getElementById('gMapContainer');
  if (container) container.style.display = 'none';
  const wrap = document.getElementById('mapWrap');
  wrap?.classList.remove('crt-zoom', 'street-view-active');
  const streetShell = document.getElementById('gStreetShell');
  if (streetShell) streetShell.style.display = 'none';
  const visitShell = document.getElementById('gVisitShell');
  if (visitShell) visitShell.style.display = 'none';
}

export function isGmReady() {
  return !!gmap;
}

export function showGoogleMapError(error) {
  const message = error?.message || 'Google Maps could not be loaded.';
  setStreetStatus('MAP UNAVAILABLE', message);
  const container = document.getElementById('gMapContainer');
  if (!container) return;
  container.style.display = 'block';
  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--amb); font-family:var(--mono); text-align:center; padding:20px; background:rgba(4,8,14,0.94); border:1px solid rgba(255,184,0,0.3);">
      <div style="font-size:14px; font-weight:700; margin-bottom:8px; color:var(--amb); letter-spacing:1px;">CRT SATELLITE MODE // GOOGLE MAPS KEY REQUIRED</div>
      <div style="font-size:11px; max-width:440px; line-height:1.6; color:var(--tx1); margin-bottom:14px;">
        To view Google Maps satellite imagery & 360 Street View in CRT mode, add a Google Maps JavaScript browser key to your <code style="color:var(--grn); background:rgba(0,0,0,0.5); padding:2px 6px; border-radius:2px;">.env</code> file:
        <div style="margin-top:6px; color:var(--grn); font-weight:600;">VITE_GOOGLE_MAPS_API_KEY=AIzaSy...</div>
      </div>
      <div style="display:flex; gap:8px;">
        <button onclick="window.setMode('std')" style="padding:6px 12px; background:var(--bg3); border:1px solid var(--bdr); color:var(--tx0); font-family:var(--mono); font-size:9px; cursor:pointer; border-radius:2px;">RETURN TO STANDARD</button>
        <button onclick="window.setMode('nvg')" style="padding:6px 12px; background:var(--bg3); border:1px solid var(--grn); color:var(--grn); font-family:var(--mono); font-size:9px; cursor:pointer; border-radius:2px;">NIGHT VISION (NVG)</button>
        <button onclick="window.setMode('flir')" style="padding:6px 12px; background:var(--bg3); border:1px solid var(--red); color:var(--red); font-family:var(--mono); font-size:9px; cursor:pointer; border-radius:2px;">THERMAL (FLIR)</button>
      </div>
    </div>
  `;
}

export async function initGoogleMap() {
  if (gmap) return gmap;

  await loadAPI();

  const container = document.getElementById('gMapContainer');
  if (!container) throw new Error('gMapContainer DOM element not found');

  gmap = new google.maps.Map(container, {
    center: RWANDA,
    zoom: GM_MIN_ZOOM,
    minZoom: GM_MIN_ZOOM,
    maxZoom: GM_MAX_ZOOM,
    mapTypeId: google.maps.MapTypeId.HYBRID,
    disableDefaultUI: true,
    zoomControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    backgroundColor: '#04080e',
    styles: [
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d0dce8' }],
      },
      {
        featureType: 'all',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#04080e' }, { weight: 3 }],
      },
    ],
  });

  streetViewService = new google.maps.StreetViewService();
  streetPanorama = gmap.getStreetView();
  streetPanorama.addListener('position_changed', () => {
    syncCoordDisplay(streetPanorama.getPosition());
  });
  // Single visible_changed listener: sync UI and broadcast to TV
  streetPanorama.addListener('visible_changed', () => {
    syncStreetViewMode();
    window.__onGmChange?.('gmState', getGmState());
  });

  gmap.addListener('center_changed', () => {
    syncCoordDisplay(gmap.getCenter());
    scheduleStreetViewCheck();
    // Debounce broadcast to avoid flooding on every pan pixel
    clearTimeout(gmap.__panBroadcastTimer);
    gmap.__panBroadcastTimer = setTimeout(() => {
      window.__onGmChange?.('gmState', getGmState());
    }, 120);
  });

  gmap.addListener('zoom_changed', () => {
    syncGmZoomControl();
    scheduleStreetViewCheck();
    window.__onGmChange?.('gmState', getGmState());
  });

  gmap.addListener('mousemove', e => {
    if (!streetPanorama?.getVisible()) {
      syncCoordDisplay(e.latLng);
    }
  });

  initDistrictOverlays();
  if (activeMarkerState.activeEvents?.length) {
    updateGmMarkers(activeMarkerState.activeEvents, activeMarkerState.day);
  }

  return gmap;
}
