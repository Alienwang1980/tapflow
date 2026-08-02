#!/usr/bin/env python3
"""Generate STP app icon (Dot Grid) and menu bar icon.

Algorithm: 7x7 dot grid, center 3x3 warm-highlight cluster.
Source: client/icon-preview.html draw5() — this is the authoritative reference.
"""
import math, os, shutil, subprocess, sys
from pathlib import Path

from PIL import Image, ImageDraw

# ── Constants ──
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ICONS_DIR = PROJECT_ROOT / "icons"


def draw_dot_grid(draw: ImageDraw.Draw, S: int):
    """Render 7×7 dot grid onto the given ImageDraw canvas.
    Mirrors icon-preview.html draw5() exactly.
    """
    cols = rows = 7
    margin = 0.12 * S
    gw = (S - 2 * margin) / (cols - 1)
    gh = (S - 2 * margin) / (rows - 1)

    for c in range(cols):
        for r in range(rows):
            x = margin + c * gw
            y = margin + r * gh
            dist = math.sqrt((c - 3) ** 2 + (r - 3) ** 2)

            if dist < 1.5:
                color = ["#f59e0b", "#f97316", "#ffffff"][int(dist)]
                rad = 0.022 * S - dist * 0.005 * S
            elif dist < 2.5:
                color = "#d97706"
                rad = 0.016 * S
            else:
                color = "#3d3830"
                rad = 0.010 * S

            draw.ellipse([x - rad, y - rad, x + rad, y + rad], fill=color)


def make_image(S: int) -> Image.Image:
    """Create a single dot-grid icon of size S×S."""
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Dark rounded-rect background (#0d0b09, radius 0.16*S)
    r = int(0.16 * S)
    d.rounded_rectangle([0, 0, S - 1, S - 1], r, fill="#0d0b09")

    draw_dot_grid(d, S)
    return img


def build_iconset(base_img: Image.Image):
    """Create AppIcon.iconset/ and populate the 10 required PNG files."""
    iconset = ICONS_DIR / "AppIcon.iconset"
    iconset.mkdir(parents=True, exist_ok=True)

    spec = {
        "icon_16x16.png": 16,
        "icon_16x16@2x.png": 32,
        "icon_32x32.png": 32,
        "icon_32x32@2x.png": 64,
        "icon_128x128.png": 128,
        "icon_128x128@2x.png": 256,
        "icon_256x256.png": 256,
        "icon_256x256@2x.png": 512,
        "icon_512x512.png": 512,
        "icon_512x512@2x.png": 1024,
    }

    for fname, sz in spec.items():
        if sz == base_img.width:
            base_img.save(str(iconset / fname), "PNG")
        else:
            resized = base_img.resize((sz, sz), Image.LANCZOS)
            resized.save(str(iconset / fname), "PNG")

    return iconset


def make_icns(iconset: Path) -> Path:
    """Run iconutil to produce AppIcon.icns."""
    icns_path = ICONS_DIR / "AppIcon.icns"
    subprocess.run(
        ["iconutil", "-c", "icns", "-o", str(icns_path), str(iconset)],
        check=True,
    )
    return icns_path


def make_menubar_icon(base_img: Image.Image) -> Path:
    """Generate 44×44 coloured menu bar PNG (pystray doesn't support template images)."""
    mb = base_img.resize((44, 44), Image.LANCZOS)
    out = ICONS_DIR / "stp_menubar_icon.png"
    mb.save(str(out), "PNG")
    return out


def main():
    ICONS_DIR.mkdir(parents=True, exist_ok=True)

    print("Generating 1024×1024 base icon …")
    base = make_image(1024)
    base_path = ICONS_DIR / "stp_icon_1024.png"
    base.save(str(base_path), "PNG")
    print(f"  → {base_path}  ({base.size[0]}×{base.size[1]})")

    print("Building .iconset …")
    iconset = build_iconset(base)

    print("Converting to .icns …")
    icns = make_icns(iconset)
    print(f"  → {icns}  ({icns.stat().st_size} bytes)")

    print("Generating menu bar icon (44×44) …")
    mb = make_menubar_icon(base)
    print(f"  → {mb}  ({mb.stat().st_size} bytes)")

    # Cleanup: remove iconset (intermediate files)
    shutil.rmtree(iconset)
    print("Done. Icons ready in icons/")


if __name__ == "__main__":
    main()
