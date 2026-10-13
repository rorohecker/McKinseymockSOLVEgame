#!/usr/bin/env python3
"""Compile the per-user Inno Setup package for the verified desktop build."""
from __future__ import annotations

import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import sys

from desktop_update import APP_VERSION

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    exe = ROOT / "dist" / "SolvePracticeLab.exe"
    checksum = ROOT / "dist" / "SolvePracticeLab.sha256"
    if not exe.is_file() or not checksum.is_file():
        raise SystemExit("Build the desktop executable first: python python/tools/build_windows.py")
    expected = checksum.read_text(encoding="ascii").split()[0]
    if hashlib.sha256(exe.read_bytes()).hexdigest() != expected:
        raise SystemExit("Desktop executable does not match its SHA-256 checksum. Rebuild it first.")
    candidates = [shutil.which("ISCC.exe"),
                  str(Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "Inno Setup 6" / "ISCC.exe"),
                  r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
                  r"C:\Program Files\Inno Setup 6\ISCC.exe"]
    compiler = next((str(p) for p in candidates if p and Path(p).is_file()), None)
    if not compiler:
        raise SystemExit("Inno Setup 6 is required to compile the installer (ISCC.exe).")
    script = ROOT / "installer" / "SolvePracticeLab.iss"
    subprocess.run([compiler, f"/DAppVersion={APP_VERSION}", str(script)], cwd=script.parent, check=True)
    package = ROOT / "dist" / f"SolvePracticeLab-Setup-{APP_VERSION}.exe"
    if not package.is_file():
        raise SystemExit("Inno Setup did not create the expected package")
    digest = hashlib.sha256(package.read_bytes()).hexdigest()
    (ROOT / "dist" / f"SolvePracticeLab-Setup-{APP_VERSION}.sha256").write_text(
        f"{digest}  {package.name}\n", encoding="ascii")
    print(f"Verified {package} ({package.stat().st_size / 1024 / 1024:.1f} MiB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
