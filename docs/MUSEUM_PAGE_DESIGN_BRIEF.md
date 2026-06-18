# Museum Virtual Page — Design Brief & Build Prompt

> Reverse-engineered design DNA from **elyonexus-ten.vercel.app**, adapted for the
> KWIBUKA virtual museum landing page. This document has two layers:
>
> 1. **Structural / craft DNA** — what to *copy* (layout system, motion, component
>    patterns, polish). This is provider-agnostic and works for any subject.
> 2. **Tone divergence** — what to *deliberately change*. Elyonexus is a playful VR
>    arcade. KWIBUKA is a genocide memorial. The skeleton transfers; the skin must not.
>    Where the source is loud, neon and hype-driven, the museum is restrained, solemn,
>    and archival. **Read every guideline through that lens.**

---

## 0. The one-paragraph prompt (paste into an AI builder / hand to a dev)

> Build a single-page, dark-themed, scroll-driven landing page for a virtual museum
> memorializing the 1994 Genocide against the Tutsi. Mirror the *structure and motion
> craft* of a modern immersive-experience site: a fixed translucent header with a single
> primary CTA, a full-bleed hero with one strong headline + one supporting line + two
> CTAs, then cascading sections (room/gallery carousel, numbered "how to visit" steps,
> a 60-second video preview, value/feature grid, testimony cards, a closing CTA band,
> and a multi-column footer). Use generous vertical spacing, scroll-reveal fade-ups,
> a 12-column grid, image cards with overlay metadata badges, and a sticky CTA. **But
> invert the emotional tone:** replace neon/cyberpunk energy with a muted, reverent,
> archival palette (deep charcoal, bone/ash neutrals, a single restrained accent),
> serif or humanist headlines, no bouncy/hype animations, no "fun"/sales language.
> Copy is quiet, factual, and dignified. The page is an entrance to a 3D memorial
> experience, not a product to be sold.

---

## 1. Source design DNA (Elyonexus) — observed

### Page architecture (top → bottom)
1. **Fixed header** — logo left, nav center/right (Experiences ▾, Packages, Private
   Events, Corporate Events, FAQs, Deals), single high-contrast **Book Now** button.
2. **Hero** — short bold headline (*"Fun Just Got Upgraded"*), one supporting sentence,
   **two CTAs** (primary "Book your experience" + secondary "Explore all rides"),
   atmospheric feature image.
3. **Carousel** — 9 titles scrolling horizontally with cover art.
4. **Feature grid** — image cards with **overlay badges** ("Most Popular", "Must Try",
   "Sells out fast"), a one-line value tag, a price anchor, and a "Learn more" link.
5. **Video preview** — single embedded clip, *"A 60-second look inside the nexus."*
6. **How it works** — 4 **numbered** steps (01–04).
7. **Three-column offerings** — image + heading + blurb + CTA per column.
8. **Why-choose feature grid** — 6 short value items (icon + label).
9. **Testimonials** — 4 quote cards with name + role attribution.
10. **CTA band** — community/email signup, one headline, one button.
11. **Footer** — 4 link columns + address + 5 social icons.

### Visual language
- **Mood:** dark, high-contrast, futuristic/cyberpunk; hero-first; conversion-driven.
- **Color:** near-black backgrounds, neon electric accents (cyan/blue/purple), saturated
  cover art, white text.
- **Type:** bold sans headlines, light body, selective UPPERCASE for section markers and
  numbers; strong hierarchy.
- **Spacing:** generous whitespace, contained readable column widths, consistent padding.
- **Components:** image-header cards with overlay badges, price anchors, numbered steps,
  carousel rotation, attributed testimonial cards.
- **CTAs:** repeated, prominent, distinctly styled — multiple touchpoints.

---

## 2. What to KEEP (structural DNA → museum)

| Elyonexus pattern | Keep as-is for the museum | Museum equivalent |
|---|---|---|
| Fixed translucent header + single primary CTA | ✅ | CTA = **"Enter the Memorial"** |
| Hero: 1 headline + 1 line + 2 CTAs | ✅ | "Enter" (3D) + "Begin with testimony" |
| Horizontal carousel of cover art | ✅ | The **four rooms** (Origins / Preparation / 100 Days / 100 Testimonies) |
| Image cards w/ overlay metadata badge | ✅ | Badge = era ("1959–1973"), not "Most Popular" |
| Numbered process steps (01–04) | ✅ | "How to visit" → Enter → Walk the timeline → Hear testimony → Reflect |
| 60-second video preview | ✅ | A quiet walkthrough preview of the 3D space |
| Feature/value grid (6 items) | ✅ | Facts: "40+ documented events", "16 memorial sites", "100-day timeline", "1,000,000 lives" |
| Attributed testimony cards | ✅ | Survivor testimony excerpts (already in `data/memorials.json`) — **highest-fidelity transfer; this is the heart, not social proof** |
| Closing CTA band | ✅ | "Remember. Learn. Never again." → newsletter / archive link |
| Multi-column footer + address | ✅ | Sources, archive credits, Kigali Genocide Memorial address |
| Scroll-reveal, generous spacing, 12-col grid | ✅ | identical craft |

---

## 3. What to CHANGE (tone divergence — non-negotiable)

