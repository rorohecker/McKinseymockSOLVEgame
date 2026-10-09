# Ideas and how to build them

**Status note (2026-10-08):** SFL practice formats, Standard/Hard, varied Redrock cases and reports, worked review, focused, adaptive and spaced drills, mental math, local history, process metrics, seed challenges, between-game breaks, keyboard help, mobile styling, rule explanations and CSV/PDF export are implemented. The sections below preserve the original planning notes; any references saying these features are missing are historical. Legacy Ecosystem Building, cloud sync, a shared leaderboard and languages remain future options.

Effort: **S** = an evening, **M** = a weekend, **L** = a week or more. "JS" means `app/index.html`; "Py" means `python/`. Whenever you change generator logic in the JS, mirror it in `python/solve_lab/` and run `python tools/parity_check.py` (see `ARCHITECTURE.md`).

## A. Closer to the real test

### A1. Sustainable Futures Lab module (L)
The third game on 85 and 95 minute invites. Standard form: 13 questions, the first a drag-and-drop ranking of four actions, then 12 scenario questions on one storyline where earlier answers change later context. See `research/SFL_AND_LEGACY.md`.
- Data: store each scenario as JSON, a graph of nodes `{id, prompt, options:[{text, quality, tags, next}]}` plus a ranking node with a reference order.
- Seeding: choose one of several themes (watershed after a burn, wetland restoration, air quality) and shuffle which option is strongest.
- Scoring: reference-order distance for the ranking (Kendall tau); per-question quality 0-1; a consistency score that penalises answers whose `tags` contradict earlier answers. SolvePrep reports consistency as the weakest practice component, so it deserves its own measure.
- JS: add `genSFL`, screens `sfl-intro` / `sfl-q`, a timer branch (20 or 30 min toggle) and a third step in the full run. Python: port the generator and add a graph validator (every path ends, at least one option per node is strong).
- Caution: no source gives the real scoring. Label everything as practice.

### A2. Calibrate difficulty with real feedback (M)
Right now ranges are width 2, pools are 28, and the median pool has 38 perfect teams (some pools have 1). Reports say some sites cannot reach 100%.
- Pull the magic numbers in `genSeaWolf` (range width, pool size, trap count, planted slots) into a `DIFFICULTY` object.
- Use `python/tools/validate.py` to sweep settings and print the distribution of perfect teams and filter-hiding rates.
- Ask players to rate each site "easier / same / harder than the real thing" in the results screen and store the answers; tune toward "same".

### A3. Redrock fidelity (M)
Candidate reports describe an Investigation phase with no calculator, 8-10 report blanks, calculator results dragged into fields, and a one-way report gate.
- Add a `strict` flag: hide the Calculator tab during Investigation, expand `blanks` to 8-10 by adding more derived statements, require the chart data table in the report.
- Add real chart exhibits (inline SVG built from the same arrays) so reading charts becomes part of the work.
- Port every change to `python/solve_lab/redrock.py`.

### A4. Ecosystem Building (legacy) (L)
Rules are summarised in `research/SFL_AND_LEGACY.md`: 39 species in three groups of 13 (3 producers, 10 animals), pick exactly 8, calorie feeding order, then pick a location. Invite lengths in some regions may still include it.
- Data: a species table JSON with calories needed, calories provided, prey list, environment ranges.
- Engine: a function that runs the feeding rounds exactly as the seven rules say and returns survivors; a Python brute force can prove each generated pool has a viable 8-species ecosystem.
- UI: a card grid plus a site conditions panel.

## B. Learning value

### B1. Review mode with worked solutions (M)
Have each generator emit a `steps` array next to every answer (for example `["Total Y4 = 62 + 71 + 88 + 95 = 316", "Share = 71 / 316 = 22.5%"]`) and render it beside the user's answer in `rrResults`. For Sea Wolf, show a table of sums versus `3 x range` for the user's team and for one perfect team.

