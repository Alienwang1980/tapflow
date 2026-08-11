"""System permission routes: accessibility, screen capture, current app info.
Receives all tray_app-level functions via dependency injection — no `from tray_app import ...`."""

from fastapi import APIRouter


def create_router(state, check_accessibility, check_screen_capture,
                  request_accessibility_permission, request_screen_capture_permission):
    """Create APIRouter with system permission + current-app routes.
    All external functions are injected to avoid circular imports and __main__ vs tray_app module-name issues."""

    router = APIRouter()

    @router.get("/api/system/accessibility")
    async def sys_acc_status():
        return {"granted": check_accessibility()}

    @router.post("/api/system/accessibility")
    async def sys_acc_request():
        """Open System Settings → Privacy → Accessibility."""
        request_accessibility_permission()
        return {"granted": check_accessibility()}

    @router.get("/api/system/screen-capture")
    def sys_sc_status():
        import os as _os8
        granted = check_screen_capture()
        diag = {}
        try:
            from Quartz import CGWindowListCopyWindowInfo, kCGWindowListOptionAll, kCGNullWindowID
            my_pid = _os8.getpid()
            wl = CGWindowListCopyWindowInfo(kCGWindowListOptionAll, kCGNullWindowID)
            total, layer0, with_name = len(wl) if wl else 0, 0, 0
            samples = []
            if wl:
                for w in wl:
                    if w.get('kCGWindowLayer', -1) == 0:
                        layer0 += 1
                        n = w.get('kCGWindowName', None)
                        if n is not None and len(str(n).strip()) > 0:
                            with_name += 1
                        pid_w = w.get('kCGWindowOwnerPID', -1)
                        if pid_w != my_pid and len(samples) < 3:
                            samples.append({"owner": w.get('kCGWindowOwnerName',''), "has_name": n is not None and len(str(n).strip())>0, "keys": list(w.keys())[:12]})
            diag = {"total_windows": total, "layer0_windows": layer0, "with_name": with_name, "my_pid": my_pid, "samples": samples}
        except Exception as e:
            diag = {"error": str(e)}
        return {"granted": granted, "diag": diag}

    @router.post("/api/system/screen-capture")
    async def sys_sc_request():
        """Open System Settings → Privacy → Screen Recording."""
        request_screen_capture_permission()
        return {"granted": check_screen_capture()}

    @router.get("/api/system/current-app")
    def sys_cur_app():
        try:
            import AppKit
            a = AppKit.NSWorkspace.sharedWorkspace().frontmostApplication()
            return {"name": a.localizedName() or "?", "bundle_id": a.bundleIdentifier() or ""}
        except: return {"name": "?", "bundle_id": ""}

    return router
