# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: existing Vite + TypeScript + Leaflet application

## Users

Inferred from the existing interface: people who need to inspect Western Pacific tropical cyclone activity in a browser, especially users comparing current tracks or looking up past storms.

## Product Purpose

The site brings together current typhoon tracks from JMA, CMA, CWA, and JTWC, shows observed and forecast paths with wind-radius context, and provides a searchable historical archive. Success means the user can identify the active storm picture or retrieve an archive path without losing source provenance.

## Positioning

The useful mechanism is source comparison in one map: the page exposes small differences between agencies instead of presenting a single opaque forecast line.

## Operating Context

The primary workflow is scan the live map, compare source cards, inspect tooltips or the latest storm point, switch to the archive, filter by year or name, and select a storm to render its historical path.

## Capabilities and Constraints

- Live sources may be unavailable; the app reports unavailable sources and can fall back to local demo data.
- Live data refreshes automatically every five minutes and can be refreshed manually.
- Historical data is served from local year shards covering the existing archive range.
- The existing Vite, TypeScript, Leaflet, and static multi-page entry points remain in place.

## Brand Commitments

The existing product language is Chinese-first with English source abbreviations and technical labels. Keep JMA, CMA, CWA, JTWC, WGS84, observed, forecast, and archive terminology recognizable.

## Evidence on Hand

- Live and demo track data: `src/lib/typhoon-api.ts`, `src/data/typhoons.ts`
- Historical archive index and year shards: `public/data/typhoons/`
- Existing workflows: `typhoon.html`, `src/pages/typhoon.ts`
- Behavior tests: `tests/`

## Product Principles

- Source provenance should remain visible.
- Map context comes before decoration.
- Unavailable data must be explained, not hidden.
- Live and archive workflows must be easy to distinguish.

## Accessibility & Inclusion

Use semantic controls, visible focus states, keyboard-operable filters and history results, readable contrast, and reduced-motion support. Verify the responsive page at the project’s required desktop and mobile widths.

## Open Decisions

The primary audience, brand assets, and deployment target were not supplied directly by the user; the statements above are inferred from the existing repository and should be confirmed if the product expands beyond this monitoring surface.
