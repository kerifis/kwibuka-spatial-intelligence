# KWIBUKA // Deployment Log — Last 48 Hours
**Project:** kwibuka-spatial-intelligence (Vercel · elysemukamisha)
**Production URL:** https://kwibuka-spatial-intelligence-sable.vercel.app
**Period:** 2026-05-04 → 2026-05-06
**Total deployments:** 20 (all status: Ready · Production)

---

## 2026-05-06 (Today)

### Deploy 1 — RPF Fading Trail
**Age:** ~5 min ago
**URL:** `kwibuka-spatial-intelligence-i9yvk632l`
**Changes:**
- `src/rpf.js` — Trail rewritten as individual per-segment path elements instead of one solid line
- Each trail segment now receives a position-based opacity: newest segment = 100%, oldest = ~25%
- Added module-level `_fadeTick` counter and `setInterval` (5 000 ms) that dims the entire trail by 15% per tick, capped at 6 ticks (~90% fade)
- `_maxVisiblePts` tracks waypoint count per route; resets fade counter one step back when unit advances to a new waypoint
- Waypoint circles also fade proportionally to their age along the trail
- `src/main.js` — Added `document.addEventListener('rpf-fade-tick', () => update(currentDay))` to trigger full re-render on each timer tick

---

### Deploy 2 — Audio Autoplay Disabled
**Age:** ~14 h ago
**URL:** `kwibuka-spatial-intelligence-2tgi3mdol`
**Changes:**
- `src/main.js` — Removed `startAudio()` call and `onFirstInteraction` listeners from `init()`
- Background audio is now silent on page load; user must click **AUX** to start
- Volume still initialises to 0.5 for when the user does play

---

### Deploy 3 — LIVE + AUX Buttons in Testimonies Modal Nav
**Age:** ~21 h ago
**URL:** `kwibuka-spatial-intelligence-dqngy8c7l`
**Changes:**
- `index.html` — Two new nav items added after **Podcast** tab inside `test-nav`:
  - `● LIVE` — anchor (`<a>`) linking to the YouTube Studio livestreaming channel; opens in new tab
  - `▶ AUX` — button (`id="modalAuxBtn"`) that toggles background audio from within the modal
- `src/styles.css` — Added `.test-nav-live` (red color, hover highlight) and `.test-nav-aux` (pushed to right via `margin-left:auto`, green when `.playing`)
- `src/main.js` — Added `window.updateModalAux()` to sync AUX button text/class with audio state; called on modal open and on audio toggle

---

### Deploy 4 — Podcast Button → Jumps to Page 6
**Age:** ~23 h ago
**URL:** `kwibuka-spatial-intelligence-fu2mdwhm2`
**Changes:**
- `src/infocard.js` — `openTestimoniesModal()` now accepts optional `page` parameter (default `1`)
- `src/main.js` — `window.openPodcast()` calls `openTestimoniesModal(6)`, activates the Podcast tab, and syncs the AUX button state
- Result: clicking **PODCAST** in the header opens the modal directly at page 6/9 — the Kwibuka Podcast episode grid

---

### Deploy 5 — openTestimoniesModal Page Parameter (intermediate)
**Age:** ~23 h ago
**URL:** `kwibuka-spatial-intelligence-14j3bajpk`
**Changes:**
- Intermediate deploy adding the `openPodcast` window binding and the Podcast tab active-state selector fix (`querySelector('[onclick*="podcast"]')`)

---

### Deploy 6 — PODCAST Button + Header Blank Space Fix
**Age:** ~24 h ago
**URL:** `kwibuka-spatial-intelligence-jq54cuzsr`
**Changes:**
- `index.html` — Added `<button class="fbtn test-btn" onclick="openPodcast()">PODCAST</button>` to header `fgrp`, immediately after **100 VOICES**
- `src/styles.css` — Removed `min-width: 130px` from `.hdr-date` (this was causing blank space between the date and day counter)
- `src/styles.css` — Reduced `.hdr` gap from `16px` to `10px` and padding from `0 16px` to `0 12px` for a tighter header layout

---

## 2026-05-05 (Yesterday)

### Deploy 7 — John Mugabo Photo Updated (7th Mobile Force)
**Age:** ~24 h ago
**URL:** `kwibuka-spatial-intelligence-casgbe4kp`
**Changes:**
- `public/mugabo.jpg` — Replaced with new portrait photo of Lt. Col. John Mugabo (7th Mobile Force, second in command)
- No code changes; Vercel picked up the new static asset

---

### Deploy 8 — YouTube-Style Nav Tabs + Phase Label Hidden
**Age:** ~24 h ago
**URL:** `kwibuka-spatial-intelligence-kc2qtc99w`
**Changes:**
- `index.html` — Added `test-nav` bar above the 12-video grid with four tabs: **Home | Videos | Shorts | Podcast** (Videos active by default)
- `src/styles.css` — Added `.test-nav`, `.test-nav-btn`, `.test-nav-btn.test-nav-on` (white underline active style, YouTube dark-mode aesthetic)
- `src/styles.css` — Added `display: none` to `.hdr-phase` removing "Systematic extermination" phase label from the header
- `src/main.js` — Added `window.setTestNav(btn, tab)` binding to toggle active class across nav buttons

