# Solve Practice Lab v1.4.2

## Quality and usability

- The top bar now shows the running app version on desktop and in the browser, including narrow screens. The desktop bundled-asset check rejects a mismatch between this label and the executable version.
- The installer now removes the recovery copy left by an in-place update when users uninstall.
- A live isolated upgrade from the published v1.4.0 executable to v1.4.1 completed: the old executable downloaded the GitHub release, verified its SHA-256 digest, replaced itself and relaunched at the new version.

## Verification

- All 16 unit tests passed, including a new browser/desktop version-consistency check.
- Browser smoke checks passed at 1280, 500 and 360 pixels across full sessions, standalone games, drills, history, saved reviews, pause/quit, timeouts, input validation, shortcuts, contrast and resource loading. True 360- and 390-pixel mobile viewports showed no horizontal overflow in the menu or Sea Wolf category and treatment screens.
- The Windows executable and installer passed bundled-asset, desktop launch, checksum, silent install and uninstall checks.

Download `SolvePracticeLab-Setup-1.4.2.exe` to install or `SolvePracticeLab.exe` for portable use. Existing Windows copies will download the verified portable executable at their next launch.
