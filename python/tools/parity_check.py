#!/usr/bin/env python3
"""Check that the Python generators match the JavaScript in app/index.html.

Runs the real ``<script id="logic">`` block from the HTML under Node for a range of
seeds, runs the Python port for the same seeds, and compares the scenarios.

    python tools/parity_check.py            # seeds 1..200
    python tools/parity_check.py 1 1000     # custom range

Uses Node.js if available, otherwise a local Chrome/Chromium browser.
Exit code 1 on any mismatch.
"""
import html
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "python"))

from solve_lab.snapshot import snapshot  # noqa: E402

HARNESS = r"""
function snap(seed){const d=genRedrock(seed),w=genSeaWolf(seed);return{
 rr:{theme:d.theme,names:d.names,terr:d.terr,totals:d.totals,y4:d.y4,pctA:d.pctA,kmB:d.kmB,elk:d.elk,
  an:d.an.map(q=>({title:q.title,parts:q.parts.map(p=>({key:p.key,text:p.text,unit:p.unit,ans:p.ans}))})),
  vis:d.vis,blanks:d.blanks,cases:d.cases},
 sw:{sites:w.sites.map(s=>({name:s.name,contam:s.contam,desired:s.desired,undesired:s.undesired,avg:s.avg,ranges:s.ranges,planted:s.planted,pool:s.pool}))}}}
const out=[];for(let s=%d;s<=%d;s++)out.push(snap(s));
process.stdout.write(JSON.stringify(out));
"""


def js_logic() -> str:
    html = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
    return html.split('<script id="logic">')[1].split("</script>")[0]


def find_chrome():
    for name in ("chrome", "google-chrome", "chromium", "chromium-browser", "msedge"):
        path = shutil.which(name)
        if path:
            return path
    for path in (
        pathlib.Path(os.environ.get("PROGRAMFILES", "C:/Program Files")) / "Google/Chrome/Application/chrome.exe",
        pathlib.Path(os.environ.get("PROGRAMFILES(X86)", "C:/Program Files (x86)")) / "Google/Chrome/Application/chrome.exe",
    ):
        if path.is_file():
            return str(path)
    return None


def js_snapshots(lo, hi):
    if shutil.which("node"):
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".js", delete=False) as f:
            f.write(js_logic() + HARNESS % (lo, hi))
            path = pathlib.Path(f.name)
        try:
            res = subprocess.run(["node", str(path)], capture_output=True, text=True, encoding="utf-8")
        finally:
            path.unlink(missing_ok=True)
        if res.returncode:
            raise RuntimeError(res.stderr)
        return json.loads(res.stdout)
    chrome = find_chrome()
    if not chrome:
        raise RuntimeError("Node.js or Chrome/Chromium is required for parity checks.")
    browser_code = HARNESS.replace("process.stdout.write(JSON.stringify(out));",
                                   'document.getElementById("out").textContent=JSON.stringify(out);') % (lo, hi)
    page = '<!doctype html><meta charset="utf-8"><pre id="out"></pre><script>' + js_logic() + browser_code + '</script>'
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".html", delete=False) as f:
        f.write(page)
        path = pathlib.Path(f.name)
    try:
        res = subprocess.run([chrome, "--headless", "--disable-gpu", "--no-sandbox",
                              "--disable-extensions", "--virtual-time-budget=10000",
                              "--dump-dom", path.resolve().as_uri()],
                             capture_output=True, text=True, encoding="utf-8")
    finally:
        path.unlink(missing_ok=True)
    match = re.search(r'<pre id="out">(.*?)</pre>', res.stdout, re.S)
    if res.returncode or not match:
        raise RuntimeError(res.stderr[-1000:] or "Chrome did not return scenario data.")
    return json.loads(html.unescape(match.group(1)))


def norm(x):
    """Treat 25.0 and 25 as equal; recurse through containers."""
    if isinstance(x, float) and x.is_integer():
        return int(x)
    if isinstance(x, list):
        return [norm(i) for i in x]
    if isinstance(x, dict):
        return {k: norm(v) for k, v in x.items()}
    return x


def diff(a, b, path=""):
    if type(a) != type(b):
        return f"{path}: type {type(a).__name__} vs {type(b).__name__} ({a!r} vs {b!r})"
    if isinstance(a, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b:
                return f"{path}.{k}: missing on one side"
            r = diff(a[k], b[k], f"{path}.{k}")
            if r:
                return r
    elif isinstance(a, list):
        if len(a) != len(b):
            return f"{path}: length {len(a)} vs {len(b)}"
        for i, (x, y) in enumerate(zip(a, b)):
            r = diff(x, y, f"{path}[{i}]")
            if r:
                return r
    elif a != b:
        return f"{path}: {a!r} (js) vs {b!r} (python)"
    return None


def main():
    lo = int(sys.argv[1]) if len(sys.argv) > 2 else 1
    hi = int(sys.argv[2]) if len(sys.argv) > 2 else (int(sys.argv[1]) if len(sys.argv) == 2 else 200)
    try:
        js = js_snapshots(lo, hi)
    except (RuntimeError, json.JSONDecodeError) as exc:
        print(exc)
        sys.exit(2)
    bad = 0
    for i, seed in enumerate(range(lo, hi + 1)):
        r = diff(norm(js[i]), norm(json.loads(json.dumps(snapshot(seed)))), f"seed {seed}")
        if r:
            bad += 1
            print("MISMATCH", r)
            if bad >= 5:
                break
    n = hi - lo + 1
    print(f"{'FAIL' if bad else 'OK'}: compared {n} seeds ({lo}..{hi}), {bad} mismatching")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
