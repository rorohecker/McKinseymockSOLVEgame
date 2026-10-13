"""Verified, launch-time updates for the frozen Windows desktop app."""
from __future__ import annotations

import ctypes
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
from urllib.request import Request, urlopen


APP_VERSION = "1.4.1"
RELEASE_API = "https://api.github.com/repos/rorohecker/McKinseymockSOLVEgame/releases/latest"
ASSET_NAME = "SolvePracticeLab.exe"
UPDATE_DIR = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "SolvePracticeLab" / "Updates"
CREATE_NO_WINDOW = 0x08000000 if os.name == "nt" else 0


def version_tuple(value: str) -> tuple[int, int, int] | None:
    match = re.fullmatch(r"v?(\d+)\.(\d+)\.(\d+)", value)
    return tuple(map(int, match.groups())) if match else None


def release_asset(release: dict) -> tuple[str, str, str] | None:
    version = version_tuple(str(release.get("tag_name", "")))
    if not version or version <= version_tuple(APP_VERSION):
        return None
    for asset in release.get("assets", []):
        url = asset.get("browser_download_url") or ""
        digest = asset.get("digest") or ""
        if asset.get("name") == ASSET_NAME and re.fullmatch(r"sha256:[0-9a-fA-F]{64}", digest) and re.fullmatch(
            r"https://github\.com/rorohecker/McKinseymockSOLVEgame/releases/download/[^/]+/SolvePracticeLab\.exe", url
        ):
            return release["tag_name"], url, digest[7:].lower()
    return None


def download_verified(url: str, expected: str, destination: Path) -> None:
    digest = hashlib.sha256()
    request = Request(url, headers={"User-Agent": f"SolvePracticeLab/{APP_VERSION}", "Accept": "application/octet-stream"})
    with urlopen(request, timeout=20) as response, destination.open("wb") as output:
        if response.url.startswith("https://") is False:
            raise ValueError("Release download redirected to an insecure URL")
        size = 0
        while chunk := response.read(1024 * 1024):
            size += len(chunk)
            if size > 150 * 1024 * 1024:
                raise ValueError("Release exceeds expected size")
            digest.update(chunk)
            output.write(chunk)
    if digest.hexdigest() != expected:
        destination.unlink(missing_ok=True)
        raise ValueError("Release SHA-256 digest does not match GitHub's release metadata")


def check_and_stage() -> bool:
    """Stage a newer executable and hand replacement to a copy of this app."""
    if not getattr(sys, "frozen", False):
        return False
    UPDATE_DIR.mkdir(parents=True, exist_ok=True)
    for previous in UPDATE_DIR.glob("update-helper-*.exe"):
        try:
            previous.unlink()
        except OSError:
            pass  # The helper for a just-completed update may still be exiting.
    target = Path(sys.executable).resolve()
    try:
        target.with_suffix(".previous.exe").unlink(missing_ok=True)
    except OSError:
        pass
    request = Request(RELEASE_API, headers={"User-Agent": f"SolvePracticeLab/{APP_VERSION}", "Accept": "application/vnd.github+json"})
    with urlopen(request, timeout=5) as response:
        candidate = release_asset(json.load(response))
    if not candidate:
        return False
    tag, url, digest = candidate
    payload = UPDATE_DIR / f"SolvePracticeLab-{tag}-{os.getpid()}.exe"
    helper = UPDATE_DIR / f"update-helper-{os.getpid()}.exe"
    try:
        download_verified(url, digest, payload)
        subprocess.run([str(payload), "--self-test"], check=True, timeout=60, creationflags=CREATE_NO_WINDOW)
        shutil.copy2(target, helper)
        subprocess.Popen([str(helper), "--apply-update", str(target), str(payload), str(os.getpid())],
                         close_fds=True, creationflags=CREATE_NO_WINDOW)
        return True
    except Exception:
        payload.unlink(missing_ok=True)
        helper.unlink(missing_ok=True)
        raise


def apply_update(target: Path, payload: Path, parent_pid: int) -> bool:
    """Run from a helper copy after the parent app releases target.exe."""
    target = target.resolve()
    payload = payload.resolve()
    if not target.is_file() or not payload.is_file() or target.name != ASSET_NAME or payload.parent != UPDATE_DIR.resolve():
        return False
    handle = ctypes.windll.kernel32.OpenProcess(0x00100000, False, parent_pid)
    if handle:
        ctypes.windll.kernel32.WaitForSingleObject(handle, 60000)
        ctypes.windll.kernel32.CloseHandle(handle)
    backup = target.with_suffix(".previous.exe")
    def reopen_existing() -> None:
        try:
            (UPDATE_DIR / "last-error.txt").write_text("The verified update could not replace or launch the executable. The previous version was reopened.", encoding="utf-8")
        except OSError:
            pass
        try:
            subprocess.Popen([str(target), "--no-update"], cwd=str(target.parent), close_fds=True, creationflags=CREATE_NO_WINDOW)
        except OSError:
            pass
    for attempt in range(30):
        try:
            backup.unlink(missing_ok=True)
            os.replace(target, backup)
            try:
                os.replace(payload, target)
            except Exception:
                os.replace(backup, target)
                raise
            break
        except OSError:
            time.sleep(1)
    else:
        reopen_existing()
        return False
    try:
        subprocess.Popen([str(target)], cwd=str(target.parent), close_fds=True, creationflags=CREATE_NO_WINDOW)
        return True
    except OSError:
        os.replace(target, payload)
        os.replace(backup, target)
        reopen_existing()
        return False
