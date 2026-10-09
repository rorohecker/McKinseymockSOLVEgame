# Game content and interface audit — 2026-10-08

The simulator now gives players the rules and data needed for its own scoring before they commit an answer. Its scores remain an independent practice model; the published sources do not define the real assessment's private scoring.

| Area | Checked in the browser simulation | Information shown to the player |
|---|---|---|
| Redrock | Investigation, clickable exhibits and journal, calculator, six analysis answers, five written fields, four chart variants, six cases selected from nine templates, timeout and results | Objective, units, data tables and chart, answer tolerance, case data, worked review |
| Sea Wolf | Three sites, two-choice profile variants, categorisation, four prospect rounds, treatment, carry-overs, next-site preview, timeout and phase replay | Current and next site ranges and traits, profile matching explanation, the difference between individual search ranges and treatment averages, treatment status |
| SFL Project Lead | Priority ranking, 12 decisions, branching context, outcomes, review and timeout | Ranking objective, decision context, consequence signals and practice score breakdown |
| SFL Team Lab | Three days of questions, assignment, support, reflection, review and timeout | Persistent field notes, every station's required skill, assignment scoring rule and reflection guide |
| Focused practice | Math, Redrock cases, Sea Wolf filter, adaptive and spaced drills | Each prompt's units and rule; Sea Wolf drill uses an explicit sorting rule separate from treatment scoring |
| Shared controls | Seed challenge, history, exports, hints, difficulty, theme, pause, quit and keyboard shortcuts | Named controls, labeled form fields and visible feedback for invalid input |

The browser audit runs the 65, 85 and 95-minute routes, all standalone games, all six spaced skill targets, and timeout paths at 1280, 500 and 360 pixels. It checks horizontal overflow, text contrast, broken placeholders, accessible names and labels, and that every referenced local image loads. `python python/tools/ui_smoke.py` reruns it. `python -m unittest discover -s python/tests -v` checks the Python scenario port and core scoring invariants.

The distinction between confirmed assessment details and this simulator's choices is tracked in [KNOWN_DEVIATIONS.md](KNOWN_DEVIATIONS.md). A player can rely on the rules displayed in this simulator to understand its practice score, without treating those rules as official McKinsey scoring.
