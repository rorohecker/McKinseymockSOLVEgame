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
python3 -m unittest discover -s tests -v  # 15 tests (parity uses Node.js or Chrome)
python3 tools/validate.py 1 500           # scenario sanity over 500 seeds
python3 tools/parity_check.py 1 1000      # Python port == JS in the HTML
python3 tools/ui_smoke.py                 # full browser routes, spaced reviews and timeouts
```

For the browser version, no installs are needed: open `app/index.html` with its adjacent CSS and assets. The Python toolkit uses only the standard library.

## Windows desktop executable

Download `SolvePracticeLab-Setup-<version>.exe` from the [latest release](https://github.com/rorohecker/McKinseymockSOLVEgame/releases/latest) and run it once. It installs to `%LOCALAPPDATA%\Programs\Solve Practice Lab` and adds a Start Menu shortcut; a desktop shortcut is optional. You can also use the portable `SolvePracticeLab.exe`. Python is not needed to play. The desktop window uses Microsoft Edge WebView2 Runtime, which is already present on many Windows 10/11 computers. The app keeps its WebView profile under `%LOCALAPPDATA%\SolvePracticeLab\WebView` so history and spaced reviews survive updates. It serves only on `127.0.0.1:8765`; close another Solve Practice Lab window before opening a second copy.

Releases before v1.4.0 only provide the portable executable.

At launch, the desktop executable checks the latest GitHub release. If its version is newer and GitHub provides a SHA-256 digest for `SolvePracticeLab.exe`, the app downloads and verifies it, checks its bundled assets, replaces the old executable after it closes, and relaunches. If the check fails or there is no newer release, the current app opens. `--no-update` skips the check for an offline launch; update errors are recorded in `%LOCALAPPDATA%\SolvePracticeLab\Updates\last-error.txt`. Publish the executable, its checksum, the installer, and its checksum together in each release. The updater requires the executable asset to be named `SolvePracticeLab.exe`. Advance `APP_VERSION` in `python/tools/desktop_update.py` for the next release.

To rebuild the executable on Windows:

```powershell
py -3.14 -m venv .venv
.venv\Scripts\python -m pip install -r python\tools\requirements-desktop.txt
.venv\Scripts\python python\tools\build_windows.py
.venv\Scripts\python python\tools\build_installer.py
```

The installer build requires Inno Setup 6 (`ISCC.exe`). The executable build checks bundled HTTP assets and writes `dist/SolvePracticeLab.sha256`; the installer build verifies that checksum and writes its own `.sha256` file. For a desktop window smoke check, run `dist\SolvePracticeLab.exe --ui-smoke build\ui-smoke-exe.txt` and read the generated report. The executable has a locally generated pixel globe icon and is unsigned.

## What is in the box

| Path | What it is |
|---|---|
| `app/index.html`, `app/*.js` | Simulator logic and interface: Redrock, Sea Wolf, two SFL formats, adaptive and spaced drills, history, review and exports. |
| `app/retro.css`, `app/assets/` | Pixel art interface, game-specific raster backgrounds, original SVG scenery, and the locally bundled Pixelify Sans font (OFL license in `app/assets/PIXELIFY-LICENSE.txt`). |
| `python/solve_lab/` | Seeded Redrock and Sea Wolf generators and scorers ported from the JS. Identical scenarios for the same seed. |
| `python/tools/` | `validate.py`, `parity_check.py`, `ui_smoke.py`, `export_scenarios.py` (JSON + CSV), `make_worksheet.py` (printable HTML), `seawolf_solver.py` (post-practice study tool), `serve.py`. |
| `research/` | Notes and JSON data on the games, timeline, scoring reports, statistics, competing simulators and an October 2026 Reddit evidence audit. Claims are labelled OFFICIAL / CORROBORATED / REPORTED / VENDOR CLAIM / CONTRADICTED / UNVERIFIED. |
| `docs/IDEAS.md` | 19 development ideas with brief how-to notes and a suggested order. |
| `docs/ARCHITECTURE.md` | How the code is organised and the change workflow. |
| `docs/KNOWN_DEVIATIONS.md` | Where the simulator differs from the real test and where every number came from. |
| `docs/GAME_AUDIT_2026-10-08.md` | Game-by-game content, interface and regression audit. |

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
| Python port vs JS in `app/index.html` | 1,000 seeds matched; the parity tool uses Node.js or headless Chrome. |
| Perfect Redrock answer sheet | scores 175 on 500 seeds; empty sheet scores 0 |
| Sea Wolf sites | planted team meets every requirement, solver finds a treatment at least as strong, unique names and 28-microbe pools across 1,500 sites |
| Unit tests | 15 pass |
| Interface | `python python/tools/ui_smoke.py` completes the 65, 85 and 95-minute routes, every standalone game, and imperfect or partial runs using browser input events; it checks all six spaced skill targets, review scheduling, pause and quit, timeouts, keyboard shortcuts and two-choice Sea Wolf profiles at 1280, 500 and 360 pixels. It checks text contrast, control labels, broken placeholders and local image loading; dark and light screens were also reviewed visually. Manual play remains useful for feel and pacing. |

## Interface notes

The DAY/NIGHT control saves your theme preference locally; new sessions start in day mode. The Keys menu lists shortcuts. Pause freezes the active timer and hides the game; Alt+P or Escape resumes. Quit asks before discarding an unfinished run, while saved history stays. In the Windows build, the quit prompt also offers Close desktop app. Redrock uses Alt+1/2/3 for Notebook, Exhibits and Calculator; during Analysis those shortcuts focus notes, expand the exhibits or focus the calculator, which stay visible together on wide screens. Its study information and exhibits are separate investigation steps; all three linked Analysis questions stay on one page. The Report has separate Written, Graph and Visual steps; the first two cases share a four-year exhibit. Click or drag facts from the study, exhibits and cases into the Notebook, mark important entries, and drag saved values into calculations or numeric answers. The notebook wraps saved facts and scales its scratch notes with the panel. The calculator accepts mouse and keyboard input, keeps recent results, and lets you drag a result to an answer or transfer it to a focused field. Redrock flags malformed numeric answers before you continue to the report; clear a field to skip it. Sea Wolf uses 1/2/3 for categorisation and prospects; during categorisation, the current and upcoming site briefs appear together so you can judge the “Next site” choice. Sea Wolf trait symbols stay visually neutral, with a key beside the site brief. SFL decisions use A/B/C, and Team Lab researchers can be dragged onto workstations or assigned with selectors. The results screen shows worked review, process metrics, a seed challenge link, detailed CSV, an AI review export and print-to-PDF controls. Sea Wolf's review follows its four main phases and compares your treatment with the best available practice example.

The AI review text file contains the scenario, question prompts, exhibits, selected and correct answers, reasons for decision options, scoring and a suggested analysis request. The ChatGPT, Claude and Gemini buttons download this file and open the provider site; attach it there to share it. The app does not send results automatically. The CSV includes question and explanation columns as well.

Extended sittings use 85 minutes (Redrock + Sea Wolf + 20-minute SFL Project Lead) or 95 minutes (with the 30-minute SFL Team Lab). A break screen pauses between games. The SFL tasks, timing and scoring are practice reconstructions because official details are limited.

Short sessions cover mental math, six Redrock cases at two minutes each, and Sea Wolf filtering. Redrock draws three of its four variable cases from the multi-step bank. Math drills include percentage change, percentage points, weighted averages, range checks, sequential changes, expected value, changing denominators and probability without replacement. Project Lead decisions include alternate situations for signals, timing, measures and capacity. The Sea Wolf filter drill shows its sorting rule beside every candidate; final treatments still use three-microbe averages. The five-minute adaptive drill reads recent missed skills from local history and chooses focused math, Redrock data, Sea Wolf filtering, or SFL decisions. Scores, phase time and mistake summaries are saved in this browser. Guided, Standard, Hard and Expert adjust numeric tolerance and Sea Wolf target width or distractors; learning hints can be switched on. Personal difficulty comparisons remain on this device.

The [practice scoring model](docs/PRACTICE_SCORING.md) grades Sea Wolf sorting, prospects, final treatment choice and target precision; Redrock numeric near misses and chart choice; and SFL decision consistency and outcomes. These weights are this project's rules. Past saved scores remain visible as legacy entries; history trends and seed comparisons use the current scoring model and matching difficulty. Shared challenge links include the difficulty setting.

Spaced practice uses the same five-minute skill drills on a local calendar schedule. A strong review moves a skill through 1, 3, 7, 14 and 30-day intervals; missed work returns the next day. Completed runs feed the schedule, including existing saved history when the plan is first created. The home and history screens show due skills, and the plan exports to CSV. This schedule is a study aid, not a McKinsey scoring rule.

Each game has its own dark and light palette and pixel backdrop: rust and sandstone for Redrock, sea glass and coral for Sea Wolf, and leafy greens and warm yellow for Sustainable Futures. The home screen uses a hand-drawn pixel shoreline. Sea Wolf target ranges and trait symbols appear on side notes on wide screens and compact notes on narrow screens. Microbes have distinct pixel silhouettes and colors unrelated to their traits or score. The treatment screen waits until submission to reveal whether the final averages satisfy the ranges. The menu includes seven practice tips, with links to the sources used and a clear distinction between practice habits and unpublished official scoring rules.

## Further features

- Practice reminders and optional calendar export for scheduled reviews.
- Confidence ratings before revealing a worked solution.
- Optional cross-device sync and friend leaderboards with accounts.
- More languages and screen-reader testing with human players.
- A scenario editor and downloadable weekly practice packs.

The interface uses original pixel art inspired by classic game screens and ocean exploration. Pixelify Sans is bundled for offline use; body text uses system fonts.

## Research caveats

Gathered on 2026-10-08. Sources are mostly commercial prep sites, whose claims can be biased and often copy each other. Open the URLs in `research/SOURCES.md` before relying on a number. One site that asked AI tools not to reuse its content was left out.

The [October 2026 Reddit audit](research/REDDIT_AUDIT_2026-10-08.md) records which new candidate reports were corroborated, which remain uncertain, and why no speculative Sea Wolf scoring rule was added.
