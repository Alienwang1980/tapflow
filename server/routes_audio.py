"""Audio device routes — list, switch, cycle output/input devices via SwitchAudioSource."""

import logging
import os
import shutil
import subprocess
import sys

from fastapi import APIRouter

logger = logging.getLogger("stp.tray")


def _ensure_switch_audio_source(is_frozen) -> str | None:
    """Ensure SwitchAudioSource binary is installed in App Support.
    On first run (or when missing), copies from bundle Resources/bin.
    Returns the binary path or None if unavailable."""
    dst = os.path.expanduser("~/Library/Application Support/Tapflow/bin/SwitchAudioSource")
    if os.path.isfile(dst) and os.access(dst, os.X_OK):
        return dst
    src = None
    if is_frozen():
        bundle = os.path.dirname(os.path.dirname(sys.executable))  # Contents
        candidate = os.path.join(bundle, "Resources", "bin", "SwitchAudioSource")
        if os.path.isfile(candidate):
            src = candidate
    else:
        for cand in [os.path.join(os.path.dirname(__file__), "..", "bin", "SwitchAudioSource"),
                     "/opt/homebrew/bin/SwitchAudioSource",
                     "/usr/local/bin/SwitchAudioSource"]:
            if os.path.isfile(cand):
                src = cand
                break
    if not src:
        return None
    try:
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        os.chmod(dst, 0o755)
        logger.info("SwitchAudioSource installed: %s -> %s", src, dst)
        return dst
    except Exception as e:
        logger.warning("SwitchAudioSource install failed: %s", e)
        return src  # fallback: use from bundle/project tree


def create_router(state, is_frozen):
    """Create APIRouter with audio device routes. is_frozen injected to avoid tray_app import."""

    router = APIRouter()

    @router.get("/api/system/audio-devices")
    def sys_adev():
        sw = _ensure_switch_audio_source(is_frozen)
        if not sw:
            return []
        env = {"LANG": "C", "PATH": os.environ.get("PATH", "")}
        devs = []
        for dtype, dlabel in [("output", "output"), ("input", "input")]:
            cur_r = subprocess.run([sw, "-c", "-t", dtype],
                                   capture_output=True, encoding="utf-8", env=env)
            cur_name = cur_r.stdout.strip()
            r2 = subprocess.run([sw, "-a", "-t", dtype],
                                capture_output=True, encoding="utf-8", env=env)
            for line in r2.stdout.strip().splitlines():
                ls = line.strip()
                if not ls:
                    continue
                devs.append({"name": ls, "type": dlabel, "current": ls == cur_name})
        return devs

    @router.post("/api/system/audio-output")
    async def sys_aout(body: dict):
        sw = os.path.expanduser(
            "~/Library/Application Support/Tapflow/bin/SwitchAudioSource")
        if os.path.exists(sw):
            subprocess.run([sw, "-t", "output", "-s", body.get("name", "")])
        return {"status": "ok"}

    @router.post("/api/system/audio-input")
    async def sys_ain(body: dict):
        sw = os.path.expanduser(
            "~/Library/Application Support/Tapflow/bin/SwitchAudioSource")
        if os.path.exists(sw):
            subprocess.run([sw, "-t", "input", "-s", body.get("name", "")])
        return {"status": "ok"}

    def _cycle_audio_device(dtype: str):
        """Cycle to the next audio device of the given type. Returns status + new name."""
        sw = _ensure_switch_audio_source(is_frozen)
        if not sw:
            return {"status": "error", "reason": "SwitchAudioSource not found"}
        env = {"LANG": "C", "PATH": os.environ.get("PATH", "")}
        cur_r = subprocess.run([sw, "-c", "-t", dtype],
                               capture_output=True, encoding="utf-8", env=env)
        cur_name = cur_r.stdout.strip()
        r = subprocess.run([sw, "-a", "-t", dtype],
                           capture_output=True, encoding="utf-8", env=env)
        names = []
        for line in r.stdout.strip().splitlines():
            ls = line.strip()
            if not ls:
                continue
            names.append(ls)
        if not names:
            return {"status": "error", "reason": "no devices"}
        try:
            cur_idx = names.index(cur_name)
        except ValueError:
            cur_idx = 0
        next_name = names[(cur_idx + 1) % len(names)]
        subprocess.run([sw, "-t", dtype, "-s", next_name])
        return {"status": "ok", "current": next_name}

    @router.post("/api/system/audio-input/cycle")
    async def sys_ain_cycle():
        return _cycle_audio_device("input")

    @router.post("/api/system/audio-output/cycle")
    async def sys_aout_cycle():
        return _cycle_audio_device("output")

    return router
