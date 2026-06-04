/**
 * Google Maps satellite integration for CRT display mode.
 * Loaded lazily: API script is injected only on first CRT activation.
 */
import { getDistrictGeoJson } from './map.js';

const RWANDA = { lat: -1.9403, lng: 29.8739 };
const FALLBACK_API_KEY = 'AIzaSyAq0VFLLNrgLELewy9wzPt_CjpLhJrT740';
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || FALLBACK_API_KEY;
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
      reject(new Error('Set VITE_GOOGLE_MAPS_API_KEY to enable Google Maps and Street View.'));
      return;
    }

    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      console.warn('Using fallback Google Maps API key. Set VITE_GOOGLE_MAPS_API_KEY for production.');
    }

    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      previousAuthFailure?.();
      console.warn(
        'Google Maps authentication warning. Check the API key, HTTP referrer restrictions, enabled APIs, and billing.'
      );
    };

    window.__kwGmReady = resolve;
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&loading=async&callback=__kwGmReady`;
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

function districtName(feature) {
  return (feature?.properties?.shapeName || feature?.properties?.shapeISO || '').trim();
}

function pathsFromPolygon(polygon) {
  return polygon.map(ring =>
    ring.map(([lng, lat]) => ({ lat, lng }))
  );
}

function polygonPieces(feature) {
  const geometry = feature?.geometry;
  if (geometry?.type === 'Polygon') return [pathsFromPolygon(geometry.coordinates)];
  if (geometry?.type === 'MultiPolygon') return geometry.coordinates.map(pathsFromPolygon);
  return [];
}

function extendBoundsWithCoords(bounds, coords) {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    bounds.extend({ lat: coords[1], lng: coords[0] });
    return;
  }
  coords.forEach(part => extendBoundsWithCoords(bounds, part));
}

function boundsFromFeature(feature) {
  const bounds = new google.maps.LatLngBounds();
  extendBoundsWithCoords(bounds, feature?.geometry?.coordinates);
  return bounds;
}

function districtBaseOptions() {
  return {
    strokeColor: '#ffb800',
    strokeOpacity: 0.52,
    strokeWeight: 1,
    fillColor: '#ffb800',
    fillOpacity: 0.025,
    clickable: true,
    zIndex: 18,
  };
}

function districtHoverOptions() {
  return {
    strokeOpacity: 0.86,
    strokeWeight: 1.35,
    fillOpacity: 0.12,
    zIndex: 20,
  };
}

function districtSelectedOptions() {
  return {
    strokeOpacity: 1,
    strokeWeight: 2,
    fillOpacity: 0.22,
    zIndex: 22,
  };
}

function applyDistrictOverlayStyles() {
  const selected = selectedDistrictName.toLowerCase();
  gmDistrictOverlays.forEach(({ polygon, name }) => {
    polygon.setOptions(
      selected && name.toLowerCase() === selected
        ? districtSelectedOptions()
        : districtBaseOptions()
    );
  });
}

function selectGmDistrict(name, feature, fit = true) {
  selectedDistrictName = name || '';
  applyDistrictOverlayStyles();
  document.querySelectorAll('.dist-row').forEach(row => row.classList.remove('active'));
  if (name) {
    document.querySelector(`.dist-row[data-district="${name}"]`)?.classList.add('active');
  }
  if (fit && feature) {
    gmap.fitBounds(boundsFromFeature(feature), 42);
    window.setTimeout(() => {
      if (gmap && gmap.getZoom() > 13) gmap.setZoom(13);
      syncGmZoomControl();
    }, 120);
  }
}

function setDistrictOverlaysVisible(visible) {
  const map = visible ? gmap : null;
  gmDistrictOverlays.forEach(({ polygon }) => polygon.setMap(map));
}

async function initDistrictOverlays() {
  if (!gmap || gmDistrictOverlays.length) return;

  try {
    const districtData = await getDistrictGeoJson();
    districtData?.features?.forEach(feature => {
      const name = districtName(feature);
      polygonPieces(feature).forEach(paths => {
        const polygon = new google.maps.Polygon({
          ...districtBaseOptions(),
          paths,
          map: gmap,
        });
        polygon.addListener('mouseover', () => {
          if (selectedDistrictName.toLowerCase() !== name.toLowerCase()) {
            polygon.setOptions(districtHoverOptions());
          }
        });
        polygon.addListener('mouseout', applyDistrictOverlayStyles);
        polygon.addListener('click', () => selectGmDistrict(name, feature));
        gmDistrictOverlays.push({ polygon, name, feature });
      });
    });
    applyDistrictOverlayStyles();
  } catch (error) {
    console.warn('Google Maps district overlay unavailable', error);
  }
}

function clearGmMarkers() {
  gmMarkers.forEach(marker => marker.setMap(null));
  gmMarkers = [];
}

function drawGmMarkers() {
  const { activeEvents, day } = activeMarkerState;
  if (!gmap || !activeEvents.length) {
    clearGmMarkers();
    return;
  }

  clearGmMarkers();
  const markerSurface = streetPanorama?.getVisible() ? streetPanorama : gmap;
  const maxLives = Math.max(...activeEvents.map(event => event.lives), 1);

  activeEvents.forEach(event => {
    const age = day - event.day;
    const fillOpacity = Math.max(0.18, 0.82 - age / 38);
    const scale = Math.max(5, Math.sqrt(event.lives / maxLives) * 18);

    const marker = new google.maps.Marker({
      position: { lat: event.lat, lng: event.lng },
      map: markerSurface,
      title: event.name,
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
    gmMarkers.push(marker);
  });
}

function updateStreetUi() {
  const shell = document.getElementById('gStreetShell');
  const btn = document.getElementById('gStreetBtn');
  const note = document.getElementById('gStreetNote');
  if (!shell || !btn || !note) return;

  const mapVisible = !!gmap && document.getElementById('gMapContainer').style.display === 'block';
  const shouldShow = mapVisible && visitSearchActive;
  shell.style.display = shouldShow ? 'flex' : 'none';
  if (!shouldShow) return;

  if (streetPanorama?.getVisible()) {
    btn.disabled = false;
    btn.classList.add('active');
    btn.textContent = 'EXIT STREET VIEW';
    note.textContent = 'Panorama active. Click again to return to the satellite feed.';
    return;
  }

  btn.classList.remove('active');

  if (!gmap || gmap.getZoom() < STREET_VIEW_MIN_ZOOM) {
    btn.disabled = true;
    btn.textContent = 'STREET VIEW';
    note.textContent = 'Zoom further in to check nearby Street View coverage.';
    return;
  }

  if (streetCoveragePending) {
    btn.disabled = true;
    btn.textContent = 'CHECKING STREET VIEW';
    note.textContent = 'Checking nearby panorama coverage.';
    return;
  }

  if (streetCandidate) {
    btn.disabled = false;
    btn.textContent = 'ENTER STREET VIEW';
    note.textContent = 'Street View coverage found near the current map focus.';
  } else {
    btn.disabled = true;
    btn.textContent = 'NO STREET VIEW';
    note.textContent = 'No nearby Street View panorama was found for this area.';
  }
}

function syncCloseZoomMode() {
  if (!gmap || streetPanorama?.getVisible()) return;
  const targetType = gmap.getZoom() >= HYBRID_ZOOM ? 'hybrid' : 'satellite';
  if (gmap.getMapTypeId() !== targetType) gmap.setMapTypeId(targetType);
}

function queueStreetCoverageCheck(location = null) {
  if (!gmap || !streetViewService) return;

  clearTimeout(streetCheckTimer);
  streetCoveragePending = true;
  updateStreetUi();
  streetCheckTimer = window.setTimeout(() => {
    if (gmap.getZoom() < STREET_VIEW_MIN_ZOOM) {
      streetCandidate = null;
      streetCoveragePending = false;
      updateStreetUi();
      return;
    }

    const center = location || gmap.getCenter();
    if (!center) {
      streetCandidate = null;
      streetCoveragePending = false;
      updateStreetUi();
      return;
    }

    const seq = ++streetCheckSeq;
    streetViewService.getPanorama(
      { location: center, radius: STREET_VIEW_RADIUS_METERS },
      (data, status) => {
        if (seq !== streetCheckSeq) return;
        streetCandidate =
          status === google.maps.StreetViewStatus.OK ? data?.location?.latLng || null : null;
        streetCoveragePending = false;
        updateStreetUi();
      }
    );
  }, 220);
}

function isInKigali(location) {
  const lat = location?.lat();
  const lng = location?.lng();
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= KIGALI_BOUNDS.south &&
    lat <= KIGALI_BOUNDS.north &&
    lng >= KIGALI_BOUNDS.west &&
    lng <= KIGALI_BOUNDS.east
  );
}

function focusVisitResult(location, name, address = '') {
  if (!gmap || !location) return;

  visitMarker?.setMap(null);
  visitMarker = new google.maps.Marker({
    position: location,
    map: gmap,
    title: name,
    animation: google.maps.Animation.DROP,
  });

  streetCandidate = null;
  gmap.panTo(location);
  gmap.setZoom(17);
  syncCoordDisplay(location);
  queueStreetCoverageCheck(location);
  setVisitStatus(address ? `${name} // ${address}` : name);
}

