# Executive Briefing: KWIBUKA Spatial Intelligence Map

## Purpose

The KWIBUKA Spatial Intelligence Map is an interactive geospatial briefing tool for understanding the temporal and geographic spread of the 1994 Genocide against the Tutsi in Rwanda. It combines a 100-day timeline, event-level markers, memorial site records, survivor testimony context, historical map overlays, and a modeled casualty curve into a single executive-facing visualization.

The tool is designed for remembrance, education, strategic briefings, museum interpretation, research orientation, and rapid situational understanding of how violence unfolded across Rwanda from April 6, 1994 through mid-July 1994.

## Bottom Line

The map translates a national catastrophe into a spatial and temporal intelligence view. Its central value is not only showing where events occurred, but helping an audience see how quickly targeted violence moved from trigger events in Kigali to nationwide extermination patterns across all provinces.

The experience is strongest as an executive briefing layer: it gives leaders, educators, curators, and analysts a concise way to move from national scale to local sites, from aggregate estimates to named locations, and from operational spread to memorialized human consequence.

## What The Map Shows

- A timeline-driven map of Rwanda during the genocide period.
- 40 documented historical event sites from the project data.
- 31 curated memorial records in the source dataset, including 4 UNESCO World Heritage memorial sites.
- A runtime memorial layer expanded to 133 mapped memorial markers for national coverage.
- A modeled cumulative casualty estimate reaching approximately 1,000,000 lives lost.
- Province-level onset timing and distribution assumptions.
- Memorial information cards with overview, testimony, resources, and video references.
- Display modes for standard, night-vision, CRT, FLIR-style, and historical map viewing.
- A locked AI synthesis feature that activates after day 45 and generates day-specific briefing text when a Gemini API key is supplied.

## Executive Insights

### 1. The escalation was rapid and geographically distributed

The timeline shows the initial trigger in Kigali on April 6, 1994, followed almost immediately by killings, assassinations, and military events. Within the first two weeks, event markers spread beyond Kigali into Northern, Eastern, Western, and Southern provinces.

### 2. Kigali is the ignition point, not the full story

Kigali anchors the earliest phase and contains the highest count of early mapped events, but the spatial distribution shows the genocide as a nationwide system. The tool makes that transition visible as the timeline advances.

### 3. Memorial geography turns the map from incident tracking into remembrance infrastructure

The memorial layer reframes the dashboard from historical incident visualization into a remembrance network. UNESCO, national, and regional memorial markers help users connect mass violence, burial sites, preservation institutions, testimony, and public memory.

### 4. The casualty curve is a model, not a forensic ledger

The map uses a sigmoid model to estimate cumulative lives lost over time. This is useful for briefing and pattern recognition, but it should be presented as an analytical model rather than a verified day-by-day casualty count.

### 5. The most important interpretive bridge is testimony

The strongest human-centered feature is the memorial card system. It allows the user to move from abstract totals to site-specific remembrance, archival context, and survivor-centered narrative material.

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
| Provinces modeled | 5 |
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

## Use Cases

- Executive briefings on genocide history, escalation patterns, and remembrance infrastructure.
- Museum or memorial interpretation for guided walkthroughs.
- Classroom and university instruction on spatial history and mass atrocity prevention.
- Research orientation before deeper archival investigation.
- Demonstration of how spatial intelligence tools can support human rights education.
- Prototype foundation for a future verified archival platform.

## Strategic Value

The map is effective because it compresses a complex historical sequence into an interface that remains navigable under time pressure. A user can brief the first days, advance through national spread, inspect major event sites, switch to memorial context, and summarize the modeled humanitarian impact without leaving the dashboard.

For leadership audiences, this provides three levels of understanding:

- Temporal: how the genocide accelerated over the 100-day period.
- Spatial: how violence spread across provinces and localities.
- Memorial: how the country preserves, marks, and teaches the history today.

## Caveats And Integrity Notes

- The casualty timeline is modeled with a sigmoid curve and should not be described as a verified daily count.
- The source data contains 31 curated memorial records; the application currently synthesizes additional local memorial placeholders at runtime to reach 133 displayed markers.
- Testimony text is described in the project as representative composite material based on documented survivor accounts, not direct quotations from named individuals.
- Some README references still mention 16 memorial sites, while the current data and UI have evolved beyond that number.
- The historical event layer is selective and should be expanded with verified archival or scholarly datasets before being used as a comprehensive historical record.

## Recommended Next Steps

1. Replace synthesized memorial placeholders with verified official memorial registry records.
2. Add source citations per event and memorial, including archive links and confidence levels.
3. Clarify the timeline frame in the interface so day count, date range, and "100 days" language are fully aligned.
4. Add a methodology panel explaining the sigmoid model, provincial onset assumptions, and known limitations.
5. Separate direct testimony, representative composites, and archival summaries with clear labels.
6. Add exportable briefing snapshots for selected days or phases.
7. Prepare a formal source bibliography for public, educational, or institutional use.

## Briefing Position

KWIBUKA Spatial Intelligence is best positioned as a powerful remembrance and orientation dashboard rather than a definitive historical database. With stronger source attribution and replacement of synthetic memorial placeholders, it can mature into a credible public-facing educational and analytical platform.

