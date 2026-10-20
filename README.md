# Marketing KPI Calculator

An offline-capable web app (PWA) for calculating marketing KPIs across channel categories:

| Category | KPIs |
|---|---|
| **Online** | CPM, CPC, CPA, CPL, CPV, CTR, conversion rate, view rate, average frequency, revenue per conversion |
| **TV / Radio** | Rating points (GRP/TRP), unique reach, gross contacts, average spot rating, CPP, cost per 1,000 contacts, cost per spot |
| **Other offline: Print** | Reader contacts, cost per 1,000 copies, cost per 1,000 reader contacts, cost per insertion |
| **Other offline: Out-of-home** | Gross contacts, average frequency, cost per 1,000 contacts, cost per panel per week |
| **Other offline: Direct mail** | Response rate, responder-to-order rate, cost per piece/response/order, revenue per piece |
| **Business outcome** (every category) | ROAS, marketing ROI, contribution after media, break-even ROAS |

**How it works:** pick a category and enter the numbers you know. Everything that can be derived appears live, including through inverse formulas (e.g. spend + CPM → impressions). Locked KPIs tell you which input unlocks them. Contradictory inputs are flagged, and results based on them are marked as conflicting. Every KPI explains its formula.

**Conventions**
- Percentages are entered as percentage points (50 = 50%).
- Audience sizes are in persons.
- ROI requires a contribution margin and never silently assumes a 100% margin.
- Rating points are measured against the audience universe you enter: total population → GRP, target group → TRP.

Nothing is stored or sent anywhere, so inputs are cleared on reload. Export: **CSV** (opens in Excel, UTF-8) and **Print / Save as PDF**.

## Getting started

Requires Node.js 22+ (developed with Node 24).

```sh
npm install
npm run dev          # http://localhost:5173
npm run build        # production build incl. service worker → dist/
npm run preview      # serve the production build at http://localhost:4173
```

### Install as an offline app
Open the production build (`npm run preview`, or any static HTTPS host serving `dist/`) in Edge or Chrome. Once the header shows **Works offline**, use the browser's *Install app* icon in the address bar. The installed app starts without a network connection. Opening `dist/index.html` directly from disk (`file://`) is **not** supported. When a new version is deployed, a banner offers to reload. That's never automatic, because reloading clears your inputs.

## Tests (TDD)

```sh
npm test             # Vitest: domain core + component tests
npm run test:e2e     # Playwright, full suite in Chromium, Edge, Firefox, WebKit and mobile Chrome
npx playwright test --project=chromium   # one browser only (fast)
npx playwright show-report               # HTML report of the last run
npx playwright test screenshots          # writes review screenshots + print PDF into screenshots/
npm run lint         # oxlint
```
First run of e2e needs browsers: `npx playwright install chromium firefox webkit` (Edge uses the installed Microsoft Edge).

| E2E spec | Covers |
|---|---|
| `categories.spec.ts` | every category: all KPIs against hand-calculated values, examples, initial locked state |
| `interactions.spec.ts` | unlock hints, calculated placeholders and overrides, conflicts, invalid values, input parsing/formatting, help, per-category state, deep links/back/forward, theme, keyboard-only use, mobile layout |
| `export.spec.ts` | CSV content (BOM, quoting, zero vs. missing, conflicts), print layout, print dialog, A4 PDF |
| `a11y.spec.ts` | axe WCAG 2.2 AA for every category, empty and filled, light and dark, plus error/conflict states |
| `pwa.spec.ts` | manifest and icons, full offline use, upgrading from version A to B with two open windows (no data loss) |

## Structure

```
src/core/      framework-free domain logic (100% of the maths lives here)
  catalog.ts   variables, relations, categories, unlock hints, examples
  solver.ts    forward propagation to a fixpoint + consistency checks
  view.ts      KPI card states (entered / calculated / conflict / locked)
  export.ts    CSV export
src/ui/        React components
e2e/           Playwright specs
docs/PLAN.md   plan + review decisions
```

### Adding a KPI
1. Add the variable (label, unit, help text, bounds) in `catalog.ts`.
2. Add a relation with `ratio(...)` / `product(...)` (inverses are generated) to the category.
3. Add it to a `kpiGroups` entry, and add an unlock hint.
4. Write the failing test with a hand-calculated fixture in `catalog.test.ts` first. The integrity tests automatically check that its hints really unlock it and that the example derives it.
