#!/usr/bin/env python3
"""Windows desktop window for the bundled Solve Practice Lab.

The same local origin and WebView profile are reused on every launch so that
practice history and spaced reviews persist between sessions.
"""
from __future__ import annotations

import ctypes
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import sys
import threading
import traceback
import webbrowser
from urllib.request import urlopen
from desktop_update import APP_VERSION, apply_update, check_and_stage, UPDATE_DIR


ROOT = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parents[2]))
APP = ROOT / "app"
HOST = "127.0.0.1"
PORT = 8765


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format: str, *_args: object) -> None:
        pass


class LocalServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class DesktopActions:
    def __init__(self) -> None:
        self._window = None
        self._quit_called = threading.Event()

    def quit(self) -> bool:
        self._quit_called.set()
        if self._window is not None:
            self._window.destroy()
        return True

    def open_review_service(self, service: str) -> bool:
        urls = {"chatgpt": "https://chatgpt.com/", "claude": "https://claude.ai/", "gemini": "https://gemini.google.com/"}
        if service not in urls:
            return False
        return webbrowser.open(urls[service])


def make_server(port: int = PORT) -> LocalServer:
    if not (APP / "index.html").is_file():
        raise FileNotFoundError(f"Game assets are missing from {APP}")
    handler = functools.partial(QuietHandler, directory=str(APP))
    return LocalServer((HOST, port), handler)


def show_error(message: str) -> None:
    ctypes.windll.user32.MessageBoxW(None, message, "Solve Practice Lab", 0x10)


def self_test() -> None:
    """Check actual bundled assets through the same HTTP handler as the app."""
    server = make_server(0)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        origin = f"http://{HOST}:{server.server_port}"
        required = {
            "/index.html": b"Solve Practice Lab",
            "/ui.js": b"function",
            "/ai-review.js": b"aiReviewData",
            "/spaced.js": b"spacedPanelHTML",
            "/retro.css": b".spaced-panel",
            "/assets/hero-scene.svg": b"<svg",
            "/assets/ocean-expedition-background.png": b"\x89PNG\r\n\x1a\n",
        }
        for path, marker in required.items():
            with urlopen(origin + path, timeout=5) as response:
                if response.status != 200 or marker not in response.read():
                    raise RuntimeError(f"Bundled asset check failed: {path}")
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


def main() -> int:
    if "--version" in sys.argv:
        print(APP_VERSION)
        return 0
    if "--apply-update" in sys.argv:
        try:
            return 0 if apply_update(Path(sys.argv[2]), Path(sys.argv[3]), int(sys.argv[4])) else 1
        except (IndexError, ValueError, OSError):
            return 1
    if "--self-test" in sys.argv:
        try:
            self_test()
            return 0
        except Exception:
            report = Path(sys.argv[sys.argv.index("--self-test-log") + 1]) if "--self-test-log" in sys.argv else UPDATE_DIR / "self-test-error.txt"
            report.parent.mkdir(parents=True, exist_ok=True)
            report.write_text(traceback.format_exc(), encoding="utf-8")
            return 1
    smoke = "--ui-smoke" in sys.argv
    smoke_log = Path(sys.argv[sys.argv.index("--ui-smoke") + 1]) if smoke else None
    if not smoke and "--no-update" not in sys.argv:
        try:
            if check_and_stage():
                return 0
        except Exception as exc:
            UPDATE_DIR.mkdir(parents=True, exist_ok=True)
            (UPDATE_DIR / "last-error.txt").write_text(str(exc), encoding="utf-8")
    def fail(message: str) -> int:
        if smoke_log:
            smoke_log.write_text(message, encoding="utf-8")
        else:
            show_error(message)
        return 1
    try:
        server = make_server()
    except OSError:
        return fail("Port 8765 is already in use. Close the other Solve Practice Lab window or local server, then try again. Keeping this port stable preserves your saved practice history.")
    except Exception as exc:
        return fail(str(exc))

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        import webview

        profile = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "SolvePracticeLab" / "WebView"
        profile.mkdir(parents=True, exist_ok=True)
        actions = DesktopActions()
        window = webview.create_window(
            "Solve Practice Lab",
            f"http://{HOST}:{PORT}/index.html",
            width=1360,
            height=860,
            min_size=(360, 560),
            background_color="#1b2724",
            text_select=True,
            js_api=actions,
        )
        actions._window = window
        result = {"status": "Desktop window did not finish loading"}
        def probe() -> None:
            try:
                if not window.events.loaded.wait(25):
                    raise TimeoutError("Desktop window did not load the game")
                loaded = window.evaluate_js("document.title === 'Solve Practice Lab' && typeof startDrill === 'function' && !!document.querySelector('.spaced-panel')")
                if not loaded:
                    raise RuntimeError("Game interface or practice scripts did not load")
                bridge = window.evaluate_js("typeof window.pywebview?.api?.quit === 'function'")
                if not bridge:
                    raise RuntimeError("Desktop quit control is unavailable")
                exit_button = window.evaluate_js("!!document.querySelector('[data-act=\"exit-app\"]')")
                if not exit_button:
                    raise RuntimeError("Desktop exit button is unavailable")
                storage = window.evaluate_js("localStorage.setItem('solve-lab-desktop-smoke','ok'); var saved=localStorage.getItem('solve-lab-desktop-smoke'); localStorage.removeItem('solve-lab-desktop-smoke'); saved")
                if storage != "ok":
                    raise RuntimeError("Desktop local storage is unavailable")
                window.evaluate_js("setTimeout(() => document.querySelector('[data-act=\"exit-app\"]').click(), 10); true")
                if not actions._quit_called.wait(8):
                    raise RuntimeError("Desktop exit button did not call the quit bridge")
                if not window.events.closed.wait(8):
                    raise RuntimeError("Desktop quit bridge did not close the window")
                result["status"] = "OK: desktop window, exit button, quit bridge, game scripts and local storage"
            except Exception as exc:
                result["status"] = str(exc)
            finally:
                window.destroy()

        webview.start(probe if smoke else None, gui="edgechromium", private_mode=False, storage_path=str(profile))
        if smoke_log:
            smoke_log.write_text(result["status"], encoding="utf-8")
            return 0 if result["status"].startswith("OK:") else 1
        return 0
    except Exception as exc:
        return fail(f"The desktop window could not open. Check that Microsoft Edge WebView2 Runtime is installed.\n\n{exc}")
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


if __name__ == "__main__":
    raise SystemExit(main())
