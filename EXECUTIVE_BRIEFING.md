# Executive Briefing: KWIBUKA Spatial Intelligence Map

## Purpose

The KWIBUKA Spatial Intelligence Map is an interactive geospatial briefing tool for understanding the temporal and geographic spread of the 1994 Genocide against the Tutsi in Rwanda. It combines a 100-day timeline, event-level markers, district and province overlays, memorial records, testimony media, RPF advance visualization, satellite inspection tools, and a modeled casualty curve into one executive-facing dashboard.

The tool is designed for remembrance, education, strategic briefings, museum interpretation, research orientation, diaspora engagement, and rapid situational understanding of how violence unfolded across Rwanda from April 6, 1994 through mid-July 1994.

## Bottom Line

The map translates a national catastrophe into a spatial and temporal intelligence view. Its central value is not only showing where events occurred, but helping an audience see how quickly targeted violence moved from trigger events in Kigali to nationwide extermination patterns across all provinces.

The current application now operates as both a historical briefing map and a multimedia remembrance platform: users can move from national scale to local districts, inspect memorial sites, open survivor testimony video archives, search modern Kigali on satellite imagery, and view Rwanda's district divisions directly over Google Maps in CRT mode.

## Current Functionality

### Core timeline and map

- Interactive 100-day timeline from April 6 to July 15, 1994.
- Play/pause controls with speed presets from 0.5x to 8x.
- Date, day counter, phase label, cumulative lives lost, and estimated daily killing-rate panels.
- Event list synchronized to the selected day.
- Standard geographic map with Rwanda, neighboring-country context, Lake Kivu, city labels, province cards, and event heatmap.
- Bottom-right zoom control for the D3/SVG map, plus keyboard zoom with arrow keys.

### Display modes

- STD: default analytical map view.
- NVG: night-vision visual mode.
- CRT: Google satellite mode for modern geospatial inspection.
- FLIR: thermal/intensity visual mode.
- HIST: historical/cohort mode focused on documented wiped-out family areas.

### CRT / Visit Kigali mode

- The VISIT KIGALI yellow button toggles CRT mode on and off.
- First click enters CRT and focuses the Kigali search box.
- Second click exits CRT and returns to STD mode.
- Google Maps satellite layer replaces the SVG map in CRT mode.
- Search supports Kigali places, landmarks, hotels, memorials, and public places.
- Search helper text and Street View controls stay hidden until a user begins a search.
- Street View availability is checked only after zoom/search context makes coverage relevant.
- District grid overlays are drawn interactively on Google Maps using the ADM2 district boundary source.
- The separate simplified country-outline polygon has been removed; Rwanda's outer edge is now defined naturally by the district grid.
- District clicks and the DIST panel synchronize with CRT district focus.
- Mouse-wheel zoom, bottom-right +/- buttons, and the zoom slider sync to Google Maps zoom metrics from Z7 to Z20.
- CRT automatically switches between satellite and hybrid map types at close zoom levels.

### District and historical overlays

- DIST panel lists Rwanda's 30 districts grouped by province.
- Clicking a district highlights/focuses that district on the SVG map or Google map, depending on current mode.
- HIST mode shows documented wiped-out family cohorts and keeps district boundaries visible while suppressing operational map noise.
- HIST panel lists cohort areas, family counts, and related districts from `data/histFamilies.json`.

### RPF advance layer

- RPF layer can be toggled independently.
- RPF advance routes render by day and mode.
- CRT mode hides the RPF layer to keep the Google satellite inspection clean.
- Recent RPF trail behavior includes segment-level fading and waypoint fading over time.
- Commander/deputy photo assets are available for RPF-related cards where configured.

### Memorial and testimony system

- MASS GRAVE toggle controls the memorial marker layer.
- Runtime memorial display expands to 133 mapped memorial markers for broad national coverage.
- Curated memorial dataset contains 31 detailed memorial records.
- Memorial/event info cards include overview, date/type/province, lives lost, description, testimony/context, resources, and video where available.
- Four UNESCO World Heritage memorial sites are represented in the curated dataset.

### 100 Voices and media archive

- 100 VOICES button opens the testimony modal.
- Modal uses a YouTube-style dark interface with channel-style tabs.
- Testimony grid displays 100 curated videos with pagination.
- Video pages currently display 12 videos per page.
- Podcast tab deep-links directly to the podcast section.
- LIVE link opens the configured YouTube Studio livestream page.
- AUX control is available both in the main header and inside the modal.
- Memory Keepers tab presents diaspora community video submissions by region.
- Rwanda Tech tab embeds the configured Jitsi meeting room and includes an external-room link.

