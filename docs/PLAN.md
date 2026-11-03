# Marketing KPI Calculator — Plan (v1)

> **Update (v1.0):** The UI is now German-only (de-DE number format; standard English terms such as ROI, ROAS and CPM are kept) and light mode only, and the app ships as a one-file app (`app/kpi-rechner.html`) with double-click launchers. The language, theme and delivery decisions below are historical.

## Decisions (confirmed with user)
- **Delivery:** Installable PWA, fully offline after first load (service worker precaches all assets). No backend, no network calls at runtime.
- **Locale:** English UI, EUR currency, `en` number formatting (1,234.56 €-style via `Intl.NumberFormat('en-IE', {currency:'EUR'})`).
- **UX model:** Hybrid — choose a channel category, enter what you know, all derivable KPIs update live; show which missing inputs would unlock further KPIs; every KPI has a formula/explainer card.
- **Scope:** Pure calculator (nothing persisted except UI prefs like theme in localStorage) + **export CSV** and **export PDF** (PDF via a dedicated print stylesheet + `window.print()` → "Save as PDF"; zero dependencies, works offline).

## Stack
- TypeScript (strict) + React 19 + Vite
- Tailwind CSS v4, lucide-react icons, small hand-built components (no remote fonts; system font stack)
- `vite-plugin-pwa` (Workbox `generateSW`, precache everything, `registerType: 'autoUpdate'`)
- Tests: Vitest (unit, domain core) + Testing Library (components) + Playwright (e2e, offline test, screenshots for visual review) + `@axe-core/playwright` (a11y)
- ESLint + Prettier; `npm` as package manager (already installed)

## Architecture
```
src/
  core/                 # pure, framework-free, 100% unit tested
    variables.ts        # every quantity: id, label, unit (currency|percent|count|ratio|points), input hints
    relations.ts        # derivation rules: { output, inputs[], compute(), category tags }
    solver.ts           # fixpoint evaluation: known inputs -> derived values, provenance, conflicts, unlock hints
    kpis.ts             # KPI catalog: which variables are "KPIs", per category, explainer text, formula string, direction (higher/lower is better)
    format.ts           # parse user input ("1,234.5", "2.5%"), format output
    export.ts           # CSV builder (RFC 4180 quoting, formula-injection guard)
  ui/                   # React components
  app/                  # shell, routing by category (hash-based), theme
```

### Solver semantics
- Inputs: a map `variableId -> number` for the values the user typed.
- Relations are directed formulas (e.g. `cpm = cost / impressions * 1000`, and also `impressions = cost / cpm * 1000`). The solver repeatedly applies any relation whose inputs are all known and whose output is unknown, until fixpoint. Max iterations guard.
- Each derived value records **provenance** (which relation, which inputs) → used for the "how was this computed" explainer.
- **Conflicts:** if a relation's inputs are all known and its output was *user-entered*, compute anyway and flag when relative difference > 0.5 % ("Your CPM doesn't match Cost and Impressions").
- **Invalid math:** division by zero / negative where impossible (e.g. reach > 100 %) → value omitted with reason, never `NaN`/`Infinity` shown.
- **Unlock hints:** for each un-derivable KPI in the active category, list the minimal set of missing inputs (relation with fewest unknown inputs).

## Categories & KPIs (v1 starting set)
**Business outcome (shown in every category):** Revenue, Cost (media spend), Gross margin %, Profit (= revenue×margin − cost), ROAS (= revenue / cost), ROI (= (revenue×margin − cost)/cost; if no margin given → ROI on revenue, clearly labelled), Break-even ROAS (= 1 / margin).

**Online / Digital:** Impressions, Clicks, Conversions, Views (video), Leads, CPM, CPC, CTR, CR (conversion rate = conversions/clicks), CPA, CPL, CPV, VTR (= views/impressions), AOV (= revenue/conversions), eCPM alias of CPM.

**TV:** Universe (target audience size), Ratings / GRP, TRP, Reach %, Avg. frequency (GRP = Reach% × Frequency), CPP (cost per rating point = cost / GRP, or per TRP), Gross contacts (= GRP/100 × universe), TV CPM (= cost / contacts × 1000), Net reach (persons = reach% × universe). TRP convention: TRP = target reach % × target avg frequency (stated in UI).

**Radio:** same broadcast model as TV (GRP, Reach, Frequency, CPP, CPM, contacts) — shares relations, separate tab for clarity.

**Print / OOH (other offline):** Circulation / readership or OOH contacts, Print CPM (cost per thousand readers/contacts), Cost per reader, Cost per insertion; OOH: contacts per week × weeks.

