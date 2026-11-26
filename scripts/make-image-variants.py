#!/usr/bin/env python3
"""Generates the responsive variants the previews and the portrait are served from.

The concepts are authored at ~950px wide and the portrait at 880px, but the largest box
either one is ever drawn into is 430px and 232px respectively — so at 1x a desktop was
downloading roughly twice the pixels it could show, and a phone far more than that.

Run after changing any source image:

    python3 scripts/make-image-variants.py

The outputs are committed, so a clone needs no image toolchain to build.
"""
from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover - a developer convenience, not part of the build
    sys.exit("Pillow is required: pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent / "public" / "img"

# The widths that matter, given the boxes these images are drawn into:
#   previews  430px max box; a phone at 78vw on a 2.6x screen asks for ~790px, a desktop
#             at 1x for ~410px, so 480 and 720 bracket the real cases either side of the
#             947px source
#   portrait  232px max box at 1x, ~720px on a 2.6x phone at 70vw; 464 and 640 bracket it
PREVIEW_WIDTHS = (480, 720)
PORTRAIT_WIDTHS = (464, 640)


def variants(source: Path, widths: tuple[int, ...], quality: int) -> list[str]:
    written = []
    with Image.open(source) as im:
        im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
        for width in widths:
            if width >= im.width:
                continue
            height = round(im.height * width / im.width)
            out = source.with_name(f"{source.stem}-{width}w.webp")
            im.resize((width, height), Image.LANCZOS).save(
                out, "WEBP", quality=quality, method=6
            )
            written.append(f"{out.name} ({width}x{height}, {out.stat().st_size // 1024} kB)")
    return written


def main() -> None:
    total = []
    for source in sorted((ROOT / "cut").glob("*-ui-concept.webp")):
        if "-w.webp" in source.name or source.stem.endswith("w"):
            continue
        total += variants(source, PREVIEW_WIDTHS, quality=86)

    portrait = ROOT / "portrait-grad.jpg"
    if portrait.exists():
        # the full-size WebP replaces the JPEG as the served original
        with Image.open(portrait) as im:
            im.convert("RGB").save(
                portrait.with_suffix(".webp"), "WEBP", quality=88, method=6
            )
        total.append(f"portrait-grad.webp ({im.width}x{im.height})")
        total += variants(portrait.with_suffix(".webp"), PORTRAIT_WIDTHS, quality=88)

    print(f"wrote {len(total)} files")
    for line in total:
        print("  " + line)


if __name__ == "__main__":
    main()
