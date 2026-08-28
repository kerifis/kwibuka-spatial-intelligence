# Executive Briefing: KWIBUKA Spatial Intelligence Map

## Purpose

The KWIBUKA Spatial Intelligence Map is an interactive geospatial and multimedia intelligence briefing platform for understanding the temporal, spatial, and human dimensions of the 1994 Genocide against the Tutsi in Rwanda. It unifies a 100-day timeline, event-level forensic markers, district and province administrative overlays, memorial registries, survivor testimony video archives, RPF military advance corridors, modern satellite inspection tools, 3D immersive museum architecture, real-time TV casting synchronization, and a modeled casualty curve into an executive-facing spatial intelligence dashboard.

The tool is engineered for national remembrance, diplomatic and strategic briefings, university and classroom instruction, museum exhibit interpretation, research orientation, diaspora engagement, and rapid situational understanding of how targeted violence unfolded across Rwanda from April 6, 1994 through mid-July 1994.

## Bottom Line

The platform translates a national catastrophe into an operational spatial and temporal intelligence model. Its core analytical value is demonstrating how rapidly state-sponsored extermination moved from initial trigger assassinations in Kigali to a coordinated nationwide operational assault across all five provinces.

The platform now functions as a unified four-layer operational system:
1. **Historical Forensic Map**: Day-by-day spatial escalation, provincial onset timelines, and RPF operational advance routes.
2. **3D Virtual Museum Gallery**: An interactive Three.js 3D gallery space divided into historical epochs with museum artifacts and archival video screens.
3. **Dual-Screen TV Presentation Engine**: Real-time cross-device sync (Presentation API, BroadcastChannel, local network SSE relay) allowing a presenter on a laptop to drive a 4K TV display with laser-pointer tracking, live camera syncing, and Google Street View mirror.
4. **Voice-Activated AI Interface**: Voice command subsystem allowing hands-free verbal orchestration of timeline navigation, district focuses, museum tours, and analytical layers.

## Current Functionality & System Architecture

### 1. Core Timeline, Map Engine & Casualties

- **Interactive 100-Day Timeline**: April 6 to July 15, 1994 with frame-accurate scrubbing, keyboard navigation, and variable-speed playback (0.5x to 8x).
- **Executive Metrics Ribbon**: Real-time synchronization of date, day counter, genocide phase classification, cumulative lives lost counter, and daily estimated killing-rate velocity.
- **Dual-Engine Cartography**:
  - Analytical D3/SVG vector map with custom GeoJSON/TopoJSON projections for Rwanda, administrative boundaries, city typography, Lake Kivu, and regional borders.
  - Interactive heatmaps displaying temporal density of violence.
  - Coordinate tracking with inverted projection telemetry (Lat/Long HUD).
- **Casualty Distribution Model**: Logistic sigmoid mathematical curve modeling the acceleration and deceleration of nationwide extermination across the 100 days (1,000,000 estimated toll, inflection at Day 30, peak velocity ~32,500 deaths/day).

### 2. Multi-Spectral Display Modes

- **STD (Standard)**: High-contrast analytical vector cartography.
- **NVG (Night Vision Goggles)**: Tactical green phosphor military briefing filter.
- **CRT (Cathode Ray Tube / Google Satellite)**: Full-bleed Google Maps Satellite & Hybrid imagery integration.
- **FLIR (Forward-Looking Infrared)**: Thermal intensity visualization for casualties and density.
- **HIST (Historical Cohorts)**: Dedicated forensic mode highlighting documented wiped-out family lineages and historical sectors with suppressed operational noise.

### 3. Google Maps Satellite, Visit Kigali & 360° Street View

- **Integrated Google Maps Satellite Engine**: Lazily loaded Google Maps JavaScript API with Places, Geocoding, and Street View libraries.
- **Visit Kigali Hub**: Rapid search interface for modern Kigali landmarks, government buildings, hotels, and memorial sites.
- **Interactive ADM2 District Boundaries**: Native polygon overlays drawn over Google satellite imagery preserving Rwanda's 30 district borders without synthetic bounding boxes.
- **360° Street View Integration**: Automated coverage detection within a 120-meter radius of map center; candidate panorama scouting and seamless full-screen panoramic viewer.
- **Zoom & Coordinate Synchronization**: Seamless synchronization between SVG zoom controls, keyboard navigation, and Google Maps zoom levels (Z7 to Z20).

### 4. 3D Virtual Museum Gallery (Three.js WebGL)

- **Immersive Spatial Gallery Architecture**: Full 3D interactive museum built on Three.js, accessible directly from the dashboard (`museum.html` / modal overlay).
- **Four Thematic Architectural Epochs**:
  1. *Origins (1959–1973)*: Pre-colonial cohesion, colonial racialization, and early anti-Tutsi pogroms.
  2. *Preparation (1987–1993)*: Propaganda apparatus (RTLM, Kangura), extremist networks, and militia mobilization.
  3. *100 Days (1994)*: Systematic genocide execution, roadblock mechanics, and institutional complicity.
  4. *100 Testimonies & Justice*: Gacaca courts, UNESCO recognition, forensic preservation, and national rebuilding.
