# KWIBUKA 1994 MAP

> *"Kwibuka" means "to remember" in Kinyarwanda.*

An interactive spatial intelligence dashboard visualizing the 1994 Genocide against the Tutsi in Rwanda. The application renders 40+ geolocated historical events, 31 memorial sites with survivor testimony, and 9 RPF advance routes across a 100-day interactive timeline — reaching 1,000,000 estimated lives lost using a sigmoid growth curve.

**Live:** [https://kwibuka-spatial-intelligence-sable.vercel.app](https://kwibuka-spatial-intelligence-sable.vercel.app)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Run tests:
```bash
npm test
```

## Environment

Create a `.env` file from `.env.example`:

```bash
# Google Maps (for Street View in CRT mode)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_browser_key_here

# OpenAI Realtime Voice Control
OPENAI_API_KEY=your_openai_api_key_here
```

## Features

**AI Voice Control** — Live hands-free voice command system powered by OpenAI's Realtime API over WebRTC:
- **Dual Activation**: Click the header mic button to toggle open-mic conversation, or hold `Space` for push-to-talk.
- **15 Voice Actions**: Jump to any timeline day (*"Go to Day 30"*), play/pause (*"Play timeline"*), change speeds (*"Speed up to 2x"*), switch display modes (*"Night vision"*, *"Thermal mode"*), focus districts with animated heatmap pulses (*"Focus on Bugesera"*), toggle layers (Memorials, RPF routes, HIST, Death counts), open testimonies, and trigger AI synthesis.
- **Visual Feedback**: Real-time 15-bar Web Audio API frequency visualizer (green for user speech, amber for assistant output).
- **Cost Guard**: Standard (`gpt-realtime-2`) and Mini (`gpt-realtime-2.1-mini`) tier toggling with live estimated spend tracking and automatic runaway cap ($5.00).
- **Intelligent Audio Ducking**: Automatically ducks background music during conversation and restores volume when idle.

**100-Day Timeline** — Drag the scrubber or play at 0.5x/1x/2x/4x/8x speed (default 0.5x). The map populates dynamically as the genocide spreads geographically from Kigali outward across all five provinces.

**Sigmoid Distribution Model** — A logistic curve with inflection at day 30 models the cumulative toll (~33,000 lives/day peak), with per-province onset offsets matching the historical record.

| Province | Onset | Share |
|----------|-------|-------|
| Kigali | Day 0 | 18% |
| Eastern | Day 3 | 20% |
| Northern | Day 4 | 15% |
| Western | Day 9 | 22% |
| Southern | Day 13 | 25% |

**31 Memorial Sites** — Diamond markers distinguish memorial sites from event markers. Click any site for a tabbed card:
- **Overview** — Description, establishment date, UNESCO / National / Regional badge
- **Testimony** — Representative survivor accounts grounded in documented archives
- **Resources** — Direct links to Genocide Archive Rwanda, UNESCO, Aegis Trust, Google Arts & Culture
- **Video** — Curated archive footage from Aegis Trust, United Nations, and USC Shoah Foundation

**RPF Offensive Layer** — 9 mobile force advance routes animate across the timeline from Day 1, showing the RPA's three-phase counter-genocide operation. Click any unit marker for a command card showing commander and deputy with rank, photo portrait slots, estimated lives saved, and unit axis description.

**Historical Map (HIST)** — Toggle an interactive administrative map with documented wiped-out-family cohorts. Select an area from the map or side panel to highlight its location; tactical RPF routes are hidden while HIST is active.

## Production Build

```bash
npm run build    # Output to dist/
npm run preview  # Preview the build
```

## License

MIT. Data sourced from public archives and open datasets. Testimony texts are representative composites based on documented survivor accounts, not direct quotes from named individuals.