| Dimension | Elyonexus | KWIBUKA museum |
|---|---|---|
| **Emotion** | Hype, fun, adrenaline | Reverence, grief, witness, dignity |
| **Palette** | Neon cyan/purple on black | Deep charcoal `#0E0E0D`, bone `#E8E2D6`, ash `#9A968C`, **one** restrained accent: muted ember/clay `#B5562E` *or* deep indigo `#2B3A55`. No neon. |
| **Accent use** | Glows everywhere | Hairline only — underlines, 1px borders, the single CTA. Never a glow. |
| **Headlines** | Bold geometric sans | Humanist serif (e.g. *Fraunces*, *Source Serif*, *Newsreader*) or a quiet grotesk (*Inter Tight*, low weight). Large but calm. |
| **Body** | Marketing copy | Factual, sourced, plain. Present tense for testimony. No exclamation marks. |
| **Badges** | "Sells out fast" | Years / provinces only. Never urgency or scarcity. |
| **Motion** | Bounce, parallax, flicker | Slow opacity fade-up (400–600ms, ease-out), ≤16px travel. Respect `prefers-reduced-motion`. No flicker, no bounce. |
| **CTAs** | "Book Now" ×many | One primary verb: **"Enter."** Quiet secondaries. No sales pressure. |
| **Imagery** | Saturated game art | Desaturated archival photography, memorial sites, landscape. Tasteful, never graphic/exploitative. |
| **Sound/video** | Energetic | Ambient, optional, muted by default, user-initiated. |

---

## 4. Design tokens (drop-in starting point)

```css
:root {
  /* surface */
  --bg-0: #0E0E0D;   /* page */
  --bg-1: #16150F;   /* raised card */
  --bg-2: #1F1D16;   /* hover / nav blur fill */

  /* ink */
  --ink-hi: #E8E2D6; /* headlines */
  --ink-md: #B8B2A6; /* body */
  --ink-lo: #7E7A70; /* captions, meta */

  /* single accent (pick ONE; ember shown) */
  --accent:    #B5562E;
  --accent-lo: #7A3A1F;

  /* lines */
  --hairline: rgba(232,226,214,0.10);

  /* type */
  --font-display: "Fraunces", Georgia, serif;
  --font-body: "Inter", system-ui, sans-serif;

  /* rhythm */
  --space-section: clamp(72px, 12vh, 160px);
  --maxw: 1200px;
  --radius: 6px; /* small — archival, not bubbly */

  /* motion */
  --ease: cubic-bezier(.2,.6,.2,1);
  --rise: 420ms;
}
@media (prefers-reduced-motion: reduce){
  * { animation: none !important; transition: none !important; }
}
```

- **Type scale:** 64 / 40 / 28 / 20 / 16 / 13 (clamp for fluidity).
- **Section markers:** UPPERCASE, `letter-spacing: .18em`, `--ink-lo`, 13px. (This one
  Elyonexus mannerism — small uppercase eyebrows — transfers well and reads as archival.)
- **Numbers (01–04):** large, `--font-display`, low opacity, behind the step text.

---

## 5. Section-by-section build spec (museum)

1. **Header** — fixed, `backdrop-filter: blur(12px)`, bg `rgba(14,14,13,.7)`, 1px bottom
   hairline. Left: "KWIBUKA". Nav: Rooms ▾ (Origins/Preparation/100 Days/Testimonies),
   Timeline, Memorials, About, Sources. Right: single **Enter** button (accent outline,
   fill on hover).
2. **Hero** — full viewport. Eyebrow "1994 · RWANDA". Headline (serif, calm):
   *"One hundred days. One million names."* Supporting line: factual, ~20 words.
   CTAs: **Enter the memorial** (primary) · **Begin with testimony** (text link + arrow).
   Background: desaturated full-bleed image at ~35% opacity over `--bg-0`, slow ken-burns
   ≤1.04 scale (disable on reduced-motion).
3. **The Four Rooms** — horizontal scroll-snap carousel; each card: cover image,
   era badge, room name, one line. Links into `museum.js` rooms.
4. **How to visit** — 4 numbered steps, large faded numerals.
5. **Walkthrough video** — single muted-by-default preview, click to play with sound.
   Caption: "A quiet walk through the space."
6. **The record (feature grid)** — 6 quiet facts (sourced).
7. **Testimony** — 3–4 attributed excerpt cards (name + place + year). Most important
   block on the page — give it the most space and the least decoration.
8. **Closing band** — *"Remember. Learn. Never again."* + one action.
9. **Footer** — columns: The Museum / The Record / Sources & Credits / Visit (address:
   Kigali Genocide Memorial, Gisozi). Restrained social row. Land-acknowledgement-style
   sources note.

---

## 6. Build checklist
- [ ] Tokens in `:root`; no hard-coded colors in components.
- [ ] 12-col grid, `--maxw` container, `--space-section` rhythm.
- [ ] Every reveal honors `prefers-reduced-motion`.
- [ ] One accent color only; zero neon glow.
- [ ] No urgency/sales language anywhere in copy.
- [ ] Testimony block reviewed for dignity (no graphic imagery, sources cited).
- [ ] Hero CTA wires to the existing 3D experience (`src/museum.js`).
- [ ] AA contrast on all text (`--ink-md` on `--bg-0` ≥ 4.5:1 — verify).
- [ ] Lighthouse: a11y ≥ 95, no layout shift from late-loading hero image.

---

*Craft from Elyonexus. Tone from the subject. When in doubt, choose restraint.*
