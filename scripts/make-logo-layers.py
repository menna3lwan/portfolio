#!/usr/bin/env python3
"""Splits the logo into the two layers the splash animates: the M and the Ain (ع).

The logo exists only as a 297×320 raster (src/assets/logo-dark.webp: a light M and the
orange ribbon Ain on a transparent ground), so the splash animates the logo's own pixels
rather than a redrawn approximation:

  logo-m.webp    the M — every neutral (grey/white) pixel that is not the Ain's shading,
                 with the part the Ain hides filled in from the M's own outline, so its
                 strokes can move on their own without carrying an Ain-shaped hole
  logo-ain.webp  the Ain — the orange ribbon with its folds and the shadow it casts

Laid back over each other they reproduce the original: the Ain is opaque wherever the
filled-in M lies under it. Run after changing the logo:

    python3 scripts/make-logo-layers.py

The outputs are committed, so a clone needs no image toolchain to build.
"""
from __future__ import annotations

import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover - a developer convenience, not part of the build
    sys.exit("Pillow and numpy are required: pip install Pillow numpy")

ASSETS = Path(__file__).resolve().parent.parent / "src" / "assets"
SOURCE = ASSETS / "logo-dark.webp"
OUT = ASSETS / "logo-layers"

# The M's outline, from straight-line fits to the edges the Ain leaves visible: the left
# part's top (y 92) sits a little lower than the right's (y 85) in the artwork.
M_OUTLINE = [
    (0, 92), (87, 92), (144.4, 247.2), (205.8, 85), (297, 85), (297, 320), (238, 320),
    (238, 155.2), (177.4, 320), (108.7, 320), (58, 156.2), (58, 320), (0, 320),
]


def outline_alpha(width: int, height: int, scale: int = 4) -> np.ndarray:
    """The outline rasterised with 4× supersampling, as 0–255 coverage."""
    big = Image.new("L", (width * scale, height * scale), 0)
    ImageDraw.Draw(big).polygon([(x * scale, y * scale) for x, y in M_OUTLINE], fill=255)
    return np.array(big.resize((width, height), Image.LANCZOS)).astype(int)


def main() -> None:
    rgba = np.array(Image.open(SOURCE).convert("RGBA"))
    r, g, b, a = (rgba[..., i].astype(int) for i in range(4))

    cover = outline_alpha(rgba.shape[1], rgba.shape[0])
    neutral = (abs(r - g) < 28) & (abs(g - b) < 28) & (a > 0)
    # The M is light grey. Inside its outline, a dark pixel is the ribbon's shading or the
    # shadow it casts, and a tinted one is the ribbon's anti-aliased edge — both belong to
    # the Ain. Outside the outline, a neutral pixel is the M's own soft edge.
    grey = (abs(r - g) < 12) & (abs(g - b) < 12) & (abs(r - b) < 12)
    is_m = neutral & (((r > 110) & grey) | (cover < 128))
    is_ain = (a > 0) & ~is_m

    OUT.mkdir(exist_ok=True)
    layers = {}
    for name, keep in (("logo-m.webp", is_m), ("logo-ain.webp", is_ain)):
        layer = rgba.copy()
        layer[~keep] = 0
        layers[name] = layer

    # Fill the M where the Ain hid it, in the M's own flat colour, at the outline's
    # coverage. Nothing of the fill shows in the finished logo: the Ain lies over it.
    m = layers["logo-m.webp"]
    flat = np.median(m[(m[..., 3] > 250) & is_m][:, :3], axis=0).astype(np.uint8)
    flat_f = flat.astype(float)
    # Only where the Ain actually covered the M: the artwork's own gaps beside the ribbon
    # stay open, and the M's own pixels (some slightly translucent) stay as they are.
    hole = is_ain & (cover > 0)
    m[hole, :3] = flat
    m[hole, 3] = cover[hole]
    print(f"filled {int(hole.sum())} px of the M under the Ain, in {tuple(int(c) for c in flat)}")

    # Where the ribbon's edge was blended with the light M beneath it, take the M back
    # out: alpha from how far the green channel sits between the ribbon's and the M's,
    # colour from un-mixing the two. On its own over a dark ground the Ain then has a clean
    # edge instead of a pale rim, and over the M it composites back to the original.
    ain = layers["logo-ain.webp"].astype(float)
    ribbon = (r > g + 80) & (r > b + 80)
    ribbon_g = float(np.median(g[ribbon]))
    blend = is_ain & (cover > 0) & (g > ribbon_g + 12) & (a > 250)
    alpha = np.clip((flat_f[1] - g) / (flat_f[1] - ribbon_g), 0.02, 1.0)
    for c in range(3):
        mixed = ain[..., c]
        mixed[blend] = np.clip((mixed[blend] - (1 - alpha[blend]) * flat_f[c]) / alpha[blend], 0, 255)
    ain[blend, 3] = alpha[blend] * 255
    # Stray light-grey specks left along the M's edges are the M's, not the ribbon's.
    spread = ain[..., :3].max(axis=2) - ain[..., :3].min(axis=2)
    speck = (ain[..., 3] > 0) & (spread < 30) & (ain[..., :3].mean(axis=2) > 120)
    ain[speck] = 0
    layers["logo-ain.webp"] = ain.round().astype(np.uint8)
    print(f"un-mixed {int(blend.sum())} edge px of the Ain")

    for name, layer in layers.items():
        Image.fromarray(layer.astype(np.uint8)).save(OUT / name, "WEBP", lossless=True, quality=100, method=6)
        print(f"{name}: {int((layer[..., 3] > 0).sum())} px")


if __name__ == "__main__":
    main()
