/**
 * Info card module: tabbed intelligence card with Overview / Testimony / Resources / Video.
 * Events show Overview + Video tabs.
 * Memorials show all four tabs.
 */
import { dayToDate, formatDate } from './sigmoid.js';

// ── Video data ────────────────────────────────────────────
// All IDs are confirmed real YouTube video IDs from verified search results.
// Sources: Aegis Trust (@AegisTrust), United Nations, USC Shoah Foundation,
//          Genocide Archive Rwanda, Al Jazeera, Reuters.

const MEMORIAL_VIDEOS = {
  m1: [
    { id: 'UUAa4XntNn4', title: 'Genocide Archive of Rwanda', src: 'Aegis Trust' },
    { id: 'zwm7R59GKnw', title: 'Kwibuka20: Remembering the Genocide', src: 'Aegis Trust' },
    { id: 'XEJ2XoIw-MM', title: 'Testimony of a Genocide Survivor from Rwanda', src: 'United Nations' },
  ],
  m2: [
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: 'NNHKyhzjSHw', title: '25 Years After: Survivors Share Their Stories', src: 'Al Jazeera' },
    { id: 'TdsVgDLV7Co', title: 'Tutsi Genocide Survivor: Theoneste Karenzi', src: 'USC Shoah Foundation' },
  ],
  m3: [
    { id: '_alDCgIzbyg', title: 'Survivor: Hiding Like a Wild Animal in the Hills', src: 'Reuters' },
    { id: '8yPzfv-QKE4', title: 'What I Witnessed on My Return to Rwanda', src: 'YouTube' },
    { id: 'NWI8ASQqz9Y', title: '1994 Genocide Against the Tutsi in Rwanda', src: 'USC Shoah Foundation' },
  ],
  m4: [
    { id: 'dQFely6oULg', title: 'Testimony of Eugenie Mukeshimana — Survivor', src: 'United Nations' },
    { id: 'H6VJyFHIklI', title: 'Testimony of Josephine Murebwayire — Survivor', src: 'Genocide Archive Rwanda' },
    { id: 'XEJ2XoIw-MM', title: 'Testimony of a Genocide Survivor from Rwanda', src: 'United Nations' },
  ],
  m5: [
    { id: 'dQFely6oULg', title: 'Testimony of Eugenie Mukeshimana — Survivor', src: 'United Nations' },
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: 'MslanLXzx6Y', title: 'Testimony of Jean de Dieu Twahirwa — Perpetrator', src: 'Genocide Archive Rwanda' },
  ],
  m6: [
    { id: 'H6VJyFHIklI', title: 'Testimony of Josephine Murebwayire — Survivor', src: 'Genocide Archive Rwanda' },
    { id: 'NNHKyhzjSHw', title: '25 Years After: Survivors Share Their Stories', src: 'Al Jazeera' },
    { id: 'TdsVgDLV7Co', title: 'Tutsi Genocide Survivor: Theoneste Karenzi', src: 'USC Shoah Foundation' },
  ],
  m7: [
    { id: '_alDCgIzbyg', title: 'Survivor: Hiding Like a Wild Animal in the Hills', src: 'Reuters' },
    { id: 'XEJ2XoIw-MM', title: 'Testimony of a Genocide Survivor from Rwanda', src: 'United Nations' },
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
  ],
  m8: [
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: 'NNHKyhzjSHw', title: '25 Years After: Survivors Share Their Stories', src: 'Al Jazeera' },
    { id: 'UUAa4XntNn4', title: 'Genocide Archive of Rwanda', src: 'Aegis Trust' },
  ],
  m9: [
    { id: 'zwm7R59GKnw', title: 'Kwibuka20: Remembering the Genocide', src: 'Aegis Trust' },
    { id: 'XEJ2XoIw-MM', title: 'Testimony of a Genocide Survivor from Rwanda', src: 'United Nations' },
    { id: '9jeYcBhAJFw', title: 'How Aegis Trust Builds Peace Through Education', src: 'Aegis Trust' },
  ],
  m10: [
    { id: 'XEJ2XoIw-MM', title: 'Testimony of a Genocide Survivor from Rwanda', src: 'United Nations' },
    { id: 'dQFely6oULg', title: 'Testimony of Eugenie Mukeshimana — Survivor', src: 'United Nations' },
    { id: '8yPzfv-QKE4', title: 'What I Witnessed on My Return to Rwanda', src: 'YouTube' },
  ],
  m11: [
    { id: 'H6VJyFHIklI', title: 'Testimony of Josephine Murebwayire — Survivor', src: 'Genocide Archive Rwanda' },
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: 'UUAa4XntNn4', title: 'Genocide Archive of Rwanda', src: 'Aegis Trust' },
  ],
  m12: [
    { id: 'TdsVgDLV7Co', title: 'Tutsi Genocide Survivor: Theoneste Karenzi', src: 'USC Shoah Foundation' },
    { id: '_alDCgIzbyg', title: 'Survivor: Hiding Like a Wild Animal in the Hills', src: 'Reuters' },
    { id: 'NWI8ASQqz9Y', title: '1994 Genocide Against the Tutsi in Rwanda', src: 'USC Shoah Foundation' },
  ],
  m13: [
    { id: 'NNHKyhzjSHw', title: '25 Years After: Survivors Share Their Stories', src: 'Al Jazeera' },
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: 'zwm7R59GKnw', title: 'Kwibuka20: Remembering the Genocide', src: 'Aegis Trust' },
  ],
  m14: [
    { id: 'NWI8ASQqz9Y', title: '1994 Genocide Against the Tutsi in Rwanda', src: 'USC Shoah Foundation' },
    { id: 'MslanLXzx6Y', title: 'Testimony of Jean de Dieu Twahirwa — Perpetrator', src: 'Genocide Archive Rwanda' },
    { id: 'TdsVgDLV7Co', title: 'Tutsi Genocide Survivor: Theoneste Karenzi', src: 'USC Shoah Foundation' },
  ],
  m15: [
    { id: 'dQFely6oULg', title: 'Testimony of Eugenie Mukeshimana — Survivor', src: 'United Nations' },
    { id: 'H6VJyFHIklI', title: 'Testimony of Josephine Murebwayire — Survivor', src: 'Genocide Archive Rwanda' },
    { id: 'XEJ2XoIw-MM', title: 'Testimony of a Genocide Survivor from Rwanda', src: 'United Nations' },
  ],
  m16: [
    { id: '_alDCgIzbyg', title: 'Survivor: Hiding Like a Wild Animal in the Hills', src: 'Reuters' },
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: '8yPzfv-QKE4', title: 'What I Witnessed on My Return to Rwanda', src: 'YouTube' },
  ],
  m17: [
    { id: 'zwm7R59GKnw', title: 'Kwibuka20: Remembering the Genocide', src: 'Aegis Trust' },
    { id: 'XEJ2XoIw-MM', title: 'Testimony of a Genocide Survivor from Rwanda', src: 'United Nations' },
    { id: '9jeYcBhAJFw', title: 'How Aegis Trust Builds Peace Through Education', src: 'Aegis Trust' },
  ],
  m18: [
    { id: 'H6VJyFHIklI', title: 'Testimony of Josephine Murebwayire — Survivor', src: 'Genocide Archive Rwanda' },
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: 'TdsVgDLV7Co', title: 'Tutsi Genocide Survivor: Theoneste Karenzi', src: 'USC Shoah Foundation' },
  ],
  m19: [
    { id: 'dQFely6oULg', title: 'Testimony of Eugenie Mukeshimana — Survivor', src: 'United Nations' },
    { id: 'NNHKyhzjSHw', title: '25 Years After: Survivors Share Their Stories', src: 'Al Jazeera' },
    { id: 'UUAa4XntNn4', title: 'Genocide Archive of Rwanda', src: 'Aegis Trust' },
  ],
  m20: [
    { id: '_alDCgIzbyg', title: 'Survivor: Hiding Like a Wild Animal in the Hills', src: 'Reuters' },
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: 'NWI8ASQqz9Y', title: '1994 Genocide Against the Tutsi in Rwanda', src: 'USC Shoah Foundation' },
  ],
  m21: [
    { id: 'H6VJyFHIklI', title: 'Testimony of Josephine Murebwayire — Survivor', src: 'Genocide Archive Rwanda' },
    { id: 'XEJ2XoIw-MM', title: 'Testimony of a Genocide Survivor from Rwanda', src: 'United Nations' },
    { id: 'TdsVgDLV7Co', title: 'Tutsi Genocide Survivor: Theoneste Karenzi', src: 'USC Shoah Foundation' },
  ],
  m22: [
    { id: 'MslanLXzx6Y', title: 'Testimony of Jean de Dieu Twahirwa — Perpetrator', src: 'Genocide Archive Rwanda' },
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: 'dQFely6oULg', title: 'Testimony of Eugenie Mukeshimana — Survivor', src: 'United Nations' },
  ],
  m23: [
    { id: 'NNHKyhzjSHw', title: '25 Years After: Survivors Share Their Stories', src: 'Al Jazeera' },
    { id: '_alDCgIzbyg', title: 'Survivor: Hiding Like a Wild Animal in the Hills', src: 'Reuters' },
    { id: '8yPzfv-QKE4', title: 'What I Witnessed on My Return to Rwanda', src: 'YouTube' },
  ],
  m24: [
    { id: 'TdsVgDLV7Co', title: 'Tutsi Genocide Survivor: Theoneste Karenzi', src: 'USC Shoah Foundation' },
    { id: 'NWI8ASQqz9Y', title: '1994 Genocide Against the Tutsi in Rwanda', src: 'USC Shoah Foundation' },
    { id: 'zwm7R59GKnw', title: 'Kwibuka20: Remembering the Genocide', src: 'Aegis Trust' },
  ],
  m25: [
    { id: 'dQFely6oULg', title: 'Testimony of Eugenie Mukeshimana — Survivor', src: 'United Nations' },
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: 'XEJ2XoIw-MM', title: 'Testimony of a Genocide Survivor from Rwanda', src: 'United Nations' },
  ],
  m26: [
    { id: 'H6VJyFHIklI', title: 'Testimony of Josephine Murebwayire — Survivor', src: 'Genocide Archive Rwanda' },
    { id: '_alDCgIzbyg', title: 'Survivor: Hiding Like a Wild Animal in the Hills', src: 'Reuters' },
    { id: 'UUAa4XntNn4', title: 'Genocide Archive of Rwanda', src: 'Aegis Trust' },
  ],
  m27: [
    { id: 'NNHKyhzjSHw', title: '25 Years After: Survivors Share Their Stories', src: 'Al Jazeera' },
    { id: 'TdsVgDLV7Co', title: 'Tutsi Genocide Survivor: Theoneste Karenzi', src: 'USC Shoah Foundation' },
    { id: '8yPzfv-QKE4', title: 'What I Witnessed on My Return to Rwanda', src: 'YouTube' },
  ],
  m28: [
    { id: 'zwm7R59GKnw', title: 'Kwibuka20: Remembering the Genocide', src: 'Aegis Trust' },
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: 'MslanLXzx6Y', title: 'Testimony of Jean de Dieu Twahirwa — Perpetrator', src: 'Genocide Archive Rwanda' },
  ],
  m29: [
    { id: 'dQFely6oULg', title: 'Testimony of Eugenie Mukeshimana — Survivor', src: 'United Nations' },
    { id: 'XEJ2XoIw-MM', title: 'Testimony of a Genocide Survivor from Rwanda', src: 'United Nations' },
    { id: 'NWI8ASQqz9Y', title: '1994 Genocide Against the Tutsi in Rwanda', src: 'USC Shoah Foundation' },
  ],
  m30: [
    { id: '_alDCgIzbyg', title: 'Survivor: Hiding Like a Wild Animal in the Hills', src: 'Reuters' },
    { id: 'H6VJyFHIklI', title: 'Testimony of Josephine Murebwayire — Survivor', src: 'Genocide Archive Rwanda' },
    { id: '9jeYcBhAJFw', title: 'How Aegis Trust Builds Peace Through Education', src: 'Aegis Trust' },
  ],
  m31: [
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: 'dQFely6oULg', title: 'Testimony of Eugenie Mukeshimana — Survivor', src: 'United Nations' },
    { id: 'NNHKyhzjSHw', title: '25 Years After: Survivors Share Their Stories', src: 'Al Jazeera' },
  ],
};