async function searchWithPlaceClass(query) {
  const { Place } = await google.maps.importLibrary('places');
  if (!Place?.searchByText) return null;

  const { places } = await Place.searchByText({
    textQuery: `${query}, Kigali, Rwanda`,
    fields: ['displayName', 'formattedAddress', 'location'],
    locationBias: { center: KIGALI, radius: 22000 },
    maxResultCount: 5,
    region: 'rw',
  });

  const place = places?.find(result => isInKigali(result.location));
  return place
    ? { location: place.location, name: place.displayName || query, address: place.formattedAddress || '' }
    : null;
}

async function searchWithLegacyPlaces(query) {
  const { PlacesService } = await google.maps.importLibrary('places');
  if (!PlacesService) return null;

  const service = new PlacesService(gmap);
  return new Promise(resolve => {
    service.findPlaceFromQuery(
      {
        query: `${query}, Kigali, Rwanda`,
        fields: ['formatted_address', 'geometry', 'name'],
        locationBias: new google.maps.Circle({ center: KIGALI, radius: 22000 }),
      },
      (results, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          resolve(null);
          return;
        }
        const place = results?.find(result => isInKigali(result.geometry?.location));
        resolve(
          place
            ? {
                location: place.geometry.location,
                name: place.name || query,
                address: place.formatted_address || '',
              }
            : null
        );
      }
    );
  });
}

