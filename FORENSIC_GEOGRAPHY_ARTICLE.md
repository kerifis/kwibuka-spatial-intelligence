# I Mapped A Genocide In A Browser. Here's Why Forensic Geography Matters.

## How spatial intelligence turns 100 days of history into a navigable, forensic truth

**By [Your Name]**  
**April 12, 2026**

I spent the weekend looking at a map that should not feel this visceral in a browser tab.

It is the 1994 political grid of Rwanda, a historical geography that no longer maps cleanly onto the administrative boundaries most people recognize today. But for 100 days in 1994, that geography became the coordinate system for catastrophe.

I built a tool called **Kwibuka '94** to test a question that has been sitting with me for a while: can spatial intelligence do for history what it does for modern surveillance and security work? Can it turn abstract data into something localized, navigable, and harder to ignore?

When you look at a spreadsheet that says "1,000,000 lives lost," the mind protects itself with abstraction. But when you scrub through a timeline and see heat intensify across Rwanda, when event markers appear in sequence and memorial sites anchor the terrain, the abstraction starts to collapse.

The map becomes less like a chart and more like a witness.

## What is happening under the hood

The foundation is not a live satellite feed. It is a forensic reconstruction.

Most map applications begin with present-day geography. Kwibuka '94 instead uses historical context as the interpretive frame: a Rwanda map experience built around the genocide period, a historical overlay, geolocated event data, memorial records, and a 100-day timeline.

The goal is not to simulate certainty where none exists. The goal is to make historical sequence and geography legible at the same time.

On top of the map, I layered several analytical systems.

## The sigmoid growth model

The death toll was not linear.

The app uses a mathematical S-curve to model the acceleration of the genocide across the 100-day period. This matters because a straight-line model would flatten the horror into a steady rate. The sigmoid curve shows something closer to the analytical reality: escalation, peak intensity, and eventual taper.

It is a model, not a forensic ledger. But as a briefing device, it helps the viewer understand scale, acceleration, and cumulative loss without pretending that every day can be reduced to a perfectly verified number.

## The archival testimony layer

The map includes memorial markers for sites such as Kigali, Murambi, Nyamata, and Bisesero. Click a marker and the experience changes. You are no longer just looking at coordinates or casualty estimates. You are looking at memorial context, site descriptions, testimony-informed narrative, and links into archival and educational resources.

That design choice matters.

A genocide map that only shows dots risks becoming another abstraction. A memorial layer forces the interface to account for human memory, burial sites, preservation work, survivor accounts, and the institutions that hold this history in public view.

## The spectral interface

The app also includes visual modes inspired by intelligence and sensor systems: night vision, CRT, FLIR-style thermal rendering, and a historical map view.

That may sound aesthetic at first, but the design logic is serious. Surveillance interfaces are built to extract signal from noise. Here, that same visual language is turned toward historical remembrance. Thermal mode highlights intensity. Night vision makes the map feel operational. The timeline behaves like an intelligence scrubber.

The effect is unsettling on purpose.

It shifts the experience from "looking at a map" to investigating a crime scene across time.

## How I built it

This was not a months-long development cycle. It was a weekend prototype, built in the spirit of fast, iterative AI-assisted development.

The stack is intentionally lightweight: browser-native UI, D3-based SVG mapping, JSON data layers, a custom timeline engine, and modular JavaScript for heatmaps, markers, memorial cards, filters, and statistics.

Different parts of the system emerged as focused workstreams:

- Map geometry and projection.
- Temporal playback and event sequencing.
- Province-level distribution modeling.
- Memorial markers and testimony cards.
- Display modes and visual atmosphere.
- AI-assisted synthesis.

The most surreal part is the **AI Synthesis Layer**.

I integrated a Gemini-powered briefing feature directly into the dashboard. When the timeline reaches Day 45, the user can trigger an "Analyze '94 Matrix" action. The model receives the current day, cumulative estimate, killing-rate estimate, and active event count, then synthesizes that spatial state into a short intelligence-style report.

That is the bridge I care about: from dots on a map to a human-readable situational brief.

## Why I built this: spatial intelligence as memorial

I have been thinking about the idea that AI should understand space as well as it understands text.

In security contexts, spatial intelligence can feel like "God mode": total visibility, pattern detection, persistent observation.

In historical and human rights contexts, the same capabilities can become something else: truth mode.

By attaching testimony, memorial records, event locations, and temporal models to place, we move from reading about the past to navigating the environment of the past. The user is not just told that atrocities happened. They are shown how events unfolded across territory, how quickly violence moved, and how remembrance now marks the landscape.

That is spatial intelligence used for memory rather than domination.

## Why accessibility is the moat

The intelligence community has had forensic mapping for decades. Human rights investigators, journalists, courts, and researchers have also used geospatial analysis to document violence, verify evidence, and reconstruct events.

But those tools often sit behind institutional, technical, or financial walls.

What changes when this kind of interface can run in a browser?

The data is not the only innovation. Much of the underlying historical material comes from public archives, memorial institutions, and open records. The shift is accessibility: the ability to turn public memory into an interactive spatial layer that educators, students, curators, and communities can actually use.

We are entering an era where the visual language of the state, such as targeting reticles, thermal scans, sensor overlays, and satellite-style dashboards, can be redirected toward public accountability.

Not surveillance from above.

Remembrance from below.

## Where this goes

Kwibuka '94 is a prototype. It is a proof of concept for a broader **Spatial Intelligence Stack**.

The next version needs stronger source attribution, verified memorial registry data, clearer methodological notes, and a more formal distinction between direct testimony, representative testimony summaries, and archival context. It should also support exportable briefing snapshots and deeper source trails for historians, educators, and institutions.

But the larger goal is simple:

Build systems that do not only show us where we are. Build systems that remember what happened where we stand.

When the physical world becomes queryable by AI, history can become a living layer of the environment.

At some point, it stops feeling like a dashboard.

It starts feeling like a witness.

If you are interested in forensic geography, memorial technology, and the future of spatial intelligence, let's map the truth together.