// Province-based videos for historical events (40 events across 5 provinces)
const EVENT_VIDEOS_BY_PROV = {
  Kigali: [
    { id: 'UUAa4XntNn4', title: 'Genocide Archive of Rwanda', src: 'Aegis Trust' },
    { id: 'zwm7R59GKnw', title: 'Kwibuka20: Remembering the Genocide', src: 'Aegis Trust' },
    { id: 'XEJ2XoIw-MM', title: 'Testimony of a Genocide Survivor from Rwanda', src: 'United Nations' },
  ],
  Eastern: [
    { id: 'H6VJyFHIklI', title: 'Testimony of Josephine Murebwayire — Survivor', src: 'Genocide Archive Rwanda' },
    { id: 'NNHKyhzjSHw', title: '25 Years After: Survivors Share Their Stories', src: 'Al Jazeera' },
    { id: 'TdsVgDLV7Co', title: 'Tutsi Genocide Survivor: Theoneste Karenzi', src: 'USC Shoah Foundation' },
  ],
  Western: [
    { id: '_alDCgIzbyg', title: 'Survivor: Hiding Like a Wild Animal in the Hills', src: 'Reuters' },
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: '8yPzfv-QKE4', title: 'What I Witnessed on My Return to Rwanda', src: 'YouTube' },
  ],
  Northern: [
    { id: 'TdsVgDLV7Co', title: 'Tutsi Genocide Survivor: Theoneste Karenzi', src: 'USC Shoah Foundation' },
    { id: 'NWI8ASQqz9Y', title: '1994 Genocide Against the Tutsi in Rwanda', src: 'USC Shoah Foundation' },
    { id: 'zwm7R59GKnw', title: 'Kwibuka20: Remembering the Genocide', src: 'Aegis Trust' },
  ],
  Southern: [
    { id: 'dQFely6oULg', title: 'Testimony of Eugenie Mukeshimana — Survivor', src: 'United Nations' },
    { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
    { id: 'MslanLXzx6Y', title: 'Testimony of Jean de Dieu Twahirwa — Perpetrator', src: 'Genocide Archive Rwanda' },
  ],
};

