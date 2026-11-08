#!/usr/bin/env python3
"""Optional image preparation for user-provided real product photos.

Usage: python scripts/optimize_images.py source_images public/images/products
Requires Pillow. Source files are never overwritten.
"""
from pathlib import Path
from sys import argv
from PIL import Image, ImageOps

if len(argv) != 3:
    raise SystemExit('Usage: python scripts/optimize_images.py SOURCE_DIR OUTPUT_DIR')

source, output = Path(argv[1]), Path(argv[2])
output.mkdir(parents=True, exist_ok=True)

for file in source.iterdir():
    if file.suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp'}:
        continue

    with Image.open(file) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        for width in (480, 960):
            resized = image.copy()
            resized.thumbnail((width, width), Image.Resampling.LANCZOS)
            path = output / f'{file.stem}-{width}.webp'
            resized.save(path, 'WEBP', quality=80, method=6)
            print(f'Wrote {path}')
