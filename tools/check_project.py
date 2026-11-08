#!/usr/bin/env python3
"""Validate the generated wallBoard storefront-only preview without third-party packages."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
EXPECTED_PAGES = 16


class AssetParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and not attrs.get('href'):
            self.errors.append('anchor without href')
        if tag == 'img' and 'alt' not in attrs:
            self.errors.append('image missing alt attribute')
        fields = ('href',) if tag in {'a', 'link'} else ('src',) if tag in {'img', 'script'} else ()
        for field in fields:
            if attrs.get(field):
                self.links.append((tag, attrs[field]))


def run():
    errors = []
    if not (SITE / 'index.html').is_file():
        raise SystemExit('site/index.html is missing. Run python tools/build_standalone.py first.')

    pages = sorted(SITE.rglob('*.html'))
    if len(pages) != EXPECTED_PAGES:
        errors.append(f'Expected {EXPECTED_PAGES} storefront pages, found {len(pages)}')
    if (SITE / 'admin').exists() or (SITE / 'assets/js/admin.js').exists():
        errors.append('A custom admin preview must not be included in this Django Admin release')

    for html in pages:
        text = html.read_text(encoding='utf-8')
        if text.lower().count('<!doctype html>') != 1:
            errors.append(f'{html.relative_to(SITE)}: invalid DOCTYPE count')
        if 'lang="fa"' not in text or 'dir="rtl"' not in text:
            errors.append(f'{html.relative_to(SITE)}: missing Persian RTL document attributes')

        parser = AssetParser()
        parser.feed(text)
        errors.extend(f'{html.relative_to(SITE)}: {message}' for message in parser.errors)
        for tag, raw_url in parser.links:
            url = urlsplit(raw_url)
            if url.scheme in {'http', 'https', 'mailto', 'tel', 'data'} or raw_url.startswith('#'):
                continue
            if url.scheme or raw_url.startswith('//') or not url.path:
                continue
            if url.path.startswith('/'):
                errors.append(f'{html.relative_to(SITE)}: unexpected absolute local path {raw_url}')
                continue
            destination = (html.parent / unquote(url.path)).resolve()
            if not destination.is_relative_to(SITE.resolve()) or not destination.is_file():
                errors.append(f'{html.relative_to(SITE)}: missing {tag} target {raw_url}')

    token_file = ROOT / 'developer-source/src/styles/tokens.css'
    if '--red: #FF636C' not in token_file.read_text(encoding='utf-8'):
        errors.append('Primary brand color token must be #FF636C')

    product_assets = [
        'pegboard-panel.webp',
        'small-clips-set.webp',
        'medium-clips-pair.webp',
        'support-brackets-pair.webp',
        'desk-stand-pair.webp',
        'large-clips-with-shelf.webp',
    ]
    product_dir = ROOT / 'developer-source/public/images/products'
    for asset in product_assets:
        if not (product_dir / asset).is_file():
            errors.append(f'Missing product media asset: {asset}')

    hero_assets = [
        'hero-panel.webp',
        'hero-workspace.webp',
        'hero-modular-kit.webp',
    ]
    hero_dir = ROOT / 'developer-source/public/images/hero'
    for asset in hero_assets:
        if not (hero_dir / asset).is_file():
            errors.append(f'Missing hero media asset: {asset}')

    product_data = (ROOT / 'developer-source/src/data/products.js').read_text(encoding='utf-8')
    expected_product_ids = [
        "'panel-30'",
        "'small-clips'",
        "'medium-clips'",
        "'support-brackets'",
        "'desk-stands'",
        "'large-clips-with-shelf'",
    ]
    for product_id in expected_product_ids:
        if product_id not in product_data:
            errors.append(f'Missing confirmed product fixture: {product_id}')

    for html in (ROOT / 'developer-source').glob('*.html'):
        text = html.read_text(encoding='utf-8')
        if 'board-art' in text or 'hero-art__board' in text:
            errors.append(f'{html.name}: legacy CSS-drawn product artwork remains in HTML')

    banner_content = ROOT / 'developer-source/src/features/hero-content.js'
    if not banner_content.is_file() or 'api.banners.list(' not in banner_content.read_text(encoding='utf-8'):
        errors.append('Django-managed home banner loader is missing')

    slider_file = ROOT / 'developer-source/src/features/hero-slider.js'
    if 'SLIDE_INTERVAL_MS = 5000' not in slider_file.read_text(encoding='utf-8'):
        errors.append('Homepage slider interval must remain 5000ms')

    for bundle in ['store.js', 'auth.js']:
        path = SITE / 'assets/js' / bundle
        if not path.is_file() or path.stat().st_size == 0:
            errors.append(f'Missing or empty JavaScript bundle: {bundle}')

    if errors:
        raise SystemExit('\n'.join(f'ERROR: {error}' for error in errors))
    print(f'PASS: {len(pages)} pages, local links/assets, Persian RTL, brand token, slider timing, product media, Django banner loader and storefront-only package.')


if __name__ == '__main__':
    run()
