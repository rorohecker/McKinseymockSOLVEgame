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

For the browser version, no installs are needed: open `app/index.html` with its adjacent CSS and assets. The Python toolkit uses only the standard library.

## Windows desktop executable

Double-click [`dist/SolvePracticeLab.exe`](dist/SolvePracticeLab.exe) to open the game in its own window. It is a single-file, 64-bit Windows build with the HTML, scripts, pixel assets and Python runtime bundled. Python is not needed to play. The desktop window uses Microsoft Edge WebView2 Runtime, which is already present on many Windows 10/11 computers. The app keeps its WebView profile under `%LOCALAPPDATA%\SolvePracticeLab\WebView` so history and spaced reviews survive restarts. It serves only on `127.0.0.1:8765`; close another Solve Practice Lab window before opening a second copy.

To rebuild the executable on Windows:

```powershell
py -3.14 -m venv .venv
.venv\Scripts\python -m pip install -r python\tools\requirements-desktop.txt
.venv\Scripts\python python\tools\build_windows.py
```

The build script checks the bundled HTTP assets and writes `dist/SolvePracticeLab.sha256`. For a desktop window smoke check, run `dist\SolvePracticeLab.exe --ui-smoke build\ui-smoke-exe.txt` and read the generated report. The executable has a locally generated pixel globe icon and is unsigned.

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
- **Sea Wolf profile:** choose exactly two characteristics from three numbers and four traits. Reports agree on the two-choice format but conflict on whether this changes later microbes; the simulator labels its pool matching as a practice model.
- **Sources disagree** on Sea Wolf attribute names, number of steps, how the forbidden trait is penalised, Redrock report size and raw-score deciles. See `research/DISCREPANCIES.md`.
- **Practice data (vendor, self-selected users):** median first-to-best gains of +20.3 points on Redrock, +10.4 on SFL and +6.7 on Sea Wolf, about half of which looks like noise after controls.

## Verification done on this project

| Check | Result |
|---|---|
| Python port vs JS in `app/index.html` | 300 seeds matched in headless Chrome on Windows; the parity tool also uses Node.js when available. |
| Perfect Redrock answer sheet | scores 175 on 500 seeds; empty sheet scores 0 |
| Sea Wolf sites | planted team scores 100, perfect team found by brute force, unique names, 28-microbe pools on 1,500 sites |
| Unit tests | 11 pass |
| Interface | `python python/tools/ui_smoke.py` completes the 65, 85 and 95-minute routes plus every standalone game using browser input events; it checks all six spaced skill targets, review scheduling, pause and quit, timeouts, keyboard shortcuts and two-choice Sea Wolf profiles at 1280, 500 and 360 pixels. It checks text contrast across all game palettes; dark and light screens were also reviewed visually. Manual play remains useful for feel and pacing. |

## Interface notes

The DAY/NIGHT control saves your theme preference locally. The Keys menu lists shortcuts. Pause freezes the active timer and hides the game; Alt+P or Escape resumes. Quit asks before discarding an unfinished run, while saved history stays. In the Windows build, the quit prompt also offers Close desktop app. Redrock uses Alt+1/2/3 for Journal, Exhibits and Calculator; drag a calculator result to a numeric answer or focus the answer and use the transfer button. Sea Wolf uses 1/2/3 for categorisation and prospects. SFL decisions use A/B/C. The results screen shows worked review, process metrics, a seed challenge link, CSV and print-to-PDF controls. Sea Wolf's review follows its four main phases and compares your treatment with the best available practice example.

Extended sittings use 85 minutes (Redrock + Sea Wolf + 20-minute SFL Project Lead) or 95 minutes (with the 30-minute SFL Team Lab). A break screen pauses between games. The SFL tasks, timing and scoring are practice reconstructions because official details are limited.

Short sessions cover mental math, six Redrock cases at two minutes each, and Sea Wolf filtering. The five-minute adaptive drill reads recent missed skills from local history and chooses focused math, Redrock data, Sea Wolf filtering, or SFL decisions; a first run starts with percent math. Scores, phase time and mistake summaries are saved in this browser. Standard/Hard changes Sea Wolf range widths and distractors plus Redrock numeric tolerance; learning hints can be switched on. Personal difficulty comparisons remain on this device.

Spaced practice uses the same five-minute skill drills on a local calendar schedule. A strong review moves a skill through 1, 3, 7, 14 and 30-day intervals; missed work returns the next day. Completed runs feed the schedule, including existing saved history when the plan is first created. The home and history screens show due skills, and the plan exports to CSV. This schedule is a study aid, not a McKinsey scoring rule.

Each game has its own dark and light palette: earthy Redrock, kelp and warm coral Sea Wolf, and forest-green Sustainable Futures. The home screen uses a hand-drawn pixel shoreline. The body text uses a plain sans-serif face while headings and controls carry the pixel-art treatment. The wider desktop layout and mobile layout keep the game controls readable.

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
