#!/usr/bin/env python3
"""Build iPad/editor HTML from modules. Usage: python tools/build.py [ipad|editor]"""
import sys, os, re, subprocess, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist/Smart Touch Panel.app/Contents/Resources/client"

IPAD_CHECKS = [
    '"use strict"', 'let profile=null', 'let ws=null', 'profileLoaded',
    'const PATTERNS=', 'function _patCSS(', 'function _patIMG(',
    'const SND=', 'let ctx=null', 'function psnd(',
    'function _drawSpectrum(', 'function _fetchBalanceCanvas(', 'function _drawBalance(',
    '_drawSpectrum(_cv', '_drawBalance(_cv', '_fetchBalanceCanvas(_cv',
    'function conn(', 'ws.onmessage', 'ws.onopen', 'ws.onclose',
    'function render(', 'function load(', 'load();',
    'touchstart', 'touchend',
]

EDITOR_CHECKS = [
    '"use strict"', 'const PATTERNS=', 'WIDGET_TYPES', 'DEVS',
    'function _patCSS(', 'function _patIMG(',
    'function hesc(', 'function _snap4(', 'function _collides(',
    'const SND=', 'function testSnd(',
    'function lp(', 'function lpl(', 'function saveProfile(', 'function apg(',
    'function rr(', 'function renderAll(', 'function rpl(', 'function rpgl(',
    'function fitAll(', 'function cws(', 'function addKeyOfType(', 'function rpr(',
    'function undo(', 'function redo(',
    'localStorage',
]

def build(target):
    mod_dir = ROOT / "client" / target
    modules = sorted(f for f in os.listdir(mod_dir) if f.endswith('.js'))
    
    js = "\n".join((mod_dir / m).read_text().strip() for m in modules)
    
    html = (ROOT / "client" / f"{target}.html").read_text()
    if '<script id="bundle"></script>' not in html:
        raise SystemExit("Template missing <script id=\"bundle\"></script>")
    html = html.replace('<script id="bundle"></script>', f"<script>\n{js}\n</script>")
    
    checks = IPAD_CHECKS if target == 'ipad' else EDITOR_CHECKS
    missing = [c for c in checks if c not in html]
    if missing:
        raise SystemExit(f"SYMBOL CHECK FAILED: {len(missing)} missing\n{missing}")
    
    m = re.search(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
    r = subprocess.run(['node', '--check'], input=m.group(1),
                       capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"JS SYNTAX ERROR:\n{r.stderr}")
    
    out_name = {"ipad": "index.html", "editor": "editor.html"}[target]
    out_path = ROOT / "client" / out_name
    out_path.write_text(html)
    
    dist_dir = ROOT / "dist/Smart Touch Panel.app/Contents/Resources"
    if dist_dir.exists():
        shutil.copy(out_path, DIST / out_name)
        for pycache in dist_dir.rglob('__pycache__'):
            shutil.rmtree(pycache, ignore_errors=True)
        for pyc in dist_dir.rglob('*.pyc'):
            pyc.unlink(missing_ok=True)
    
    print(f"  OK {out_name} ({len(html)}b) {len(checks)} symbols JS syntax")

if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else 'ipad')
