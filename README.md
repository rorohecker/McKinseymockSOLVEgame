# Solve Practice Lab

A playable, timed practice simulator for **Redrock Study**, **Sea Wolf**, and an original **Sustainable Futures Lab** reconstruction, with a Python toolkit and sourced research notes.

Independent project. Not affiliated with or endorsed by McKinsey & Company. Do not use any tool like this during the real assessment: McKinsey's rules ban outside tools, notes and AI, with stated consequences up to rescinded offers.

## Quick start

```bash
# play it: just open the file
open app/index.html            # macOS;  xdg-open on Linux; or double-click it

# Windows PowerShell
Start-Process .\app\index.html

# or serve it
cd python && python3 tools/serve.py       # http://localhost:8765

# check everything
cd python
python3 -m unittest discover -s tests -v  # 11 tests (parity uses Node.js or Chrome)
python3 tools/validate.py 1 500           # scenario sanity over 500 seeds
python3 tools/parity_check.py 1 300       # Python port == JS in the HTML
python3 tools/ui_smoke.py                 # full browser routes, spaced reviews and timeouts
```

No installs needed: open `app/index.html` with its adjacent CSS and assets. Python uses only the standard library.

## What is in the box

| Path | What it is |
|---|---|
| `app/index.html`, `app/*.js` | Simulator logic and interface: Redrock, Sea Wolf, two SFL formats, adaptive and spaced drills, history, review and exports. |
| `app/retro.css`, `app/assets/` | Pixel art interface, original SVG scenery and sprites, and the locally bundled Pixelify Sans font (OFL license in `app/assets/PIXELIFY-LICENSE.txt`). |
| `python/solve_lab/` | Seeded Redrock and Sea Wolf generators and scorers ported from the JS. Identical scenarios for the same seed. |
| `python/tools/` | `validate.py`, `parity_check.py`, `ui_smoke.py`, `export_scenarios.py` (JSON + CSV), `make_worksheet.py` (printable HTML), `seawolf_solver.py` (post-practice study tool), `serve.py`. |
| `research/` | Notes and JSON data on the games, timeline, scoring reports, statistics, competing simulators and an October 2026 Reddit evidence audit. Claims are labelled OFFICIAL / CORROBORATED / REPORTED / VENDOR CLAIM / CONTRADICTED / UNVERIFIED. |
| `docs/IDEAS.md` | 19 development ideas with brief how-to notes and a suggested order. |
| `docs/ARCHITECTURE.md` | How the code is organised and the change workflow. |
| `docs/KNOWN_DEVIATIONS.md` | Where the simulator differs from the real test and where every number came from. |

## The most important findings (details and sources in `research/`)

- **Official (McKinsey):** Solve is considered alongside the rest of your application; no preparation needed; each task starts with an untimed tutorial; scenarios are varied per candidate; you may be randomly asked to explain your logic or redo a task in person; PC/Mac only; English, Spanish, Portuguese, Japanese.
- **Not published by McKinsey:** the scoring model, pass mark, weighting between games and which games a given invite length contains.
- **Reported lineup (2026):** Redrock Study (35 min) then Sea Wolf (30 min) on a 65-minute invite; plus Sustainable Futures Lab on 85 minutes; about 95 minutes since late Aug 2026 with a 30-minute SFL (thin evidence). Ecosystem Building is retired from the default mix (date disputed).
- **Sea Wolf rules (corroborated):** per site choose 3 microbes; their **averages** must sit inside each attribute range, with at least one desired-trait microbe and none with the forbidden trait. Vendor models start at 100 and take 20 per miss.
- **Sources disagree** on Sea Wolf attribute names, number of steps, how the forbidden trait is penalised, Redrock report size and raw-score deciles. See `research/DISCREPANCIES.md`.
- **Practice data (vendor, self-selected users):** median first-to-best gains of +20.3 points on Redrock, +10.4 on SFL and +6.7 on Sea Wolf, about half of which looks like noise after controls.

## Verification done on this project

| Check | Result |
|---|---|
| Python port vs JS in `app/index.html` | 300 seeds matched in headless Chrome on Windows; the parity tool also uses Node.js when available. |
| Perfect Redrock answer sheet | scores 175 on 500 seeds; empty sheet scores 0 |
| Sea Wolf sites | planted team scores 100, perfect team found by brute force, unique names, 28-microbe pools on 1,500 sites |
| Unit tests | 11 pass |
| Interface | `python tools/ui_smoke.py` completes the 65, 85 and 95-minute routes plus every standalone game using browser input events; it checks all six spaced skill targets, review scheduling, timeouts and keyboard shortcuts at desktop and narrow widths. It checks text contrast across all game palettes; dark and light screens were also reviewed visually. Manual play remains useful for feel and pacing. |

## Interface notes

The DAY/NIGHT control saves your theme preference locally. The Keys menu lists shortcuts. Redrock uses Alt+1/2/3 for Journal, Exhibits and Calculator; drag a calculator result to a numeric answer or focus the answer and use the transfer button. Sea Wolf uses 1/2/3 for categorisation and prospects. SFL decisions use A/B/C. The results screen shows worked review, process metrics, a seed challenge link, CSV and print-to-PDF controls.

Extended sittings use 85 minutes (Redrock + Sea Wolf + 20-minute SFL Project Lead) or 95 minutes (with the 30-minute SFL Team Lab). A break screen pauses between games. The SFL tasks, timing and scoring are practice reconstructions because official details are limited.

Short sessions cover mental math, six Redrock cases at two minutes each, and Sea Wolf filtering. The five-minute adaptive drill reads recent missed skills from local history and chooses focused math, Redrock data, Sea Wolf filtering, or SFL decisions; a first run starts with percent math. Scores, phase time and mistake summaries are saved in this browser. Standard/Hard changes Sea Wolf range widths and distractors plus Redrock numeric tolerance; learning hints can be switched on. Personal difficulty comparisons remain on this device.

Spaced practice uses the same five-minute skill drills on a local calendar schedule. A strong review moves a skill through 1, 3, 7, 14 and 30-day intervals; missed work returns the next day. Completed runs feed the schedule, including existing saved history when the plan is first created. The home and history screens show due skills, and the plan exports to CSV. This schedule is a study aid, not a McKinsey scoring rule.

Each game has its own dark and light palette: earthy Redrock, deep-blue Sea Wolf, and forest-green Sustainable Futures. The body text uses a plain sans-serif face while headings and controls carry the pixel-art treatment. The mobile layout keeps the game controls usable at narrow widths.

## Further features

- Practice reminders and optional calendar export for scheduled reviews.
- Confidence ratings before revealing a worked solution.
- Optional cross-device sync and friend leaderboards with accounts.
- More languages and screen-reader testing with human players.
- A scenario editor and downloadable weekly practice packs.

The interface uses original pixel art inspired by classic game screens and ocean exploration. Pixelify Sans is bundled for offline use; body fonts fall back to system fonts when Google Fonts is unavailable.

## Research caveats

Gathered on 2026-10-08. Sources are mostly commercial prep sites, whose claims can be biased and often copy each other. Open the URLs in `research/SOURCES.md` before relying on a number. One site that asked AI tools not to reuse its content was left out.

The [October 2026 Reddit audit](research/REDDIT_AUDIT_2026-10-08.md) records which new candidate reports were corroborated, which remain uncertain, and why no speculative Sea Wolf scoring rule was added.
