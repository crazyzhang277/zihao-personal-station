---
name: West Pacific Observation
description: A source-comparison desk for live and historical Western Pacific typhoon tracks.
colors:
  background: "#0b1214"
  surface: "#111b1d"
  surface-elevated: "#172527"
  foreground: "#edf5f3"
  foreground-soft: "#c2d1ce"
  muted: "#8da39f"
  cyan: "#5bd6cf"
  amber: "#f3bb63"
  red: "#f3786d"
  green: "#83d3a7"
  border: "rgba(204, 230, 225, 0.16)"
typography:
  display:
    fontFamily: "Avenir Next, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "clamp(2.4rem, 6.2vw, 5.5rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "0.02em"
  body:
    fontFamily: "Avenir Next, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "IBM Plex Mono, Cascadia Mono, Consolas, monospace"
    fontSize: "0.62rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  sm: "4px"
  md: "8px"
spacing:
  compact: "0.5rem"
  control: "0.8rem"
  section: "1rem"
  hero: "clamp(2rem, 5vw, 4rem)"
components:
  button-mode-active:
    backgroundColor: "{colors.cyan}"
    textColor: "{colors.background}"
    rounded: "{rounded.sm}"
    height: "2.75rem"
    padding: "0.35rem 0.9rem"
  input-search:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    height: "2.55rem"
    padding: "0.45rem 0.65rem"
  source-card:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.foreground-soft}"
    rounded: "{rounded.sm}"
    padding: "0.9rem"
---

# Design System: West Pacific Observation

## Overview

**Creative North Star: "The Spectral Weather Desk"**

The interface is a dark operations desk for comparing moving weather evidence. Deep charcoal-green surfaces keep the map and data legible; cyan marks live observation, amber marks risk or comparison, and red/green states carry source and intensity meaning. The system is dense by design, but each layer has a clear job: title, controls, map, source records, then archive detail.

The visual world is technical without becoming a generic blue dashboard. It uses a quiet neutral ground, short uppercase mono labels, restrained borders, and small-radius framed tools. Motion is limited to load/reveal and state transitions, with reduced-motion overrides for users who request less movement.

**Key Characteristics:**

- Map-first monitoring layout with a fixed source comparison rail.
- Dark tonal surfaces with a small, semantic status palette.
- Mono labels for provenance and sans-serif Chinese content for scanning.
- Fine borders and 4px/8px corners; no oversized decorative cards.

## Colors

The palette treats the map as the only light field and keeps the surrounding desk dark, so data colors remain visible without relying on gradients.

### Primary

