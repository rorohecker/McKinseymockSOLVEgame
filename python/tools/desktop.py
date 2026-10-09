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
from urllib.request import urlopen


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
            "/spaced.js": b"spacedPanelHTML",
            "/retro.css": b".spaced-panel",
            "/assets/hero-scene.svg": b"<svg",
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
    if "--self-test" in sys.argv:
        self_test()
        return 0
    smoke = "--ui-smoke" in sys.argv
    smoke_log = Path(sys.argv[sys.argv.index("--ui-smoke") + 1]) if smoke else None
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
        window = webview.create_window(
            "Solve Practice Lab",
            f"http://{HOST}:{PORT}/index.html",
            width=1220,
            height=820,
            min_size=(360, 560),
            background_color="#091a29",
            text_select=True,
        )
        result = {"status": "Desktop window did not finish loading"}
        def probe() -> None:
            try:
                if not window.events.loaded.wait(25):
                    raise TimeoutError("Desktop window did not load the game")
                loaded = window.evaluate_js("document.title === 'Solve Practice Lab' && typeof startDrill === 'function' && !!document.querySelector('.spaced-panel')")
                if not loaded:
                    raise RuntimeError("Game interface or practice scripts did not load")
                storage = window.evaluate_js("localStorage.setItem('solve-lab-desktop-smoke','ok'); var saved=localStorage.getItem('solve-lab-desktop-smoke'); localStorage.removeItem('solve-lab-desktop-smoke'); saved")
                if storage != "ok":
                    raise RuntimeError("Desktop local storage is unavailable")
                result["status"] = "OK: desktop window, game scripts and local storage"
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