- **Interactive Exhibit Objects & Screens**: Raycasted 3D clickable museum plaques, dynamic spatial lighting, panoramic video display screens playing archival footage, draggable 3D timeline, and orbital camera navigation.
- **Live Data Integration**: Connects to dynamic Wikipedia museum collection datasets (`wikiMuseumData.js`).

### 5. Real-Time TV Cast & Presentation Synchronization

- **Cross-Device Presentation Architecture (`castSync.js`)**: Real-time unidirectional/bidirectional state synchronization between presenter laptop and external audience displays (Smart TVs, projectors, conference screens).
- **Four Synchronous Transport Layers**:
  1. *Presentation API*: Direct wireless casting via Chromecast, Google Cast, and AirPlay.
  2. *BroadcastChannel API*: Zero-latency multi-monitor / dual-window browser synchronization on the same device.
  3. *LocalStorage Storage Events*: Cross-tab state replication fallback.
  4. *Local Network SSE / HTTP POST Relay*: Direct Smart TV web browser connection over local Wi-Fi (`http://<local-ip>:5173/?cast=receiver`) without Chromecast hardware.
- **Full State Mirroring**: Day scrubbing, playback status, display mode, district highlights, modal openings, 3D Museum camera coordinates, and Google Maps pan/zoom/Street View states.
- **Smart TV Optimizations**:
  - Automatic 4K / HiDPI display detection (`display-4k` class) with physical 1:1 pixel rendering.
  - Auto-fullscreen triggering for bezel-to-bezel presentation views.
  - Automatic mouse cursor idle hiding after 2.5 seconds.
  - Live Presenter Laser Pointer dot overlaid on the TV display responding to presenter mouse hover on laptop.
  - Independent TV Street View coverage resolution ensuring Street View opens synchronously on the TV regardless of local tile caching.

### 6. Voice AI Interface ("Kwibuk AI")

- **Natural Language Voice Control**: Web Speech API speech recognition engine with continuous listening and audio feedback.
- **Comprehensive Voice Action Lexicon**:
  - Timeline: "Play", "Pause", "Jump to day 30", "Fast forward", "Slow down", "Speed 2x".
  - Geography: "Focus on Gasabo", "Show Butare", "Highlight Western Province", "Clear highlights".
  - Modes: "Switch to satellite", "Enter thermal mode", "Night vision", "Standard view".
  - Features: "Open 100 Voices", "Show memorials", "Toggle RPF advance", "Open 3D Museum", "Walk into origins gallery".
- **Audio Ducking**: Automatically attenuates background documentary audio when voice commands are spoken.
- **Automated Test Coverage**: Dedicated Node.js test suite for voice action parsing and state execution (`src/voice/*.test.mjs`).

### 7. RPF Inkotanyi Operational Advance Layer

- **Temporal Military Advance Corridors**: Day-by-day progression of RPF battalions and rescue columns across Rwanda from the northern border and CND building.
- **Dynamic Trail Fading Engine**: Per-segment path opacity rendering where older trail paths fade smoothly over time (5-second fade interval, proportional waypoint fading).
- **Commander & Unit Profiles**: Archival photographic assets and leadership biographies for unit commanders and deputy leaders.

### 8. Memorial & Survivor Testimony Archive

- **National Memorial Grid**: Display of 133 runtime memorial markers covering national, regional, and parish massacre sites across all 30 districts.
- **Curated High-Resolution Records**: 31 in-depth memorial dossiers, including the 4 UNESCO World Heritage Sites (Kigali Genocide Memorial / Gisozi, Nyamata, Murambi, Bisesero).
- **100 Voices Video Archive**:
  - YouTube dark-mode 4-column responsive grid with 12 videos per page across 9 paginated chapters.
  - Dedicated navigation tabs: *Home*, *Videos*, *Shorts*, *Podcast*, *Memory Keepers* (diaspora submissions), *Rwanda Tech* (integrated Jitsi live meeting room), and *● LIVE* broadcast channel.
  - Province-specific survivor testimony video assignments for localized event cards.
- **Representative Testimonies**: Curated survivor excerpts, historical context dossiers, and institutional archive references.

### 9. Infrastructure & Always-On Deployment

- **Always-On Local Background Daemon**: Windows Task Scheduler registration (`start-server.bat`, `start-server.vbs`, `setup-autostart.ps1`) enabling continuous, crash-resilient local server availability at `http://localhost:5173`.
- **Production Deployments**:
  - Primary Vercel Production: `https://kwibuka-spatial-intelligence.vercel.app/`
  - Vercel Production Alias: `https://kwibuka-spatial-intelligence-sable.vercel.app`
  - Git Repository: `https://github.com/kerifis/kwibuka-spatial-intelligence`
- **Enterprise SEO & Meta Architecture**: Full Open Graph, Twitter Cards, JSON-LD `WebApplication` semantic schema, Geo positioning metadata, XML sitemaps, and security headers.