### Audio, casting, and UI controls

- AUX button controls background audio.
- Audio no longer autoplays on page load; user interaction is required.
- Volume slider is available in the header.
- CAST button presents browser casting instructions or uses the Presentation API where available.
- Mobile panel toggle and backdrop support smaller screens.
- Header buttons provide quick access to RPF, HIST, DIST, NVG, CRT, FLIR, COUNT, memorials, testimonies, podcast, audio, cast, and STD mode.

### AI synthesis

- Gemini synthesis feature is present for day-specific analytical reporting.
- It activates only after day 45.
- It requires a Gemini API key to return generated briefing text.
- This feature should be framed as an intelligence-assist layer, not as a source of historical fact.

### Public discoverability and SEO infrastructure (in progress)

- Page title and meta description rewritten to target public search intent around the Rwanda genocide, Kwibuka, and Kigali memorial topics, with a supporting keyword list.
- Open Graph and Twitter Card tags added so links shared on social platforms and messaging apps render a title, description, and preview image (the Rwanda relief map).
- JSON-LD structured data declares the application as a `WebApplication`, with topical coverage (Rwanda, Kigali, 1994 Genocide against the Tutsi, Kwibuka, African memorial archives) and an audience scoped to Rwanda and Africa.
- Geo meta tags (`geo.region`, `geo.placename`, `geo.position`, `ICBM`) and a canonical URL pointing to `https://arktech.live/` were added.
- New `robots.txt` and `sitemap.xml` files were added under `public/`, and an `.htaccess` file was added to enforce HTTPS/non-`www` redirects, set security headers (`X-Content-Type-Options`, `Referrer-Policy`), enable compression, and define cache-control rules for static assets, HTML, and the sitemap.
- This metadata and infrastructure work is staged locally and has not yet been committed or deployed to production.

## What The Map Shows

- A timeline-driven map of Rwanda during the genocide period.
- 40 documented historical event sites from the project data.
- 31 curated memorial records in the source dataset.
- 133 runtime memorial markers displayed for national remembrance coverage.
- 30 districts grouped across 5 provinces.
- A modeled cumulative casualty estimate reaching approximately 1,000,000 lives lost.
- Province-level onset timing and distribution assumptions.
- District-level administrative divisions in both SVG and CRT satellite modes.
- Memorial cards with overview, testimony context, resources, and video references.
- A 100-video testimony archive plus podcast, diaspora, live, and meeting-room surfaces.

## Executive Insights

### 1. The escalation was rapid and geographically distributed

The timeline shows the initial trigger in Kigali on April 6, 1994, followed almost immediately by killings, assassinations, and military events. Within the first two weeks, event markers spread beyond Kigali into Northern, Eastern, Western, and Southern provinces.

### 2. Kigali is the ignition point, not the full story

Kigali anchors the earliest phase and contains the highest count of early mapped events, but the spatial distribution shows the genocide as a nationwide system. The CRT mode reinforces this by letting users inspect Kigali today while keeping Rwanda's district structure visible.

### 3. District boundaries are central to local interpretation

The district grid makes local administrative geography visible without relying on a simplified national outline. This helps briefers explain local areas, administrative divisions, memorial locations, and limits of Rwanda more accurately.

### 4. Memorial geography turns incident tracking into remembrance infrastructure

The memorial layer reframes the dashboard from historical incident visualization into a remembrance network. UNESCO, national, and regional memorial markers help users connect mass violence, burial sites, preservation institutions, testimony, and public memory.

### 5. The casualty curve is a model, not a forensic ledger

The map uses a sigmoid model to estimate cumulative lives lost over time. This is useful for briefing and pattern recognition, but it should be presented as an analytical model rather than a verified day-by-day casualty count.

### 6. The strongest interpretive bridge is testimony

The strongest human-centered feature is the testimony and memorial media system. It allows users to move from abstract totals to site-specific remembrance, archival context, survivor-centered narrative material, podcast interpretation, and diaspora memory work.

## Analytical Model

The implementation uses a logistic sigmoid curve to model cumulative lives lost across the timeline.

Key assumptions:

- Total modeled toll: 1,000,000 lives.
- Inflection point: approximately day 30.
- Peak modeled killing rate: approximately 32,500 lives per day.
- Provincial onset offsets:
  - Kigali: day 0
  - Eastern: day 3
  - Northern: day 4
  - Western: day 9
  - Southern: day 13
- Provincial modeled shares:
  - Kigali: 18 percent
  - Eastern: 20 percent
  - Northern: 15 percent
  - Western: 22 percent
  - Southern: 25 percent