---

### Deploy 9 — 12 Videos Per Page + 100 VOICES Button Restyled
**Age:** ~1 d ago
**URL:** `kwibuka-spatial-intelligence-40r2j2974`
**Changes:**
- `src/infocard.js` — `T_PAGE_SIZE` changed from `8` to `12`; page info label updated to reflect 9 pages for 100 videos
- `index.html` — 100 VOICES button restyled with class `test-btn` (smaller: 9 px font, 3 px 7 px padding)
- `src/styles.css` — Added `.test-btn` selector for compact header button size

---

### Deploy 10 — 100 VOICES Modal (YouTube Dark Mode Design)
**Age:** ~1 d ago
**URL:** `kwibuka-spatial-intelligence-nuysspxj1`
**Changes:**
- `index.html` — Full testimonies modal structure added: `test-modal`, `test-modal-inner`, `test-modal-hdr`, `test-grid`, `test-pagination` (Prev/Next + page counter)
- `src/styles.css` — Modal styled to match YouTube dark mode: `#0f0f0f` background, `#272727` borders, `#fff` text; `.test-grid` set to 4-column grid with `gap: 24px 16px`; `.test-thumb` set to `aspect-ratio: 16/9` with `border-radius: 8px`; responsive breakpoints (2 col ≤900 px, 1 col ≤540 px)
- `src/infocard.js` — `openTestimoniesModal()`, `testimoniesPrev()`, `testimoniesNext()` functions implemented with module-level `_tPage` state
- `src/main.js` — Imported and bound `openTestimoniesModal`, `testimoniesPrev`, `testimoniesNext` to `window.*`; added `window.openTestimonies`, `window.closeTestimonies` handlers

---

### Deploy 11 — Audio Button Renamed to AUX
**Age:** ~1 d ago
**URL:** `kwibuka-spatial-intelligence-djooffm5l`
**Changes:**
- `index.html` — Audio button text changed from "INKOTANYI" to "▶ AUX"
- `src/main.js` — All references to "INKOTANYI" updated to "AUX" in `toggleAudio()` handler

---