## Data Coverage Summary

| Layer / Component | Verified Count | Notes |
|---|---:|---|
| Historical Event Records | 40 | Chronologically sequenced forensic event sites |
| Curated Memorial Dossiers | 31 | Detailed dossiers with video, photos, and narratives |
| Runtime Memorial Markers | 133 | Complete national coverage across all 30 districts |
| Administrative Districts | 30 | Grouped into 5 provinces (Kigali, East, North, West, South) |
| Curated Testimony Videos | 100 | Sourced from Aegis Trust, Rwanda TV, Kwibuka archive, Shoah Foundation |
| UNESCO World Heritage Sites | 4 | Gisozi (Kigali), Nyamata, Murambi, Bisesero |
| 3D Museum Gallery Rooms | 4 | Origins, Preparation, 100 Days, 100 Testimonies |
| Display Modes | 5 | STD, NVG, CRT (Google Maps), FLIR, HIST |
| Cast Sync Transports | 4 | Presentation API, BroadcastChannel, LocalStorage, SSE Network Relay |

### Curated Records Breakdown by Province

| Province | Event Sites | Curated Memorials | Primary Historic Locations |
|---|---:|---:|---|
| **Kigali** | 11 | 7 | CND, Mille Collines, Gisozi, Nyanza-Kicukiro, ETO Kicukiro, Camp Kigali |
| **Western** | 10 | 10 | Bisesero, Kibuye Cathedral, Gatwaro Stadium, Nyundo, Cyangugu |
| **Eastern** | 9 | 4 | Nyarubuye, Ntarama, Kiziguro, Rukumberi, Kabarondo |
| **Southern** | 6 | 6 | Murambi, Butare University, Kabgayi, Ruhango, Save |
| **Northern** | 4 | 4 | Ruhengeri, Byumba, Muhororo, Busogo |

## Executive Strategic Insights

### 1. Speed and Decentralization of Escalation
The timeline model demonstrates that following the April 6 assassination of President Habyarimana, the transition from targeted political assassinations in Kigali to organized mass killings across rural provinces occurred within 72 to 96 hours, demonstrating pre-planned operational readiness rather than spontaneous chaos.

### 2. Physical Geography vs. Modern Urban Reality
By bridging historical vector maps with Google Satellite CRT and 360° Street View, briefers can demonstrate how geographical terrain (hills, swamps, churches, stadiums) was exploited during the genocide, while contextualizing these locations within modern, rebuilt Rwanda.

### 3. Dual-Screen TV Casting as an Executive Briefing Tool
The new presentation sync subsystem allows high-level presenters to deliver structured briefings on a primary laptop/tablet while driving an unbranded, high-resolution 4K audience display with synced laser-pointer focus and synchronous Street View navigation.

### 4. Multimodal Immersion Through 3D & Voice
The combination of the 3D Virtual Museum and Voice AI transforms the application from a passive informational website into an active, museum-grade interactive installation suitable for permanent physical exhibits, embassies, and educational centers.

## Deployment Surfaces & Environments

- **Vercel Production URL**: `https://kwibuka-spatial-intelligence.vercel.app/`
- **Vercel Alias URL**: `https://kwibuka-spatial-intelligence-sable.vercel.app`
- **Local Dev / Presentation Server**: `http://localhost:5173` (Managed via background Task Scheduler daemon)
- **Direct TV Receiver Endpoint**: `http://<local-ip>:5173/?cast=receiver`
- **Source Repository**: `https://github.com/kerifis/kwibuka-spatial-intelligence`

## Caveats and Data Integrity Notes

1. **Casualty Model**: Cumulative fatalities are generated using an analytical logistic sigmoid distribution model (1,000,000 baseline) to illustrate velocity and acceleration. It represents an analytical model rather than a daily forensic census.
2. **Memorial Dataset Structure**: 31 records represent fully verified, deep-content memorial dossiers; 102 additional runtime markers provide geographic distribution for national coverage.
3. **Testimony Syntheses**: Textual overview cards synthesize documented survivor testimonies and historical archives for educational accessibility.
4. **Google Maps Services**: Street View, Satellite tiles, and Places lookups require an active internet connection and valid Google Maps Platform credentials.
5. **AI Synthesis**: The Gemini Day Intelligence summary generates contextual analysis starting after Day 45 as an analytical aid and requires a valid Gemini API key.

## Recommended Next Steps

1. **Official Registry Linkage**: Ingest direct MINUBUMWE / Aegis Trust registry IDs for all 133 memorial marker locations.
2. **Offline Presentation Packaging**: Package the 3D museum assets, tile caches, and core videos for air-gapped, zero-bandwidth museum kiosks.
3. **Multi-Language Audio & Voice**: Expand voice recognition and UI localization to full Kinyarwanda, French, and Swahili lexicons.
4. **Exportable PDF Intelligence Briefings**: Enable single-click generation of executive briefing PDF dossiers for any selected day, province, or memorial site.

