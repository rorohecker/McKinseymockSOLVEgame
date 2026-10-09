# Existing simulators and prep products

Checked 27 Sept to 8 Oct 2026. Offers change often; confirm on each site. "Self-described" means the vendor wrote the claim.

| Provider | Games covered | Free tier (as seen) | Paid (as seen) | Notes |
|---|---|---|---|---|
| **CaseStar** | Red Rock, Sea Wolf, SFL, full mock (65/85 min) | 8-min Red Rock sample, no sign-up; one full 35-min sitting with an email; 10-min Sea Wolf site; about 6-min SFL | Solve Pass EUR 69 one-time (as stated on its comparison page) | "Exam mode" hides hints and live scoring. States its scoring is its own model. |
| **Road to Offer** | Red Rock, Sea Wolf, others | Short Red Rock edition (about 12 min); Sea Wolf Site 1 of Simulation 1 free | Worked review unlock USD 14.99; Sea Wolf alone USD 29 (10 sims); 3-game bundle USD 79; Pro USD 249 / year | Learning vs Simulation mode; own attribute names; "pass or 50% back" offer has conditions. |
| **SolvePrep** | Red Rock, Sea Wolf, SFL (20 and 30 min switch) | One full run per game with account; Sea Wolf free = fixed scenario, 30 min; Red Rock full access lists 6 unique scenarios | Plans on pricing page | Leaderboard, AI solver, Sea Wolf solver tool; large published datasets. |
| **PSG Cracked** | Red Rock (all four phases), Sea Wolf, SFL, Ecosystem | One full Red Rock study, unlimited replays, for an email | Simulation bundles, Excel solvers (Sea Wolf, Ecosystem) | Affiliate-linked from StrategyU. |
| **MConsultingPrep** | Red Rock | Trial mock of 13 questions | Not stated | Named on PrepLounge. |
| **Solve Games Guide** | Red Rock, Sea Wolf, SFL | One free Redrock case (per CaseStar's comparison) | Not shown | Site asks AI not to reuse its content; not summarised here. |
| **CaseBasix** | Sea Wolf, Red Rock, Ecosystem | Starter pack | "16 practice simulations", guarantee | Product page only. |
| **StrategyCase / StrategyU** | Red Rock, Sea Wolf, SFL, Ecosystem | Free demo | Suite with 6 months access; Excel solver for Ecosystem | Claims "faithful recreation of McKinsey game logic" (vendor claim). |
| **PrepLounge (Francesco)** | Red Rock (4 phases), Sea Wolf (5 steps, 3 sites), SFL (13 questions) | None | USD 249 (struck from 484); 35 videos (about 5h50), 230-page PDF; bonus Imbellus combo, guide, Sea Wolf Excel Solver | Listing says a reviewer found content harder than the real test. 4.9 from 12 reviews. |
| **CaseInterview.com "McK Game"** | Two practice mini-games | See site | See site | Tests similar skills; explicitly not a clone. |
| **SolveForge** | Red Rock, Sea Wolf, SFL | Free to start | Pro tier | Directory listing only. |
| **Open source** | none found | | | One search; not exhaustive. |

## What every mock does (common features)

Timed phases that mirror reported structure; instant scoring with deductions; unique scenario per run; replays; score breakdown; some add leaderboards, solvers, learning mode, or an "exam mode" that hides hints.

## Gaps this project can fill

- Free, open, hackable code with seeded scenarios and a validator.
- Realistic Redrock case library with explanations.
- Process-style telemetry (time per phase, backtracking) in a form users own.
- A scenario exporter for printable worksheets (see `python/tools/export_scenarios.py`).

## Caveats

- Realism claims are self-reported by every vendor.
- Several mocks explicitly say their scoring and mechanics are original practice rules, not McKinsey's specification.
- Do not use any solver or tool during the real assessment. McKinsey's rules prohibit it.
