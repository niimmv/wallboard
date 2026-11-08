#!/usr/bin/env python3
"""Local preview server for wallBoard; Python standard library only."""
from __future__ import annotations

import socket
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SITE = Path(__file__).resolve().parent / 'site'
HOST = '127.0.0.1'


class PreviewHandler(SimpleHTTPRequestHandler):
    """Serve the compiled static website, without serving the project sources."""

    def end_headers(self) -> None:
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def choose_port(start: int = 8765) -> int:
    for port in range(start, start + 15):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as connection:
                connection.bind((HOST, port))
            return port
        except OSError:
            continue
    raise RuntimeError('No free local port in range 8765–8779')


def main() -> None:
    if not (SITE / 'index.html').exists():
        raise FileNotFoundError('site/index.html is missing. Extract the entire ZIP file.')

    port = choose_port()
    handler = partial(PreviewHandler, directory=str(SITE))
    with ThreadingHTTPServer((HOST, port), handler) as server:
        url = f'http://{HOST}:{port}/index.html'
        print('wallBoard is running')
        print('Storefront:', url)
        print('Admin: handled by the Django backend after integration.')
        print('Press Ctrl+C to stop. Keep this window open while viewing the site.')
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\nStopped.')


if __name__ == '__main__':
    main()
