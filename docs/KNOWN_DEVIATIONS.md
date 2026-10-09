# Known deviations from the real test

The real Solve is unpublished. This file lists where the simulator differs from what sources report, and where each number came from. "D#" refers to `research/DISCREPANCIES.md`.

## Provenance of numbers used

| In the simulator | Value | Source / reason |
|---|---|---|
| Redrock clock | 35 min | CORROBORATED (FACTS F23) |
| Sea Wolf clock | 30 min, shared by 3 sites | CORROBORATED |
| Redrock total points | 175 (Analysis 60, Report 25 + 30, Cases 60) | One vendor's model (SolvePrep). Not McKinsey's. |
| Answer tolerance | +/-0.5 (cases with prices: +/-0.05) | SolvePrep model; the price tolerance is this project's own choice |
| Hard Redrock tolerance | +/-0.25 except tighter case-specific tolerances | This project's practice setting |
| Hard Sea Wolf ranges | Planted-team average rounded down/up; four forbidden-trait distractors added | This project's practice setting, not a published real difficulty |
| Sea Wolf site score | 100, -20 per miss | Several vendor models; stacking per forbidden microbe is SolvePrep's (D3) |
| Sea Wolf team size and attribute scale | 3 microbes, values 1-10 | CORROBORATED |
| Attribute names | Permeability, Mobility, Energy | One vendor; names UNVERIFIED (D1) |
| Prospect rounds | 4 rounds, pick 1 of 3 | REPORTED by several vendors |
| Pool shown for categorising | first 10 filter matches | REPORTED (D5) |
| Microbe pool size | 28 per site | **This project's design choice** so filters have something to filter |
| Range width | 2 | Matches worked examples (8-10, 6-8, 2-4) |
| Pacing hints | 2 min per case, 10 min per site | Coaching guidance, not official |

## Differences you should know about

1. **Hidden facts are unknown.** Process scoring, weights between games and the true raw-score scale cannot be reproduced. The results page shows a practice score and self-review process metrics.
2. **Sea Wolf filter** uses three optional ranges and two trait toggles with an OR rule for the desired trait. Other sources describe a simpler "pick two characteristics" step (D4).
3. **Carry-over step** appears only from site 2 and is a keep/reject screen. Some sources do not mention it (D2).
4. **Pool design** (28 microbes with planted solutions, traps and carry-over bait) is invented to guarantee full-pool solvability. Candidate reports of 80% and 60% Sea Wolf ceilings do not establish whether the full pool was unsolvable or earlier choices removed a perfect team. The results screen shows both the best available from your choices and the full-pool reference.
5. **Redrock report** selects 5 prompts from an 8-prompt bank plus a chart; CaseStar describes 8-10 blanks (D8).
6. **Calculator** is available in Investigation; one source says it is not (D9). Drag-to-answer is a practice convenience.
7. **Exhibits** combine tables and a generated bar chart. The real visual design is not published.
8. **Case set** selects six from nine templates with randomised numbers, still much smaller than the real library.
9. **Case order** is shuffled per seed; the real order is unknown.
10. **Breaks** are available only between games. Briefing screens are static text.
11. **Sea Wolf feedback**: site effectiveness is shown right after submission, as reported for 2026 (D6). Detailed deductions appear only at the end.
12. **SFL** has original 20-minute Project Lead and 30-minute Team Lab reconstructions. Their content and scoring are not official. Reports disagree on whether every 95-minute invite contains a 30-minute SFL or includes survey time. Legacy Ecosystem Building is not implemented.
13. **Time-up handling** scores what is answered. The real game's behaviour at timeout is not documented.
14. **AI variation** is replaced by a seed. McKinsey says AI varies parameters per candidate (FACTS F06).

## Keep in mind when interpreting results

A practice score here is feedback on accuracy and pacing. It cannot be converted into a McKinsey raw score or decile (see `research/SCORING.md`).