**Direct mail:** Pieces sent, Responses, Response rate, Cost per piece, Cost per response, Conversions, Cost per acquisition.

## UX (research-informed)
- Progressive disclosure: per category, show 3–5 primary inputs first; "More inputs" reveals the rest (max 2 levels).
- Live results as KPI cards (big number, unit, short label, info button → formula + provenance + plain-English explanation). Cards for underivable KPIs are greyed with "Add *Clicks* to unlock".
- Conflict banner when entered values contradict each other.
- Sensible formatting, inline validation, keyboard first, labels on all inputs, `aria-live="polite"` results region, WCAG 2.2 AA contrast, 44px touch targets, responsive (mobile single column, desktop input|results two-pane), light/dark (follows system + toggle).
- Category navigation: segmented tabs (Online · TV · Radio · Print/OOH · Direct mail), deep-linkable via hash; "Reset" per category; example-values button ("Try an example") for discoverability.
- Export: CSV of current category (inputs + KPIs + formulas), PDF via print view.

## TDD workflow
1. For each relation/KPI: write failing unit test with a hand-computed worked example (+ edge cases: zero, missing, conflicting) → implement → green.
2. Solver tests: chaining (cost + CPM → impressions → with CTR → clicks → CPC), conflicts, unlock hints, no NaN leakage.
3. Component tests (Testing Library): typing inputs updates cards, unlock hints, conflict banner, export content.
4. Playwright e2e: happy path per category, offline reload test (`context.setOffline(true)` after SW active), axe a11y scan, screenshots (desktop/mobile × light/dark) → visual review.

## Reviews (Codex via harness-subagent)
- Plan: adversarial review of this document (before coding).
- Code review after core + UI implemented.
- Visual review of Playwright screenshots.

## Done when
- `npm test` (unit+component) and `npm run test:e2e` green; build produces installable PWA that works with network disabled.
- `npm run dev` / `npm run preview` documented in README.

## Revisions after Codex adversarial review (Sol, high)
1. **Percent scale:** percent variables are stored as percentage points (50 = 50 %); every formula divides by 100 explicitly. Audience sizes are in persons. Fixture: U=1,000,000, reach=50 %, f=4 → net reach 500,000, GRP 200, contacts 2,000,000.
2. **ROI needs margin:** ROAS = revenue/spend (×). Contribution = revenue×margin − spend. Marketing ROI = contribution/spend (%). No margin → no ROI (unlock hint), never a 100 %-margin fallback. Break-even ROAS = 1/margin, only if margin > 0.
3. **Solver:** pure function recomputed from inputs on every edit (no stale state). Forward propagation in declaration order to a fixpoint, then a **consistency pass over every relation** whose operands are known. Violations mark all participants as `conflict`, and every value derived from a conflicting one is tainted too. Tolerance: `|a−b| ≤ atol(unit) + 1 % × max(|a|,|b|)`. Division by zero → no value. Domain bounds: reach ≤ 100 %, counts/costs ≥ 0, frequency ≥ 1. A derived value outside its bounds is reported `invalid` and doesn't propagate.
4. **Unlock hints:** curated alternative input sets per KPI. A test proves each set actually unlocks its KPI.
5. **Definitions made explicit:** a single audience basis per scenario, so "GRP/TRP" is measured against the universe you enter. CPP = spend/rating points. Broadcast CPM uses gross contacts. Print circulation CPM (copies) is separate from reader-contact CPM. OOH contacts are weekly gross contacts × weeks. CVR = conversions/clicks (click-based). View rate = views/impressions. "Revenue per conversion" replaces AOV. Direct-mail response rate = responders/pieces sent. No eCPM alias and no "higher is better" judgements.
6. **Categories:** Online · TV · Radio · Other offline (Print | OOH | Direct mail). Business-outcome block in each. Scenarios are isolated per (sub)category, kept in memory only, and lost on reload (stated in the UI).
7. **Inputs:** raw strings in the UI. Calculated values are shown as placeholders with a "calculated" badge. Typing pins a value and clearing releases it. Inline errors use aria-invalid/aria-describedby, and the debounced live region gives a short status only.
8. **PWA:** `registerType: 'prompt'`, an "Offline ready" indicator, and an update banner that applies only on click. Offline test against the production build.
9. **Export:** "Print / Save as PDF" (print stylesheet). The CSV holds raw numbers plus unit, status and formula, keeps empty and zero distinct, and guards against formula injection.
