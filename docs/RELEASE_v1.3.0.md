# Solve Practice Lab v1.3.0

## Practice changes

- Redrock now separates Study Information, Exhibits, Analysis, Written, Graph, Visual, and six cases. Its first two cases share a four-year exhibit; three of the remaining four require multi-step reasoning.
- Proposal questions use group-specific percentage, fixed, shared-reserve, reduction, and unchanged rules. Report answers and chart data are checked against the same seeded study.
- The Redrock notebook accepts clicked or dragged facts, lets you mark and reorder them, and passes saved values into answers or calculations. The calculator supports mouse and keyboard input, result history, and drag-to-answer.
- Sustainable Futures Lab has more varied settings and closer, plausible response choices, with one strongest answer per decision. Team Lab includes six support prompts and drag-to-assign workstations.
- Fixed a refresh issue where an entered zero could appear blank on a numeric answer field.

## Verification

- 12 unit tests passed. 500 generated Redrock and Sea Wolf scenarios passed validation, including solvable treatments, distinct multiple-choice answers, and the case difficulty mix. JavaScript and Python matched across 1,000 seeds.
- 500 Hard Sea Wolf seeds retained solvable sites and distinct distractors. 500 Sustainable Futures Lab seeds had complete, distinct choices and reachable perfect practice scores.
- Browser routes passed at 1280, 500, and 360 pixels, including full and standalone runs, timeouts, partial answers, notebook and calculator actions, drag and drop, history, adaptive and spaced drills, and input validation.
- Scenario export, worksheet generation, and Sea Wolf solver commands passed. The Windows executable passed its bundled asset self-test and desktop window smoke check.

The scores are independent practice feedback, not McKinsey scores or pass predictions. Download `SolvePracticeLab.exe` for Windows and verify it with `SolvePracticeLab.sha256`.
