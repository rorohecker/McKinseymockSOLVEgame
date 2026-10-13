# Solve Practice Lab v1.4.0

## Interface and practice

- Reworked the app with a pixel art backdrop, clearer cards and text, and a responsive Redrock notebook. The square background pattern is gone.
- Sea Wolf microbes now use neutral trait symbols, with a key beside the site brief. Trait colors do not reveal which choice helps or hurts.
- Added Guided and Expert alongside Standard and Hard. Math drills cover more question types; Sustainable Futures Lab decisions have more scenario variants. Review explanations show the calculation or decision reason more directly.
- Difficulty comparisons now use feedback from the selected level and suggest the adjacent level when appropriate.

## Windows and exports

- Added a per-user Windows installer with a Start Menu shortcut and an optional desktop shortcut. The portable executable remains available.
- The desktop app checks the latest GitHub release at launch, verifies the executable against the release SHA-256 digest, tests its bundled assets, then replaces and relaunches it when a newer version exists. Use `--no-update` to skip the check.
- Results CSV now includes question and explanation fields. A structured AI review file includes scenario data, answers, scoring, option reasons, and a suggested analysis request. Buttons download the file and open ChatGPT, Claude, or Gemini for user-controlled sharing.

## Verification

- 15 unit tests passed. JavaScript and Python results matched across 1,000 seeds; 500 scenario seeds covering 1,500 Sea Wolf sites passed validation.
- Browser routes passed at 1280, 500, and 360 pixels, including full and standalone runs, difficulty variants, Sea Wolf symbols, results CSV, AI export, and provider handoffs. The 390-pixel mobile viewport was also reviewed visually.
- The portable executable passed its bundled asset and desktop window checks. The rebuilt installer installed the same verified executable, and silent uninstall removed it.

Download `SolvePracticeLab-Setup-1.4.0.exe` to install or `SolvePracticeLab.exe` to run the portable version. SHA-256 files are provided for both. These practice scores are independent feedback, not official assessment results.
