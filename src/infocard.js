/**
 * Info card module: tabbed intelligence card with Overview / Testimony / Resources.
 */
import { dayToDate, formatDate } from './sigmoid.js';

/**
 * Show the info card for an event or memorial.
 * @param {Object} item - Event or memorial object (memorials have _isMemorial: true)
 * @param {number[]} screenPos - [x, y] position on screen
 */
export function showInfoCard(item, screenPos) {
  const card = document.getElementById('icard');
  const wrap = document.getElementById('mapWrap');
  const rect = wrap.getBoundingClientRect();

  // Position card near the marker
  let left = screenPos[0] + 16;
  let top = screenPos[1] - 80;
  if (left + 360 > rect.width) left = screenPos[0] - 360;
  if (top < 8) top = 8;
  if (top + 300 > rect.height) top = rect.height - 310;

  card.style.left = left + 'px';
  card.style.top = top + 'px';

  // Title
  document.getElementById('icT').textContent = item.name;

  // Overview tab
  document.getElementById('icDt').textContent =
    item._isMemorial ? (item.est ? 'Est. ' + item.est : '—') : formatDate(dayToDate(item.day));
  document.getElementById('icLv').textContent =
    item.lives > 0 ? item.lives.toLocaleString() : 'N/A';
  document.getElementById('icTp').textContent = item.type;
  document.getElementById('icPr').textContent = item.prov;
  document.getElementById('icDs').textContent = item.desc;

  // Tabs visibility
  const tabs = document.getElementById('icTabs');
  const badge = document.getElementById('icBadge');

  if (item._isMemorial) {
    tabs.style.display = 'flex';

    // Badge
    const badgeClass = item.badge || 'regional';
    const badgeLabel = badgeClass === 'unesco' ? 'UNESCO WORLD HERITAGE'
      : badgeClass === 'natl' ? 'NATIONAL MEMORIAL' : 'REGIONAL MEMORIAL';
    badge.innerHTML = `<div class="ic-type-badge ${badgeClass}">${badgeLabel}</div>`;

    // Image
    const imgWrap = document.getElementById('icImgWrap');
    const img = document.getElementById('icImg');
    if (item.imageUrl) {
      img.src = item.imageUrl;
      img.alt = item.name;
      img.onerror = () => { imgWrap.style.display = 'none'; };
      img.onload = () => { imgWrap.style.display = 'block'; };
      imgWrap.style.display = 'block';
    } else {
      imgWrap.style.display = 'none';
      img.src = '';
    }

    // Testimony tab
    const testimony = item.testimony;
    document.getElementById('icTQ').textContent =
      testimony ? testimony.text : 'No testimony available for this site.';
    document.getElementById('icTA').textContent =
      testimony ? `— ${testimony.attribution} (Source: ${testimony.source})` : '';

    // Context
    document.getElementById('icCtx').textContent = item.context || '';

    // Resources tab
    document.getElementById('icEst').textContent =
      item.est ? `Established: ${item.est}` : '';
    const resEl = document.getElementById('icRes');
    resEl.innerHTML = (item.resources || []).map(r =>
      `<a href="${r.url}" target="_blank" rel="noopener" class="ic-res-link">` +
      `<span class="rl-icon">&#8594;</span>${r.label}</a>`
    ).join('');
  } else {
    tabs.style.display = 'none';
    badge.innerHTML = '';
    document.getElementById('icImgWrap').style.display = 'none';
  }

  // Show overview tab by default
  showTab('overview');
  card.classList.add('vis');
}

/**
 * Switch info card tab.
 * @param {string} tabName - 'overview', 'testimony', or 'resources'
 */
export function showTab(tabName) {
  document.querySelectorAll('.ic-tab').forEach(btn => {
    btn.classList.toggle('on', btn.textContent.toLowerCase() === tabName);
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
