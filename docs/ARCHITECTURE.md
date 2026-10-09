# Architecture

## Layout

```
app/index.html          base CSS and seed generators/scorers
app/ui.js               screen renderer, state, clock, game actions
app/sfl.js              original SFL scenario generators/scorers
app/sfl-ui.js           SFL screens and actions
app/drills-ui.js        focused practice screens and scoring
app/adaptive.js         skill signals from saved runs and adaptive drill selection
app/spaced.js           local review schedule, due-skill selection and CSV export
app/features.js         settings, local persistence helpers, CSV, difficulty tuning
app/analytics-ui.js     review, process metrics, history, calibration
app/retro.css           pixel art theme and responsive overrides
app/assets/             original SVG art and locally bundled Pixelify Sans font
python/solve_lab/       port of the generators and scorers (no dependencies)
python/tools/           validate, parity_check, export, worksheet, solver, serve
python/tools/ui_smoke.py headless Chrome routes, review-plan and timeout checks
python/tests/           unittest suite (11 tests)
research/               sourced notes and JSON data
docs/                   this file, IDEAS.md, KNOWN_DEVIATIONS.md
```

## Browser app

The seed logic and UI are kept apart:

1. `<script id="logic">` has **no DOM access**. It holds the seeded RNG, `genRedrock`, `genCases`, `scoreRedrock`, `genSeaWolf`, `scoreSite`, `bestIn` and `filterPool`. Node and Python load it without a browser.
2. `ui.js` holds the state object `S`, renderer, event delegation, clock and calculator. Supporting files add SFL, drills, persistence and analytics.

### Flow

```
home --start--> rr-intro -> rr-inv -> rr-an(3) -> rr-rep1 -> rr-rep2 -> rr-case(6)
                  -> break -> sw-intro -> sw-site(3) -> break -> sfl-intro -> sfl-project/team -> results
home -> any standalone game or a focused drill
home -> adaptive drill (recent missed skill or baseline percent math) -> drill results
home/history -> spaced review (earliest due skill) -> drill results -> next calendar due date
```

Clock: `startClock(minutes, onEnd)` stores an end timestamp; `tick()` runs every 250 ms and updates `#clk`. When it reaches zero it calls `finishRR(true)` or `finishSW()`, which score whatever has been answered.

The 65-minute full run ends after Sea Wolf. The SFL branch is used only in the 85- and 95-minute sittings.

### Seeds

`mulberry32(seed)` drives everything. Redrock uses `seed*13+7`, Sea Wolf uses `seed*17+3`, prospect rounds use `seed*7 + site*31 + round*5 + 1`. The same seed always gives the same game, in JS and Python.

### Sea Wolf generation (why every site is solvable)

For each site the generator first **plants** a perfect team: target averages `a` per attribute, three microbes whose sum is within 1 of `3a`, ranges `[a-1, a+1]`, one planted microbe carries the desired trait, none the forbidden one. It then adds:
- 3 traps with near-target numbers but the forbidden trait,
- 1 microbe that suits the next site (carry-over bait),
- random fillers up to 28.

Planted microbes sit in the first 6 pool slots, so any permissive filter shows them within the first 10 results. A tight filter can hide them (58% of sites at range +/-1, none at +/-2 in the 400-seed run), which is deliberate.

### Redrock generation

Four groups in one of three island study themes (wolf territory, wetland restoration or forest protection), four years of area data, two proposals, six analysis answers, five prompts selected from eight and a chart task selected from four types. The six cases are selected from nine templates.

## Python package

`solve_lab.rng` and `solve_lab.jsnum` reproduce JavaScript's random stream, `Math.round`, number printing and `toLocaleString`. `redrock.py` and `seawolf.py` are line-for-line ports. `snapshot.py` builds the canonical dictionary used by the parity check and the exporters.

## Change workflow

1. Edit the `logic` script in `app/index.html`.
2. Mirror the change in `python/solve_lab/`.
3. `cd python && python tools/parity_check.py 1 500` must print `OK`.
4. `python tools/validate.py 1 500` must print `OK`.
5. `python -m unittest discover -s tests`.
6. For UI-only changes, open `app/index.html` (or `python tools/serve.py`) and play a run.

Order of random calls matters. If you add a call to the RNG anywhere, every later value changes; the parity check will catch a mismatch between JS and Python but not a changed scenario for an old seed.

## Theming

The original CSS in `index.html` provides the base layout; `retro.css` applies the pixel art theme and responsive overrides. The page starts in dark mode. The DAY/NIGHT control sets `data-theme` on `:root` and saves the choice in `localStorage`. `render()` also sets `data-game`, which selects earthy Redrock, ocean-blue Sea Wolf or forest-green SFL colors in either theme. Pixelify Sans is reserved for display and game controls; body copy uses IBM Plex Sans with a system fallback.

## Dependencies

None for the app (Pixelify Sans is bundled locally; body fonts load from Google Fonts with fallbacks). None for Python (standard library only). The parity check needs Node.js or Chrome/Chromium.
