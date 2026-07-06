"""macOS foreground app monitor using NSWorkspace notifications."""
import logging
import threading

logger = logging.getLogger("stp.window")

HAVE_PYOBJC = False
try:
    from Foundation import NSObject, NSRunLoop, NSDate
    from AppKit import NSWorkspace, NSApplication
    import objc
    HAVE_PYOBJC = True
except ImportError:
    logger.warning("PyObjC not available — window watcher disabled")

if HAVE_PYOBJC:
    # Protocol for workspace notifications
    NSWorkspaceDidActivateApplicationNotification = "NSWorkspaceDidActivateApplicationNotification"

    class AppObserver(NSObject):
        """Observes NSWorkspace foreground app changes."""

        def init(self):
            self = objc.super(AppObserver, self).init()
            if self is None:
                return None
            self._callback = None
            self._running = False
            return self

        def setCallback_(self, cb):
            self._callback = cb

        def startObserving(self):
            if self._running:
                return
            center = NSWorkspace.sharedWorkspace().notificationCenter()
            center.addObserver_selector_name_object_(
                self,
                "onAppActivated:",
                NSWorkspaceDidActivateApplicationNotification,
                None,
            )
            self._running = True

        def stopObserving(self):
            if not self._running:
                return
            center = NSWorkspace.sharedWorkspace().notificationCenter()
            center.removeObserver_name_object_(
                self, NSWorkspaceDidActivateApplicationNotification, None
            )
            self._running = False

        def onAppActivated_(self, notification):
            if not self._callback:
                return
            try:
                app = notification.userInfo().get("NSWorkspaceApplicationKey")
                if app is None:
                    return
                bundle_id = app.get("NSApplicationBundleIdentifier", "") or ""
                app_name = app.get("NSApplicationName", "") or ""
                self._callback(bundle_id, app_name)
            except Exception as e:
                logger.error(f"onAppActivated error: {e}")


class WindowWatcher:
    """Watches foreground app changes and invokes a callback."""

    def __init__(self, callback=None):
        if not HAVE_PYOBJC:
            raise RuntimeError("PyObjC not available")
        self.callback = callback
        self._observer = None
        self._thread = None
        self._stop_event = threading.Event()

    def start(self):
        """Start observing on a background thread with its own run loop."""
        if self._thread is not None:
            return
        self._stop_event.clear()

        def _run():
            try:
                # Create observer on this thread
                observer = AppObserver.alloc().init()
                observer.setCallback_(self.callback or (lambda bid, name: None))
                observer.startObserving()
                self._observer = observer

                # Run the run loop until stopped
                loop = NSRunLoop.currentRunLoop()
                while not self._stop_event.is_set():
                    loop.runUntilDate_(NSDate.dateWithTimeIntervalSinceNow_(0.5))
            except Exception as e:
                logger.error(f"WindowWatcher thread error: {e}")

        self._thread = threading.Thread(target=_run, daemon=True, name="window-watcher")
        self._thread.start()

    def stop(self):
        """Stop observing and join the thread."""
        self._stop_event.set()
        if self._observer:
            try:
                self._observer.stopObserving()
            except Exception:
                pass
        if self._thread:
            self._thread.join(timeout=2.0)
            self._thread = None