These assumptions support visualization and comparative reasoning. They should be cited clearly when the map is used in formal settings.

## Data Coverage

Current source data includes:

| Layer | Coverage |
|---|---:|
| Historical event records | 40 |
| Curated memorial records | 31 |
| Runtime memorial markers displayed | 133 |
| Districts listed | 30 |
| Provinces modeled | 5 |
| Testimony videos | 100 |
| UNESCO memorial sites | 4 |
| National memorial sites | 6 |
| Regional memorial sites in curated data | 21 |

Event records by province:

| Province | Events |
|---|---:|
| Kigali | 11 |
| Western | 10 |
| Eastern | 9 |
| Southern | 6 |
| Northern | 4 |

Curated memorial records by province:

| Province | Memorials |
|---|---:|
| Western | 10 |
| Kigali | 7 |
| Southern | 6 |
| Northern | 4 |
| Eastern | 4 |

## Deployment Surfaces

- Vercel production alias: `https://kwibuka-spatial-intelligence-sable.vercel.app`
- Hostinger/custom domain deployment: `https://arktech.live`
- Current build output is static Vite content in `dist/`.
- Hostinger FTP deployment requires mirroring `dist/` to both `public_html` and the FTP account root because the live domain has previously served from the root copy.
- SEO infrastructure (`robots.txt`, `sitemap.xml`, canonical URL, structured data, and `.htaccess` caching/security/redirect rules) is staged for the `arktech.live` deployment but not yet committed or shipped.

## Use Cases

- Executive briefings on genocide history, escalation patterns, and remembrance infrastructure.
- Museum or memorial interpretation for guided walkthroughs.
- Classroom and university instruction on spatial history and mass atrocity prevention.
- Research orientation before deeper archival investigation.
- District-level orientation for local geography, memorial mapping, and administrative context.
- Diaspora remembrance programming through Memory Keepers and live/community video surfaces.
- Demonstration of how spatial intelligence tools can support human rights education.
- Prototype foundation for a future verified archival platform.

## Strategic Value

The map is effective because it compresses a complex historical sequence into an interface that remains navigable under time pressure. A user can brief the first days, advance through national spread, inspect major event sites, switch to memorial context, open testimony archives, use satellite inspection in CRT mode, and summarize modeled humanitarian impact without leaving the dashboard.

For leadership audiences, this provides four levels of understanding:

- Temporal: how the genocide accelerated over the 100-day period.
- Spatial: how violence spread across provinces, districts, and localities.
- Memorial: how the country preserves, marks, and teaches the history today.
- Media/testimony: how archival video, podcast, diaspora memory work, and live discussion extend the map beyond static data.

## Caveats And Integrity Notes

- The casualty timeline is modeled with a sigmoid curve and should not be described as a verified daily count.
- The source data contains 31 curated memorial records; the application currently synthesizes additional local memorial placeholders at runtime to reach 133 displayed markers.
- Testimony text is described in the project as representative composite material based on documented survivor accounts, not direct quotations from named individuals.
- The historical event layer is selective and should be expanded with verified archival or scholarly datasets before being used as a comprehensive historical record.
- Google Maps, Places, and Street View behavior depends on API availability, billing, referrer rules, and enabled Google services.
- AI synthesis depends on a valid Gemini API key and should not replace source-based historical interpretation.
- Some older project text may still refer to earlier feature counts; this briefing reflects the current application state.

## Recommended Next Steps

1. Replace synthesized memorial placeholders with verified official memorial registry records.
2. Add source citations per event and memorial, including archive links and confidence levels.
3. Add a methodology panel explaining the sigmoid model, provincial onset assumptions, and known limitations.
4. Separate direct testimony, representative composites, and archival summaries with clear labels.
5. Add source metadata and curation notes for the 100-video testimony archive.
6. Add exportable briefing snapshots for selected days, districts, phases, or modes.
7. Prepare a formal source bibliography for public, educational, or institutional use.
8. Add automated visual regression checks for CRT district overlays, Google zoom sync, and testimony modal navigation.
9. Commit and deploy the staged SEO metadata, `robots.txt`, `sitemap.xml`, and `.htaccess` rules, then submit the sitemap to Google Search Console and confirm Open Graph/Twitter previews render correctly on major platforms.

## Briefing Position

KWIBUKA Spatial Intelligence is best positioned as a powerful remembrance and orientation dashboard rather than a definitive historical database. With stronger source attribution and replacement of synthetic memorial placeholders, it can mature into a credible public-facing educational and analytical platform.