export async function initGoogleMap() {
  await loadAPI();
  if (gmap) return;

  const container = document.getElementById('gMapContainer');
  gmap = new google.maps.Map(container, {
    center: RWANDA,
    zoom: 9,
    minZoom: GM_MIN_ZOOM,
    maxZoom: GM_MAX_ZOOM,
    mapTypeId: 'satellite',
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    scrollwheel: true,
    tilt: 0,
    keyboardShortcuts: false,
  });

  streetViewService = new google.maps.StreetViewService();
  streetPanorama = gmap.getStreetView();
  streetPanorama.setOptions({
    disableDefaultUI: true,
    addressControl: false,
    fullscreenControl: false,
    motionTracking: false,
    showRoadLabels: true,
  });

  gmap.addListener('mousemove', event => syncCoordDisplay(event.latLng));
  gmap.addListener('idle', () => {
    syncCloseZoomMode();
    queueStreetCoverageCheck();
  });
  gmap.addListener('zoom_changed', () => {
    syncCloseZoomMode();
    syncGmZoomControl();
    updateStreetUi();
  });

  streetPanorama.addListener('visible_changed', () => {
    if (!streetPanorama.getVisible()) syncCloseZoomMode();
    syncStreetViewMode();
    drawGmMarkers();
    updateStreetUi();
  });
  streetPanorama.addListener('position_changed', () => {
    const pos = streetPanorama.getPosition();
    if (pos) syncCoordDisplay(pos);
  });

  syncGmZoomControl();
  initDistrictOverlays();
}

