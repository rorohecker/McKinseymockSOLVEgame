#!/usr/bin/env python3
"""Exercise the browser UI, saved review plan, complete routes and timeouts."""
from __future__ import annotations

from html import unescape
from pathlib import Path
import os
import re
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
HARNESS = ROOT / "python" / "tools" / "ui_smoke.js"


def verify_resources() -> None:
    """Catch broken local script, art and font references before browser routes."""
    sources = [APP / "index.html", APP / "retro.css", *APP.glob("*.js")]
    combined = "\n".join(path.read_text(encoding="utf-8") for path in sources)
    scripts = re.findall(r'<script\s+src="([^"]+)"', (APP / "index.html").read_text(encoding="utf-8"))
    assets = set(re.findall(r"assets/[A-Za-z0-9_.-]+", combined))
    for relative in [*scripts, *assets, "retro.css"]:
        target = (APP / relative).resolve()
        if target.parent not in (APP.resolve(), (APP / "assets").resolve()) or not target.is_file() or not target.stat().st_size:
            raise RuntimeError(f"Missing or empty local resource: {relative}")
        if target.suffix == ".svg" and ET.parse(target).getroot().tag != "{http://www.w3.org/2000/svg}svg":
            raise RuntimeError(f"Invalid SVG root: {relative}")
        if target.suffix == ".ttf" and target.read_bytes()[:4] not in (b"\x00\x01\x00\x00", b"OTTO"):
            raise RuntimeError(f"Invalid font header: {relative}")
    print(f"Resources: {len(scripts)} scripts and {len(assets)} art/font references verified")


def chrome_path() -> Path:
    candidates = [
        Path(os.environ.get("PROGRAMFILES", r"C:\Program Files")) / "Google/Chrome/Application/chrome.exe",
        Path(os.environ.get("PROGRAMFILES(X86)", r"C:\Program Files (x86)")) / "Microsoft/Edge/Application/msedge.exe",
        Path("/usr/bin/google-chrome"),
        Path("/usr/bin/chromium"),
        Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    raise RuntimeError("Chrome or Edge is required for the UI smoke check")


def run(width: int, page: Path, browser: Path) -> bool:
    with tempfile.TemporaryDirectory(prefix="solve-lab-ui-smoke-") as profile:
        args = [
            str(browser), "--headless=new", "--no-first-run", "--disable-gpu",
            "--no-sandbox", "--disable-extensions", "--disable-background-networking",
            f"--user-data-dir={profile}", f"--window-size={width},900",
            "--virtual-time-budget=5000", "--dump-dom", page.as_uri(),
        ]
        result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=45)
    match = re.search(r'<pre id="qa-output">([\s\S]*?)</pre>', result.stdout)
    if not match:
        print(f"{width}px: harness did not report (Chrome exit {result.returncode})", file=sys.stderr)
        print((result.stderr or result.stdout)[-1800:], file=sys.stderr)
        return False
    report = unescape(match.group(1))
    print(f"{width}px browser run:\n{report}")
    return result.returncode == 0 and "FAIL " not in report and "BROWSER ERROR " not in report


def main() -> int:
    verify_resources()
    browser = chrome_path()
    original = (APP / "index.html").read_text(encoding="utf-8")
    script = HARNESS.relative_to(APP.parent).as_posix()
    generated = original.replace("</body>", f'<script src="../{script}"></script></body>')
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", suffix=".html", prefix=".ui-smoke-", dir=APP, delete=False) as handle:
        handle.write(generated)
        page = Path(handle.name)
    try:
        return 0 if all(run(width, page, browser) for width in (1280, 500, 360)) else 1
    finally:
        if page.resolve().parent != APP.resolve():
            raise RuntimeError("Refusing to remove a page outside app/")
        page.unlink(missing_ok=True)


if __name__ == "__main__":
    raise SystemExit(main())
