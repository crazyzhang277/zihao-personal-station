# Radar Page Overrides

> **PROJECT:** West Pacific Observation
> **Generated:** 2026-08-08 20:22:26
> **Page Type:** Dashboard / Data View

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Layout Overrides

- **Max Width:** 1400px or full-width
- **Grid:** 12-column grid for data flexibility
- **Sections:** 1. Hero (product + live preview or status), 2. Key metrics/indicators, 3. How it works, 4. CTA (Start trial / Contact)

### Spacing Overrides

- **Content Density:** High — optimize for information display

### Typography Overrides

- No overrides — use Master typography

### Color Overrides

- **Strategy:** Deep charcoal-green neutral desk with cyan live signals, amber comparison cues, red source/intensity signals, and green healthy-source signals.
- **Background:** `#0b1214`; surfaces `#111b1d` and `#172527`; foreground `#edf5f3`.
- **Typography:** System sans for Chinese content; mono labels for source, time, coordinate, and status metadata.

### Component Overrides

- Avoid: Single row actions only
- Avoid: Auto-play high-res video loops

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: Real-time chart animations, alert pulse/glow, status indicator blink animation, smooth data stream updates, loading effect
- Data Entry: Allow multi-select and bulk edit
- Sustainability: Click-to-play or pause when off-screen
- CTA Placement: Primary CTA in nav + After metrics

### Implemented Surface Notes

- Map-first two-column workbench from 1040px upward, with a 22rem source rail.
- The archive reuses the source rail for year/search filters, result list, and selected-track detail.
- Active controls use a 4px radius; status badges are the only pill-shaped element.
