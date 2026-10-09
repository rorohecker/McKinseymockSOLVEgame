# Sea Wolf

Time: 30 minutes, one clock shared by three sites. Suggested pace: under 10 minutes per site; bank time early.

## Objects

- **Microbe**: 3 numeric attributes on a 1-10 scale, and one trait.
- **Site**: a contaminant, one target range per attribute, one desired trait, one forbidden trait. Not every site shows all of them (SolvePrep).
- **Treatment**: exactly 3 microbes.

## Validity of a treatment (CORROBORATED)

1. The **average** of the three microbes' values for each attribute must lie inside the site's range (endpoints count as inside).
2. At least one microbe has the desired trait.
3. No microbe has the forbidden trait.

Shortcut taught by several guides: work with sums. If the average range is 4.0-6.0, the sum of the three values must be 12-18.

## Reported flow per site

| Step | What the player does |
|---|---|
| Profile / filters | Choose exactly two characteristics: two numeric attributes, two traits, or one of each. Several guides describe 3 attribute and 4 trait choices. Whether this changes later microbes is disputed. |
| Categorise | Sort microbes as this site, a later site, or reject. About 10 microbes shown. |
| Prospect | Four rounds of three microbes, pick one each round. Reported to add 4 to the pool. |
| Treatment | Choose the final three. |
| Confirm carry-overs (SolvePrep only) | Microbes you saved for "next site" return for a keep/reject check. |

The "later site" tag makes the games linked: a microbe that is poor for site 1 may be ideal for site 2.

The simulator shows seven profile choices and applies the selected pair to its generated pool. Two numeric ranges combine; an included trait widens a numeric match, while an avoided trait excludes it. This matching rule is a practice design. [MConsultingPrep](https://mconsultingprep.com/mckinsey-solve-seawolf-deep-dive) describes the two-choice combinations and says the step does not affect later phases. [CaseBasix](https://www.casebasix.com/pages/mckinsey-problem-solving-game-solve-full-guide) says the filters generate the initial pool, while [SolveGamesGuide](https://solvegamesguide.com/mckinsey-sea-wolf) says its practice model keeps the later microbes unchanged. No public McKinsey rule resolves the conflict.

## Scoring as reported

- Start each site at 100%.
- -20 for each attribute average outside its range (3 attributes).
- -20 if no microbe has the desired trait.
- -20 per microbe with the forbidden trait (SolvePrep) or once (MyConsultingCoach).
- Sites cannot go below 0. SolvePrep's total across three sites is 300.
- Candidate reports mention silent deductions with no warning in the interface, and that some sites cannot reach 100%.

## Reported error rates (SolvePrep dataset, n = 21,456 submitted sites)

| Error | Share of submitted sites |
|---|---|
| Attribute average out of range | 33.5% |
| Forbidden trait included | 12.6% |
| Desired trait missing | 9.8% |

## Reported failure patterns (SolvePrep survey, n = 312 debriefs, self-reported)

1. Too much time on sites 1 and 2 (about 68%).
2. Treating the forbidden trait as a soft preference (about 54%).
3. Re-solving every site from scratch instead of using one routine (about 47%).
4. Pushing cleaning above the target (about 31%). Note: "cleaning" language comes from that survey and is not part of the other sources' rules.
5. Changing answers in the last five minutes (about 29%).

## Tactics repeated across sources

- Remove forbidden-trait microbes first.
- Keep at least one desired-trait microbe.
- Check **sums** against 3x the range ends.
- Use scratch paper for the constraints.
- A top-decile candidate quoted by CaseStar finished one site at 80% rather than chase 100% everywhere (candidate-reported).

## Attribute names (UNVERIFIED)

Three different name sets appear: Permeability / Mobility / Energy; Permeability / Rigidity / Size; and a vendor's own "fuel breakdown / spread containment / cold resilience". Treat names as cosmetic.

## Worked example (StrategyU)

Site 1 targets: Permeability 8-10, Rigidity 6-8, Size 2-4, desired Heat Resistant, forbidden Phosphorous Removal.
Team Lior Volvox (10/2/4), Ryn Bacil (4/8/3), Xylo Phage (10/10/5, Heat Resistant) averages 8.00 / 6.67 / 4.00, which is valid. Orun Nema (8/6/3) looks good by numbers but carries the forbidden trait.