- **Signal Cyan** (#5bd6cf): Live state, active mode, focus ring, and observation path accents.
- **Warning Amber** (#f3bb63): Compare marker, typhoon intensity cue, and data-source attention state.

### Secondary

- **Alert Red** (#f3786d): JMA/source identity and severe or unavailable states.
- **Clear Green** (#83d3a7): Healthy source status and live tracking indicator.

### Neutral

- **Desk Black** (#0b1214): Page background and popup surface.
- **Desk Surface** (#111b1d): Primary framed tools and metric strip.
- **Raised Surface** (#172527): Source cards, controls, and history detail.
- **Primary Text** (#edf5f3): Main headings and critical values.
- **Soft Text** (#c2d1ce): Supporting values and readable copy.
- **Muted Text** (#8da39f): Labels, timestamps, and secondary guidance.
- **Hairline** (rgba(204, 230, 225, 0.16)): Structural borders and dividers.

### Named Rules

**The Map Is the Light Rule.** The map is the only bright field; surrounding UI stays dark so path and marker colors retain hierarchy.

## Typography

**Display Font:** Avenir Next / Segoe UI with PingFang SC and Microsoft YaHei fallbacks
**Body Font:** Avenir Next / Segoe UI with Chinese system fallbacks
**Label/Mono Font:** IBM Plex Mono / Cascadia Mono / Consolas

**Character:** Humanist sans-serif Chinese text stays comfortable at reading sizes while mono labels create a precise operational register. Display type is bold and compact without negative tracking.

### Hierarchy

- **Display** (700, `clamp(2.4rem, 6.2vw, 5.5rem)`, `0.98`): The page identity in the first viewport.
- **Headline** (700, `clamp(1.6rem, 3vw, 2.4rem)`, `1.12`): Section titles such as 实时态势 and 多源对比.
- **Title** (700, `1.05rem`, `1.12`): Source and archive record names.
- **Body** (400, `16px`, `1.55`): Explanatory copy and values that need scanning.
- **Label** (600, `0.62rem`, `0.12em`, uppercase): Source, mode, time, and coordinate metadata.

### Named Rules

**The Two-Layer Label Rule.** Pair a short mono label with a readable Chinese title; metadata never replaces the content title.

## Layout

The page uses a full-width workbench inside a `1440px` max-width shell with responsive gutters. The hero uses a two-column readout on desktop and stacks on small screens. The monitoring area uses a flexible map column and a `22rem` source rail from `1040px` upward. Below that breakpoint, the map and source rail become a single vertical flow. Metric cells collapse from four columns to two at `820px`, and the mode/filter controls stack at the same breakpoint.

Spacing follows a dense 8px rhythm for controls and a 16px rhythm for sections. The map has a stable `clamp(430px, 62vh, 720px)` height on desktop and a `62vh`/`390px` minimum on narrow screens to keep geographic context inspectable.

## Elevation & Depth

Depth comes from tonal layering and a restrained ambient shadow rather than floating glossy cards. Borders establish tool boundaries; `--panel-shadow` is reserved for the map/source workbench and Leaflet overlays.

### Shadow Vocabulary

- **Workbench ambient:** `0 18px 48px rgba(0, 0, 0, 0.18)` for map and source panels.

## Shapes

Tools use 4px corners, while larger framed surfaces remain square enough to read as work equipment. Status badges are the only pill-shaped elements. Borders are thin and low-contrast at rest, with cyan focus/active states that do not shift layout.

## Components

### Buttons

- **Shape:** compact squared controls with 4px corners (`var(--radius-sm)`).
- **Mode:** active mode uses Signal Cyan; inactive mode uses a tonal surface and muted text.
- **Icon action:** refresh uses a 2.75rem square hit area with a familiar arrow symbol and a visible title/accessible label.
- **Hover / Focus:** border and surface brighten over 180ms; focus uses a 2px cyan outline.

### Chips

- **Style:** status badges use a 999px radius, low-alpha surface, and mono label.
- **State:** healthy/live uses green; loading/demo uses amber; the label remains textual so color is not the only signal.

### Cards / Containers

- **Corner Style:** 4px for source cards and archive details; map and rail panels use 0px outer corners.
- **Background:** surface-1 for tools, surface-2 for records.
- **Shadow Strategy:** workbench ambient shadow only; source cards rely on tonal contrast and a 2px source-color top line.
- **Border:** 1px hairline, with 2px source line for provenance.
- **Internal Padding:** `0.8rem` to `1rem` for dense data records.

### Inputs / Fields

- **Style:** 1px strong border, raised surface, 4px radius, 2.55rem minimum height.
- **Focus:** cyan border and raised background, with the global visible focus ring.
- **Error / Disabled:** muted copy explains unavailable sources; disabled refresh uses wait cursor and reduced opacity.

### Navigation

The desktop nav is a compact single active route with a cyan underline. The mobile nav collapses to a 2.75rem menu control, supports Escape to close, and keeps the same active route and label.

### Monitoring Workbench

The map occupies the primary column, with coordinate corners, a source-aware legend, and Leaflet controls. The rail lists source cards in source color order and turns into the archive result/detail stack in history mode. Live and archive are a segmented control so the current data meaning is always visible.

## Do's and Don'ts

### Do:

- **Do** keep source identity, observed/forecast meaning, and unavailable states visible in text.
- **Do** use cyan for active interaction and keep alert colors semantic.
- **Do** reserve the large first viewport for the map and the primary monitoring task.
- **Do** test the map and filter stack at 375px, 820px, 1040px, and 1440px widths.

### Don't:

- **Don't** add decorative dashboards, gradients, or motion that compete with map reading.
- **Don't** use color alone to communicate source health or storm strength.
- **Don't** hide the source rail or archive filters behind a hover-only interaction.
- **Don't** use small icon-only controls without an accessible name and stable hit area.
