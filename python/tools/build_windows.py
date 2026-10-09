#!/usr/bin/env python3
"""Build and verify a portable, one-file Windows desktop executable."""
from __future__ import annotations

import os
import hashlib
from pathlib import Path
import struct
import subprocess
import sys
import zlib


ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "app"
BUILD = ROOT / "build"
DIST = ROOT / "dist"


def make_icon(path: Path) -> None:
    """Draw a small original pixel globe and wrap its PNG in a Windows ICO."""
    size = 64
    pixels = bytearray()
    for y in range(size):
        pixels.append(0)  # PNG scanline filter
        for x in range(size):
            a, b = x // 4, y // 4
            distance = (a - 7.5) ** 2 + (b - 7.5) ** 2
            if distance > 54:
                rgba = (0, 0, 0, 0)
            elif distance > 43:
                rgba = (36, 62, 53, 255)
            elif (3 <= a <= 6 and 3 <= b <= 5) or (8 <= a <= 12 and 7 <= b <= 10) or (4 <= a <= 7 and 11 <= b <= 12):
                rgba = (182, 227, 130, 255)
            elif (a, b) in {(10, 3), (11, 3), (11, 4), (12, 4)}:
                rgba = (238, 173, 126, 255)
            else:
                rgba = (98, 145, 113, 255)
            pixels.extend(rgba)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(bytes(pixels), 9)) + chunk(b"IEND", b"")
    ico = struct.pack("<HHH", 0, 1, 1) + struct.pack("<BBBBHHII", size, size, 0, 0, 1, 32, len(png), 22) + png
    path.write_bytes(ico)


def main() -> int:
    if os.name != "nt":
        raise SystemExit("Build the Windows executable on Windows.")
    for target in (BUILD, DIST):
        if target.resolve().parent != ROOT.resolve():
            raise RuntimeError(f"Refusing to build outside the project: {target}")
    BUILD.mkdir(exist_ok=True)
    DIST.mkdir(exist_ok=True)
    icon = BUILD / "solve-lab.ico"
    make_icon(icon)
    command = [
        sys.executable, "-m", "PyInstaller", "--noconfirm",
        "--onefile", "--windowed", "--name", "SolvePracticeLab",
        "--icon", str(icon), "--add-data", f"{APP}{os.pathsep}app",
        "--distpath", str(DIST), "--workpath", str(BUILD / "work"),
        "--specpath", str(BUILD), str(ROOT / "python" / "tools" / "desktop.py"),
    ]
    subprocess.run(command, cwd=ROOT, check=True)
    executable = DIST / "SolvePracticeLab.exe"
    subprocess.run([str(executable), "--self-test"], cwd=ROOT, check=True, timeout=60)
    with executable.open("rb") as handle:
        digest = hashlib.file_digest(handle, "sha256").hexdigest()
    (DIST / "SolvePracticeLab.sha256").write_text(f"{digest}  SolvePracticeLab.exe\n", encoding="ascii")
    print(f"Verified {executable} ({executable.stat().st_size / 1024 / 1024:.1f} MiB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
