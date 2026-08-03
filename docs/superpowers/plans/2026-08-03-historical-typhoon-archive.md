# Historical Typhoon Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deployable 1980-present Western Pacific historical typhoon archive to the existing Leaflet typhoon page.

**Architecture:** A Node script converts NOAA IBTrACS CSV into a static index plus year shards under `public/data/typhoons`. Browser modules load the index and one selected year on demand; the existing Leaflet map switches between isolated live and historical layer groups.

**Tech Stack:** TypeScript, Vite, Leaflet, Node.js built-in test runner, GitHub Actions, static JSON.

## Global Constraints

- Deploy unchanged to GitHub Pages and Cloudflare Pages with `npm run build` and `dist`.
- Do not require a runtime server, database, proxy, API key, or environment variable.
- Cover Western Pacific storms from 1980 through the latest available IBTrACS year.
- Show Chinese names when mapped and fall back to English name plus SID.
- Display one historical storm at a time.
- Monthly automation may commit to `main` only after validation succeeds.

---

### Task 1: IBTrACS conversion and validation

**Files:**
- Create: `scripts/historical-typhoons.mjs`
- Create: `scripts/update-historical-typhoons.mjs`
- Create: `scripts/typhoon-name-zh.json`
- Create: `tests/historical-typhoons.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces `parseCsv(text)`, `convertIbtracs(text, names)`, and `validateArchive(index, years)`.
- Writes `public/data/typhoons/index.json` and `public/data/typhoons/years/<year>.json`.

- [ ] Write fixture-driven tests for quoted CSV, WP/1980 filtering, summaries, missing values, date-line coordinates, and Chinese names.
- [ ] Run `node --test tests/historical-typhoons.test.mjs` and confirm imports/expectations fail.
- [ ] Implement conversion and archive validation with explicit count and size guards.
- [ ] Add `update:typhoons` and `test` scripts to `package.json`.
- [ ] Run tests and generate the real archive from NOAA.

### Task 2: Browser archive model and query

**Files:**
- Create: `src/lib/historical-typhoons.ts`
- Create: `tests/historical-query.test.mjs`

**Interfaces:**
- Produces `loadHistoricalIndex()`, `loadHistoricalYear(year)`, `filterHistoricalStorms(index, filters)`, `historicalIntensity(windKts)`, and archive TypeScript interfaces.

- [ ] Write tests for Chinese/English/SID matching, year filtering, sorting, and intensity thresholds.
- [ ] Run the query test and confirm it fails because the module is missing.
- [ ] Implement pure query helpers and relative static-data loaders.
- [ ] Bundle the module for Node and run all tests green.

### Task 3: Dual-mode historical interface

**Files:**
- Modify: `typhoon.html`
- Modify: `src/pages/typhoon.ts`
- Modify: `src/styles/typhoon.css`

**Interfaces:**
- Consumes the Task 2 archive interfaces and loaders.
- Produces live/history mode switching, filters, result list, one-track rendering, and archive details.

- [ ] Add semantic mode controls, historical filters, result region, detail region, and source note.
- [ ] Separate live and historical Leaflet layers and explicit refresh scheduling.
- [ ] Render intensity-colored path segments plus sparse start/key/end markers.
- [ ] Add loading, empty, retry, selected, and mobile states in the established paper-console visual system.
- [ ] Run `npm run build` and fix all compiler or build failures.

### Task 4: Monthly update workflow and deployment documentation

**Files:**
- Create: `.github/workflows/update-historical-typhoons.yml`
- Modify: `README.md`

**Interfaces:**
- Runs `npm ci`, archive update, tests, and build before committing changed generated data to `main`.

- [ ] Add monthly and manual workflow triggers with `contents: write` only.
- [ ] Configure a concurrency group and skip commits when generated files are unchanged.
- [ ] Document local updates, GitHub Pages, and Cloudflare Pages build settings.
- [ ] Validate workflow YAML structure and run the full local verification suite.

### Task 5: Browser verification

**Files:**
- No production files unless verification reveals a defect.

- [ ] Start Vite and open `typhoon.html` in a controlled browser.
- [ ] Verify live mode, switch to history, search Chinese and English names, select a storm, and switch back.
- [ ] Capture desktop and mobile screenshots and inspect console/network failures.
- [ ] Run `npm test`, `npm run build`, and `git diff --check` as final evidence.