export function showGoogleMap() {
  document.getElementById('gMapContainer').style.display = 'block';
  document.getElementById('mSvg').style.display = 'none';
  if (gmap) {
    google.maps.event.trigger(gmap, 'resize');
    syncCloseZoomMode();
    syncGmZoomControl();
    setDistrictOverlaysVisible(!streetPanorama?.getVisible());
    queueStreetCoverageCheck();
  }
  updateVisitUi();
  updateStreetUi();
}

export function hideGoogleMap() {
  document.getElementById('gMapContainer').style.display = 'none';
  document.getElementById('mSvg').style.display = '';
  clearTimeout(streetCheckTimer);
  streetCheckSeq += 1;
  streetCoveragePending = false;
  streetCandidate = null;
  visitSearchActive = false;
  if (streetPanorama) streetPanorama.setVisible(false);
  setDistrictOverlaysVisible(false);
  syncStreetViewMode();
  clearGmMarkers();
  updateVisitUi();
  updateStreetUi();
}

export function showGoogleMapError(error) {
  const message = error?.message || 'Google Maps could not be loaded.';
  setStreetStatus('MAP UNAVAILABLE', message);
}

export function updateGmMarkers(activeEvents, day) {
  activeMarkerState = { activeEvents, day };
  drawGmMarkers();
}

export async function searchGmPlace(query) {
  const normalizedQuery = query?.trim();
  if (!gmap || !normalizedQuery) {
    setVisitStatus('Enter a Kigali place name to begin.', false, false);
    return;
  }

  setVisitStatus('Searching Kigali places...', true);
  try {
    let place = null;
    try {
      place = await searchWithPlaceClass(normalizedQuery);
    } catch (error) {
      console.warn('Places API (New) search unavailable, trying legacy Places service', error);
    }
    if (!place) place = await searchWithLegacyPlaces(normalizedQuery);

    if (!place) {
      setVisitStatus('No matching place found inside Kigali.');
      return;
    }
    focusVisitResult(place.location, place.name, place.address);
  } catch (error) {
    console.warn('Kigali place search failed', error);
    setVisitStatus('Place search unavailable. Enable Places API (New) for this key.');
  }
}

export function panGmTo(lat, lng) {
  if (!gmap) return;
  const target = new google.maps.LatLng(lat, lng);
  gmap.panTo(target);
  if (gmap.getZoom() < 11) gmap.setZoom(11);
  queueStreetCoverageCheck(target);
  syncGmZoomControl();
}

export function focusGmDistrict(name, lat, lng) {
  if (!gmap) return;
  const match = gmDistrictOverlays.find(
    overlay => overlay.name.toLowerCase() === name.toLowerCase()
  );
  if (match) {
    selectGmDistrict(match.name, match.feature);
    return;
  }
  selectedDistrictName = name || '';
  applyDistrictOverlayStyles();
  panGmTo(lat, lng);
}

export function toggleGmStreetView() {
  if (!gmap || !streetPanorama) return;

  if (streetPanorama.getVisible()) {
    streetPanorama.setVisible(false);
    updateStreetUi();
    return;
  }

  if (!streetCandidate) return;

  streetPanorama.setPosition(streetCandidate);
  streetPanorama.setPov({ heading: 0, pitch: 0 });
  streetPanorama.setVisible(true);
  syncCoordDisplay(streetCandidate);
  updateStreetUi();
}

export function isGmReady() {
  return !!gmap;
}
