"""Microphone routes — mute, volume, permission, level monitor with AVAudioRecorder sampler."""

import logging
import os
import subprocess
import tempfile
import threading
import time

from fastapi import APIRouter

_logger = logging.getLogger("stp.mic")


def _start_mic_sampler(state):
    """Start AVAudioRecorder-based mic level sampler in a background thread."""
    if state.mic_sampling:
        return
    state.mic_sampling = True

    # Create AVAudioRecorder with a dummy file — we never read it,
    # we only use the built-in averagePowerForChannel: metering.
    from AVFoundation import AVAudioRecorder, NSURL

    tmp = tempfile.NamedTemporaryFile(suffix=".m4a", delete=False)
    tmp.close()
    dummy_path = tmp.name
    url = NSURL.fileURLWithPath_(dummy_path)

    settings = {
        "AVFormatIDKey": 1633772320,  # kAudioFormatMPEG4AAC
        "AVSampleRateKey": 22050.0,
        "AVNumberOfChannelsKey": 1,
    }
    recorder, err = AVAudioRecorder.alloc().initWithURL_settings_error_(
        url, settings, None)

    if recorder is None:
        _logger.error(f"AVAudioRecorder init failed: {err}")
        os.unlink(dummy_path)
        state.mic_sampling = False
        return

    state.mic_recorder = recorder
    recorder.setMeteringEnabled_(True)
    recorder.record()

    def _sample():
        while state.mic_sampling:
            try:
                recorder.updateMeters()
                db = recorder.averagePowerForChannel_(0)
                state.mic_level = max(0.0, min(1.0, (db + 50.0) / 50.0))
                time.sleep(0.2)
            except Exception as e:
                _logger.error(f"Mic sampler error: {e}")
                time.sleep(0.5)

    threading.Thread(target=_sample, daemon=True).start()
    _logger.info("Mic sampler started (AVAudioRecorder)")


def _stop_mic_sampler(state):
    """Stop mic level sampler and clean up recorder."""
    state.mic_sampling = False
    if state.mic_recorder:
        try:
            state.mic_recorder.stop()
        except Exception:
            pass
        state.mic_recorder = None
    _logger.info("Mic sampler stopped")


def create_router(state, request_mic_permission):
    """Create APIRouter with microphone routes. request_mic_permission injected."""

    router = APIRouter()

    @router.post("/api/system/mic-mute")
    async def sys_mic_mute():
        r = subprocess.run(["osascript", "-e", "get volume settings"],
                           capture_output=True, encoding='utf-8')
        cur_vol = 50
        for part in r.stdout.strip().split(","):
            if "input volume" in part:
                cur_vol = int(part.split(":")[1].strip())
                break
        if cur_vol > 0:
            state.mic_pre = cur_vol
            subprocess.run(["osascript", "-e", "set volume input volume 0"])
            state.mic_muted = True
        else:
            restore = state.mic_pre if state.mic_pre is not None else 50
            subprocess.run(["osascript", "-e", f"set volume input volume {restore}"])
            state.mic_muted = False
        return {"muted": state.mic_muted}

    @router.post("/api/system/mic-volume")
    async def sys_mic_vol_set(body: dict):
        v = max(0, min(100, int(body.get("value", 50))))
        subprocess.run(["osascript", "-e", f"set volume input volume {v}"])
        state.mic_muted = (v == 0)
        if v > 0:
            state.mic_pre = v
        return {"status": "ok", "input_volume": v, "muted": v == 0}

    @router.get("/api/system/mic-permission")
    async def sys_mic_status():
        try:
            from AVFoundation import AVCaptureDevice, AVMediaTypeAudio
            s = AVCaptureDevice.authorizationStatusForMediaType_(AVMediaTypeAudio)
            return {"status": s,
                    "label": {0: "NotDetermined", 1: "Denied", 2: "Restricted",
                              3: "Authorized"}.get(s)}
        except Exception:
            return {"status": -1, "label": "error"}

    @router.post("/api/system/mic-permission")
    async def sys_mic_request():
        """Open System Settings → Privacy → Microphone."""
        request_mic_permission()
        try:
            from AVFoundation import AVCaptureDevice, AVMediaTypeAudio
            s = AVCaptureDevice.authorizationStatusForMediaType_(AVMediaTypeAudio)
            return {"status": s}
        except Exception:
            return {"status": -1}

    @router.get("/api/system/mic-monitor")
    async def sys_mic_monitor_get():
        return {"enabled": state.mic_monitor_enabled}

    @router.post("/api/system/mic-monitor")
    async def sys_mic_monitor_set(body: dict):
        enabled = body.get("enabled", False)
        state.mic_monitor_enabled = enabled
        if enabled:
            _start_mic_sampler(state)
        else:
            _stop_mic_sampler(state)
        return {"enabled": state.mic_monitor_enabled}

    @router.get("/api/system/mic-level")
    async def sys_mic_level():
        if not state.mic_monitor_enabled:
            return {"level": 0.0}
        if not state.mic_sampling:
            _start_mic_sampler(state)
        return {"level": round(state.mic_level, 4)}

    return router
