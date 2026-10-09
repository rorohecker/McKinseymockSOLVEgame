#!/usr/bin/env python3
"""Serve the simulator locally and open it in your browser.

    python tools/serve.py            # http://localhost:8765
    python tools/serve.py 9000

The pixel display font is bundled locally. Body fonts load from Google Fonts when
available and use system fallbacks offline.
"""
import functools
import http.server
import pathlib
import sys
import threading
import webbrowser

APP = pathlib.Path(__file__).resolve().parents[2] / "app"


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(APP))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as srv:
        url = f"http://localhost:{port}/index.html"
        print("serving", APP, "at", url, "(Ctrl+C to stop)")
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")


if __name__ == "__main__":
    main()
