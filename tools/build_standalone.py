#!/usr/bin/env python3
"""Create a file://-friendly wallBoard build with zero third-party dependencies.

This deliberately small build script supports the project's existing named ES imports
and named function/const exports. It rejects unknown syntax rather than silently
building broken JavaScript. The original ES modules are preserved in the source folder.
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[1]
SOURCE = OUTPUT / 'developer-source'
SITE = OUTPUT / 'site'

IMPORT_RE = re.compile(
    r"^import\s*\{(?P<symbols>[\s\S]*?)\}\s*from\s*['\"](?P<path>[^'\"]+)['\"]\s*;",
    re.MULTILINE,
)
EXPORT_RE = re.compile(r"^export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)", re.MULTILINE)

compiled = set()


def transform(module: Path) -> str:
    key = module.resolve().relative_to(SOURCE.resolve()).as_posix()
    if key in compiled:
        return ''
    raw = module.read_text(encoding='utf-8')
    deps = []
    imports = []

    def visit_import(match):
        imported_file = (module.parent / match.group('path')).resolve()
        if SOURCE.resolve() not in imported_file.parents:
            raise ValueError(f'Import outside project: {imported_file}')
        if not imported_file.exists():
            raise FileNotFoundError(imported_file)
        dependency_key = imported_file.relative_to(SOURCE.resolve()).as_posix()
        deps.append(imported_file)
        symbols = []
        for item in match.group('symbols').split(','):
            item = item.strip()
            if not item:
                continue
            if ' as ' in item:
                name, alias = item.split(' as ', 1)
                symbols.append(f'{name.strip()}: {alias.strip()}')
            else:
                symbols.append(item)
        imports.append(f'  const {{ {", ".join(symbols)} }} = __wbModules[{dependency_key!r}];')
        return ''

    no_imports = IMPORT_RE.sub(visit_import, raw)
    if re.search(r'^\s*import\s', no_imports, re.MULTILINE):
        raise ValueError(f'Unsupported import in {module}')
    exports = EXPORT_RE.findall(no_imports)
    no_exports = re.sub(r'^export\s+', '', no_imports, flags=re.MULTILINE)
    if re.search(r'^\s*export\s', no_exports, re.MULTILINE):
        raise ValueError(f'Unsupported export in {module}')
    results = [transform(dep) for dep in deps]
    body = (
        f'// Module: {key}\n'
        '(function () {\n'
        '  "use strict";\n'
        + ('\n'.join(imports) + '\n' if imports else '')
        + no_exports + '\n'
        + f'  __wbModules[{key!r}] = {{ {", ".join(exports)} }};\n'
        + '})();\n'
    )
    compiled.add(key)
    return '\n'.join([*results, body])


def build_entry(relative_source: str, output_filename: str) -> None:
    compiled.clear()
    body = transform(SOURCE / relative_source)
    wrapper = (
        '/* wallBoard standalone build. Edit source/modules, not this generated bundle. */\n'
        '(function () {\n'
        '  "use strict";\n'
        '  const __wbModules = Object.create(null);\n'
        + body + '\n'
        '})();\n'
    )
    (SITE / 'assets' / 'js' / output_filename).write_text(wrapper, encoding='utf-8')


def build_html(file: Path) -> None:
    prefix = ''
    text = file.read_text(encoding='utf-8')
    text = re.sub(r'^(?:<!DOCTYPE html>\s*)+', '<!DOCTYPE html>\n', text, flags=re.I)
    text = text.replace('href="/images/', f'href="{prefix}assets/images/')
    text = text.replace('src="/images/', f'src="{prefix}assets/images/')
    text = text.replace('content="/images/', f'content="{prefix}assets/images/')
    text = text.replace('href="/site.webmanifest"', f'href="{prefix}site.webmanifest"')
    text = text.replace('href="/index.html"', f'href="{prefix}index.html"')
    scripts = {
        '/src/main.js': 'store.js',
        '/src/pages/auth.js': 'auth.js',
    }
    for old, new in scripts.items():
        text = re.sub(
            rf'<script\s+src="{re.escape(old)}"\s+type="module"\s*>\s*</script>',
            f'<script src="{prefix}assets/js/{new}" defer></script>',
            text,
        )
    text = re.sub(
        r'href="/src/styles/([a-z-]+\.css)"',
        lambda match: f'href="{prefix}assets/css/{match.group(1)}"',
        text,
    )
    if re.search(r'[=\"\']/(?:src|images)/', text):
        raise ValueError(f'Unconverted absolute path in {file}')
    relative = file.relative_to(SOURCE)
    out = SITE / relative
    out.parent.mkdir(exist_ok=True, parents=True)
    out.write_text(text, encoding='utf-8')


def main():
    if SITE.exists():
        shutil.rmtree(SITE)
    (SITE / 'assets' / 'css').mkdir(parents=True)
    (SITE / 'assets' / 'js').mkdir(parents=True)
    (SITE / 'assets' / 'images').mkdir(parents=True)

    for css in (SOURCE / 'src/styles').glob('*.css'):
        shutil.copy2(css, SITE / 'assets' / 'css' / css.name)
    # Copy the public image library used by product and brand content.
    shutil.copytree(SOURCE / 'public' / 'images', SITE / 'assets/images', dirs_exist_ok=True)
    for extra in ('site.webmanifest', 'robots.txt'):
        shutil.copy2(SOURCE / 'public' / extra, SITE / extra)
    manifest_file = SITE / 'site.webmanifest'
    manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
    manifest['start_url'] = './index.html'
    manifest['scope'] = './'
    for icon in manifest.get('icons', []):
        icon['src'] = 'assets/images/logo.svg'
    manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for html in SOURCE.glob('*.html'):
        build_html(html)
    build_entry('src/main.js', 'store.js')
    build_entry('src/pages/auth.js', 'auth.js')
    # Source modules remain separately editable under developer-source/.
    print('Ready:', SITE)

if __name__ == '__main__':
    main()