### Deploy 12 — Event Card Videos Fixed (Province-Based Assignment)
**Age:** ~1 d ago
**URL:** `kwibuka-spatial-intelligence-kybio6qd1`
**Changes:**
- `src/infocard.js` — `EVENT_VIDEOS_BY_PROV` restored with province-keyed video sets using unassigned pool indices (#93–#100, #51–#68) to avoid overlap with memorial-exclusive archive videos (#1–#35)
- Provinces: Kigali `vp(92,93,94)`, Eastern `vp(95,96,97)`, Western `vp(98,99,50)`, Northern `vp(53,56,59)`, Southern `vp(62,65,68)`
- `DEFAULT_VIDEOS = vp(71,74,77)` set as fallback

---

### Deploy 13 — Video #3 Deduplication Fix
**Age:** ~1 d ago
**URL:** `kwibuka-spatial-intelligence-8e42rnynn`
**Changes:**
- `src/infocard.js` — Removed video index `2` (#3 — Testimony Archive) from `EVENT_VIDEOS_BY_PROV`; it was appearing in both memorial `m1` and event cards
- All event province assignments shifted to pool indices ≥50 to maintain exclusive memorial/event separation

---

### Deploy 14 — Video Pool Complete (#93–#100)
**Age:** ~1 d ago
**URL:** `kwibuka-spatial-intelligence-ccgjsuyat`
**Changes:**
- `src/infocard.js` — Added final 8 videos to reach 100 total:
  - `#93` vAWjH5CkdxA — Kayitare Leon Pierre (Rwanda TV)
  - `#94` voq5B5J8gjI — Gahanga ya Kicukiro (Rwanda TV)
  - `#95` 3MZF-s4DGNQ — Minisitiri Bizimana (Rwanda TV)
  - `#96` W760KeGYrQQ — Mutabazi Marc (Rwanda TV)
  - `#97` VAtL-emedSc — Hodari Marie Rose / ETO Kicukiro (Rwanda TV)
  - `#98` GtQ-MncCeuo — Liliane Murangwayire / Ntarama (Rwanda TV)
  - `#99` ZpmHRFcFtH4 — Jacky / Genocide 1994 (Rwanda TV)
  - `#100` jduYQYMP-E8 — Twayisenga / Kwibuka32 (Rwanda TV)

---

### Deploy 15 — Rwanda TV Ubuhamya Videos (#78–#92)
**Age:** ~1 d ago
**URL:** `kwibuka-spatial-intelligence-nxo1c59ib`
**Changes:**
- `src/infocard.js` — Added 15 Rwanda TV testimony videos to pool:
  - `#78`–`#92` sourced from Rwanda TV's Kwibuka31/32 Ubuhamya series
  - Memorial slots `m27`–`m31` assigned: `vp(77,78,79)` through `vp(89,90,91)`

---

### Deploy 16 — @KwibukaRwanda Channel Videos (#48–#77)
**Age:** ~1 d ago
**URL:** `kwibuka-spatial-intelligence-lm6gu1a14`
**Changes:**
- `src/infocard.js` — Added 30 videos from @KwibukaRwanda YouTube channel:
  - Kwibuka Conversations series (French, Kinyarwanda, English)
  - Kwibuka Podcast series covering genocide planning roles (media, militias, judiciary, intellectuals, prisons)
  - Memorial slots `m17`–`m26` assigned using these indices

---

### Deploy 17 — 100 Stories Playlist Videos (#36–#47)
**Age:** ~1 d ago
**URL:** `kwibuka-spatial-intelligence-l0ujcrt4v`
**Changes:**
- `src/infocard.js` — Added 12 videos from Kwibuka 100 Stories playlist (`PLGm_uIMiZBuQbIHlAiXg87w2kUnZzozC1`):
  - Chronological massacre site documentaries: Christus Remera, Gikondo, Nyanza-Kicukiro, Nyamata, Nyarubuye, Ntarama, Stade Gatwaro, Amahoro Stadium, RPF Evacuation
  - Memorial slots `m13`–`m16` assigned

---

### Deploy 18 — 3-Videos-Per-Memorial Slot Restructure
**Age:** ~1 d ago
**URL:** `kwibuka-spatial-intelligence-juwtqgy2r`
**Changes:**
- `src/infocard.js` — `vp()` helper changed from single-index to variadic: `const vp = (...indices) => indices.map(i => VIDEO_POOL[i])`
- `MEMORIAL_VIDEOS` updated so each slot (`m1`–`m31`) holds exactly 3 videos
- `renderVideos()` updated to display multiple video thumbnails per card

---

## 2026-05-04

### Deploy 19 — Video Pool Foundation (#25–#35) + RPF Commander Photos
**Age:** ~2 d ago
**URL:** `kwibuka-spatial-intelligence-83x6ezl8g`
**Changes:**
- `src/infocard.js` — Extended VIDEO_POOL with curated archive sources: Aegis Trust (#25–#26), United Nations (#27–#28), Al Jazeera (#29), USC Shoah Foundation (#30, #33), Reuters (#31), YouTube (#32), United Nations (#34), Aegis Trust (#35)
- `public/` — Commander and deputy photos added: bagabo, bagire, dodo, gashumba, ibingira, kaka, kareba, kayitare, kayizari, kayonga, kayonga1, kazintwari, kazintwari1, kwikiriza, kwikiriza1, muhire, murokore, musitu, ngoga, nyamurangwa, nzaramba

---

### Deploy 20 — Base: 100 VOICES Button + Initial Modal
**Age:** ~2 d ago
**URL:** `kwibuka-spatial-intelligence-1z922fqdk`
**Changes:**
- `index.html` — Added **100 VOICES** button to header toolbar
- Initial testimonies modal scaffolding (pre-YouTube design)
- `src/main.js` — Audio button renamed from INKOTANYI; initial `openTestimonies` binding

---

## Summary Table

| # | Age | Key Feature | Files Changed |
|---|-----|-------------|---------------|
| 1 | 5 min | RPF fading trail (5s timer, per-segment opacity) | rpf.js, main.js |
| 2 | 14 h | Audio autoplay disabled | main.js |
| 3 | 21 h | LIVE + AUX buttons in testimonies modal | index.html, styles.css, main.js |
| 4 | 23 h | PODCAST button → page 6 deep link | infocard.js, main.js |
| 5 | 23 h | openTestimoniesModal page param (intermediate) | infocard.js, main.js |
| 6 | 24 h | PODCAST header button + header blank space fix | index.html, styles.css |
| 7 | 24 h | John Mugabo photo (7th Mobile Force) | public/mugabo.jpg |
| 8 | 24 h | YouTube nav tabs + phase label removed | index.html, styles.css, main.js |
| 9 | 1 d | 12 videos/page + 100 VOICES button restyled | infocard.js, index.html, styles.css |
| 10 | 1 d | 100 VOICES modal (YouTube dark mode) | index.html, styles.css, infocard.js, main.js |
| 11 | 1 d | Audio button renamed to AUX | index.html, main.js |
| 12 | 1 d | Event card videos fixed (province-based) | infocard.js |
| 13 | 1 d | Video #3 deduplication | infocard.js |
| 14 | 1 d | Video pool complete (#93–#100) | infocard.js |
| 15 | 1 d | Rwanda TV Ubuhamya videos (#78–#92) | infocard.js |
| 16 | 1 d | @KwibukaRwanda channel videos (#48–#77) | infocard.js |
| 17 | 1 d | 100 Stories playlist videos (#36–#47) | infocard.js |
| 18 | 1 d | 3-videos-per-memorial restructure | infocard.js |
| 19 | 2 d | Video pool foundation + RPF photos | infocard.js, public/* |
| 20 | 2 d | 100 VOICES button + initial modal | index.html, main.js |
