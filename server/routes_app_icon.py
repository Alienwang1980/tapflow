"""App icon route — looks up .icns, converts to PNG via sips, caches in App Support."""

import os
import subprocess

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse


def create_router(state):
    """Create APIRouter with app-icon route. No external function dependencies."""

    router = APIRouter()

    @router.get("/api/system/app-icon")
    def sys_icon(name: str = ""):
        if not name:
            return {"error": "missing name"}
        cache_dir = os.path.expanduser("~/Library/Application Support/Smart Touch Panel/icon_cache")
        os.makedirs(cache_dir, exist_ok=True)
        cp = os.path.join(cache_dir, name.replace("/", "_") + ".png")
        if os.path.exists(cp):
            return FileResponse(cp, media_type="image/png")
        # Find app bundle
        ap = None
        for b in ["/Applications", "/System/Applications", "/System/Applications/Utilities",
                   "/System/Library/CoreServices",
                   "/System/Volumes/Preboot/Cryptexes/App/System/Applications"]:
            t = os.path.join(b, name + ".app")
            if os.path.exists(t):
                ap = t
                break
        if not ap:
            # Ask LaunchServices for non-standard locations
            try:
                from Cocoa import NSWorkspace
                p = NSWorkspace.sharedWorkspace().fullPathForApplication_(name)
                if p and os.path.exists(p):
                    ap = str(p)
            except Exception:
                pass
        if ap:
            ic = None
            for fn in ["AppIcon.icns", "ApplicationIcon.icns", "app.icns", "icon.icns", name + ".icns"]:
                t = os.path.join(ap, "Contents/Resources", fn)
                if os.path.exists(t):
                    ic = t
                    break
            if ic:
                subprocess.run(["sips", "-s", "format", "png", ic, "--out", cp, "-Z", "64"],
                               capture_output=True)
                if os.path.exists(cp):
                    return FileResponse(cp, media_type="image/png")
            # Fallback: NSWorkspace icon for apps with Assets.car (no .icns)
            try:
                from Cocoa import NSWorkspace, NSImage, NSBitmapImageRep

                _icon = NSWorkspace.sharedWorkspace().iconForFile_(ap)
                if _icon:
                    _sz = (64.0, 64.0)
                    _new = NSImage.alloc().initWithSize_(_sz)
                    _new.lockFocus()
                    _src = _icon.size()
                    _icon.drawInRect_fromRect_operation_fraction_(
                        ((0.0, 0.0), _sz), ((0.0, 0.0), _src), 2, 1.0)
                    _new.unlockFocus()
                    _tiff = _new.TIFFRepresentation()
                    if _tiff:
                        _bm = NSBitmapImageRep.imageRepWithData_(_tiff)
                        if _bm:
                            _png_data = _bm.representationUsingType_properties_(4, None)
                            _png_data.writeToFile_atomically_(cp, True)
                            if os.path.exists(cp):
                                return FileResponse(cp, media_type="image/png")
            except Exception:
                pass
        raise HTTPException(404, f"icon not found: {name}")

    return router