const DEFAULT_VIDEOS = [
  { id: 'XEJ2XoIw-MM', title: 'Testimony of a Genocide Survivor from Rwanda', src: 'United Nations' },
  { id: 'UUAa4XntNn4', title: 'Genocide Archive of Rwanda', src: 'Aegis Trust' },
  { id: 'veWofkpazhs', title: 'Memory of Genocide: Story of Survival in Rwanda', src: 'United Nations' },
];

// ── Helpers ───────────────────────────────────────────────

function renderVideos(vids) {
  const vidEl = document.getElementById('icVids');
  vidEl.innerHTML = vids.map(v =>
    `<div class="ic-video-card">` +
    `<div class="ic-video-thumb" data-vid="${v.id}">` +
    `<img src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg" alt="${v.title}" loading="lazy" />` +
    `<div class="ic-video-play">&#9654;</div>` +
    `</div>` +
    `<div class="ic-video-info">` +
    `<div class="ic-video-title">${v.title}</div>` +
    `<div class="ic-video-src">${v.src}</div>` +
    `</div></div>`
  ).join('');

  vidEl.querySelectorAll('.ic-video-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const vid = thumb.dataset.vid;
      thumb.innerHTML =
        `<iframe src="https://www.youtube.com/embed/${vid}?autoplay=1" ` +
        `frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    });
  });
}

// ── Public API ────────────────────────────────────────────

function commanderInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'RPF';
}

function renderCommanderPhoto(item) {
  function photoSlot(name, photo, roleClass, badge) {
    const inits = commanderInitials(name.replace(/^Lt\.\s*Col\.\s*/i, ''));
    const inner = photo
      ? `<img src="${photo}" alt="${name}" />`
      : `<div class="cmdr-avatar-bg"></div><div class="cmdr-initials">${inits}</div>`;
    return `<div class="cmdr-slot ${roleClass}">` +
      `<div class="cmdr-badge">${badge}</div>` +
      inner +
      `<div class="cmdr-name">${name}</div>` +
      `</div>`;
  }

  const cmdSlot = photoSlot(item.commander, item.commanderPhoto || '', 'slot-cmd', 'CMD');
  const depName = item.deputy || '—';
  const depSlot = photoSlot(depName, item.deputyPhoto || '', 'slot-2ic', '2IC');

  return `<div class="cmdr-pair">${cmdSlot}${depSlot}</div>`;
}

/**
 * Show the info card for an event or memorial.
 * @param {Object} item - Event or memorial object
 * @param {number[]} screenPos - [x, y] screen position
 */
export function showInfoCard(item, screenPos) {
  const card = document.getElementById('icard');
  card.classList.toggle('rpf-card', !!item._isRpf);
  const wrap = document.getElementById('mapWrap');
  const rect = wrap.getBoundingClientRect();
  const mobile = window.innerWidth < 768;

  if (!mobile) {
    const cardWidth = item._isRpf ? 444 : 360;
    let left = screenPos[0] + 16;
    let top = screenPos[1] - 80;
    if (left + cardWidth > rect.width) left = screenPos[0] - cardWidth;
    if (top < 8) top = 8;
    if (top + 300 > rect.height) top = rect.height - 310;
    card.style.left = left + 'px';
    card.style.top = top + 'px';
  } else {
    card.style.left = '';
    card.style.top = '';
  }

  document.getElementById('icT').textContent = item.name;
  document.getElementById('icDt').textContent =
    item._isMemorial ? (item.est ? 'Est. ' + item.est : '—') : formatDate(dayToDate(item.day));
  const livesLabel = document.getElementById('icLvLbl');
  const livesValue = document.getElementById('icLv');
  livesLabel.textContent = item._isRpf ? 'Lives saved' : 'Lives lost';
  livesValue.classList.toggle('r', !item._isRpf);
  livesValue.classList.toggle('g', !!item._isRpf);
  livesValue.textContent = item.lives > 0 ? item.lives.toLocaleString() : 'N/A';
  document.getElementById('icTp').textContent = item.type;
  document.getElementById('icPr').textContent = item.prov;
  document.getElementById('icDs').textContent = item.desc;

  const tabs = document.getElementById('icTabs');
  const badge = document.getElementById('icBadge');
  const photo = document.getElementById('icPhoto');
  photo.innerHTML = item._isRpf ? renderCommanderPhoto(item) : '';

  // Always show tabs except for RPF operation cards; memorial-only tabs toggled per item type
  tabs.style.display = item._isRpf ? 'none' : 'flex';
  document.querySelectorAll('.mem-tab').forEach(t => {
    t.style.display = item._isMemorial ? '' : 'none';
  });

  if (item._isRpf) {
    badge.innerHTML = '<div class="ic-type-badge natl">RPF OFFENSIVE</div>';
  } else if (item._isMemorial) {
    const badgeClass = item.badge || 'regional';
    const badgeLabel = badgeClass === 'unesco' ? 'UNESCO WORLD HERITAGE'
      : badgeClass === 'natl' ? 'NATIONAL MEMORIAL' : 'REGIONAL MEMORIAL';
    badge.innerHTML = `<div class="ic-type-badge ${badgeClass}">${badgeLabel}</div>`;

    const testimony = item.testimony;
    document.getElementById('icTQ').textContent =
      testimony ? testimony.text : 'No testimony available for this site.';
    document.getElementById('icTA').textContent =
      testimony ? `— ${testimony.attribution} (Source: ${testimony.source})` : '';
    document.getElementById('icCtx').textContent = item.context || '';

    document.getElementById('icEst').textContent = item.est ? `Established: ${item.est}` : '';
    document.getElementById('icRes').innerHTML = (item.resources || []).map(r =>
      `<a href="${r.url}" target="_blank" rel="noopener" class="ic-res-link">` +
      `<span class="rl-icon">&#8594;</span>${r.label}</a>`
    ).join('');

    renderVideos(MEMORIAL_VIDEOS[item.id] || DEFAULT_VIDEOS);
  } else {
    badge.innerHTML = '';
    renderVideos(EVENT_VIDEOS_BY_PROV[item.prov] || DEFAULT_VIDEOS);
  }

  showTab('overview');
  card.classList.add('vis');
}

/**
 * Switch info card tab.
 * @param {string} tabName - 'overview' | 'testimony' | 'resources' | 'video'
 */
export function showTab(tabName) {
  document.querySelectorAll('.ic-tab').forEach(btn => {
    btn.classList.toggle('on', btn.textContent.trim().toLowerCase() === tabName);
  });
  document.querySelectorAll('.ic-pane').forEach(pane => {
    pane.classList.toggle('on', pane.id === 'pane-' + tabName);
  });
}

/**
 * Close the info card.
 */
export function closeInfoCard() {
  document.getElementById('icard').classList.remove('vis');
}