### B2. Process telemetry (M)
The real test reportedly scores process as well as product, though weights are unknown (`research/SCORING.md`). Build your own version for self-review.
- Add `S.log=[]` and a helper `ev(type,data)` called from `ACT.*` handlers and the `input` listener (journal clicks, calculator uses, tab changes, filter edits, backtracks, time per screen).
- On the results screen derive simple metrics: time per question, journal use rate, number of filter changes per site, share of time on site 1 and 2 (the most common Sea Wolf failure in vendor surveys).
- Export the log as JSON so Python can analyse it.

### B3. Drill modes (S-M)
Short sessions that reuse the generators: six cases only on a 12-minute clock; Sea Wolf filter-and-categorise step only; "percent vs percentage points" flash set. Add `mode` values in `ACT.start` and skip screens in the flow.

### B4. Mental-math warm-ups (S)
A small generator for percent change, shares, weighted averages and "sum the three values against 3 x range". Time each answer and track accuracy.

### B5. Exam mode versus learning mode (S)
Exam: no hints, no live filter counts, no per-site score until the end. Learning: hints, one repair per decision. CaseStar and Road to Offer both offer two modes.

## C. Tracking and data

### C1. Progress history (S-M)
Store each run summary `{seed, mode, date, rrScore, swScores, phaseTimes}`. In a plain HTML file use `localStorage` wrapped in try/catch. In a hosted setup, use a real store. Show a trend line and a "weakest component" panel. Use the published vendor datasets (`research/STATISTICS.md`) only as loose context, since they are self-selected users.

### C2. Seed challenges and leaderboard (M)
Put the seed in the URL query (works when you serve the file, for example with `tools/serve.py`) so friends play the same scenario; collect results in a small Python backend (FastAPI or Flask) with an endpoint `POST /result` and `GET /leaderboard/<seed>`. Keep it anonymous by default.

### C3. Scenario bank and printable worksheets (S)
`tools/export_scenarios.py` and `tools/make_worksheet.py` already exist. Extend with PDF output (for example with WeasyPrint) and a "weekly set" that picks 7 seeds with a spread of difficulty.

### C4. Keep the research current (M)
Write `tools/check_sources.py` that reads `research/SOURCES.md`, fetches each URL, stores status, title and a content hash in `research/data/source_status.json`, and flags changes. Run it before each release; re-read flagged pages and update `FACTS.md` and `DISCREPANCIES.md`. Respect any site that asks bots not to reuse its content.

## D. Product quality

- **Accessibility (S):** announce the timer with `aria-live="polite"` at 10, 5 and 1 minute marks only; full keyboard flow for Sea Wolf categorise (already 1/2/3); high-contrast check in both themes.
- **Languages (M):** McKinsey offers English, Spanish, Portuguese and Japanese (`FACTS.md` F10). Extract UI strings into a dictionary and generate scenario text per language.
- **Mobile (S):** the real test is PC/Mac only, but a phone layout helps practice anywhere. The page already stacks at narrow widths; test the calculator and filter inputs by hand.
- **Pause and resume (S):** the real game cannot be paused during a timed task. Add a "between games" break screen only.
- **Browser tests (M):** Playwright scripts that play a full run with a perfect-answer bot (reuse `perfect_answers` from `tools/validate.py`) and assert 175 + 300. Run them in CI together with `validate.py` and `parity_check.py`.

## Suggested order

1. B1 review mode and B2 telemetry (biggest learning gain for little code).
2. A1 Sustainable Futures Lab (closes the biggest content gap).
3. C1 progress history.
4. A2 calibration once you have played a few runs and know what feels off.
5. A3 / A4 for fidelity and legacy coverage.

## Things to avoid

- Do not claim the practice score predicts the real result. No source can support that.
- Do not copy real assessment content or screenshots. The simulator uses original data only.
- Do not market tools that could be used during the real assessment; McKinsey's rules ban outside tools and AI, with serious consequences (`research/FACTS.md` F03, F04).
