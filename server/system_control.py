"""System control — volume, mute, audio devices, current app, dock, window management."""
import subprocess, os, json, logging

logger = logging.getLogger("stp.system")
BIN_DIR = os.path.expanduser("~/Library/Application Support/Smart Touch Panel/bin")
SWITCH_AUDIO = os.path.join(BIN_DIR, "SwitchAudioSource")

# ══════════ Volume / Mute ══════════

def get_volume():
    """Return {output_volume, input_volume, output_muted}."""
    r = subprocess.run(["osascript", "-e", "get volume settings"],
                       capture_output=True, text=True)
    result = {"output_volume": 75, "input_volume": 50, "output_muted": False}
    for part in r.stdout.strip().split(","):
        part = part.strip()
        if "output volume" in part:
            try:
                val = part.split(":")[1].strip()
                if val != "missing value":
                    result["output_volume"] = int(val)
            except: pass
        elif "input volume" in part:
            try:
                val = part.split(":")[1].strip()
                if val != "missing value":
                    result["input_volume"] = int(val)
            except: pass
        elif "output muted" in part:
            try:
                val = part.split(":")[1].strip()
                result["output_muted"] = val == "true"
            except: pass
    return result

def set_volume(value):
    """Set output volume 0-100."""
    v = max(0, min(100, int(value)))
    subprocess.run(["osascript", "-e", f"set volume output volume {v}"])

def toggle_output_mute():
    """Toggle output mute, return new state."""
    current = get_volume()
    muted = not current["output_muted"]
    subprocess.run(["osascript", "-e", f"set volume output muted {str(muted).lower()}"])
    return muted

_input_volume_before_mute = None

def toggle_input_mute():
    """Toggle input mute by setting volume to 0, restore on unmute."""
    global _input_volume_before_mute
    current = get_volume()
    current_vol = current["input_volume"]
    if current_vol > 0:
        _input_volume_before_mute = current_vol
        subprocess.run(["osascript", "-e", "set volume input volume 0"])
        return True
    else:
        restore = _input_volume_before_mute or 50
        subprocess.run(["osascript", "-e", f"set volume input volume {restore}"])
        _input_volume_before_mute = None
        return False

# ══════════ Audio Devices ══════════

def list_audio_devices():
    """Return [{name, type: output|input, current}]."""
    if not os.path.exists(SWITCH_AUDIO):
        return []
    r = subprocess.run([SWITCH_AUDIO, "-a", "-t", "all"], capture_output=True, text=True)
    devices = []
    current_type = "output"
    for line in r.stdout.strip().split("\n"):
        line = line.strip()
        if not line: continue
        if line.startswith("output devices:"):
            current_type = "output"
            continue
        if line.startswith("input devices:"):
            current_type = "input"
            continue
        is_current = line.startswith("*")
        name = line.lstrip("*").strip()
        devices.append({"name": name, "type": current_type, "current": is_current})
    return devices

def set_audio_device(name, device_type="output"):
    """Switch to named audio device."""
    if not os.path.exists(SWITCH_AUDIO):
        return False
    subprocess.run([SWITCH_AUDIO, "-t", device_type, "-i", name])
    return True

# ══════════ Current App ══════════

def get_current_app():
    """Return {name, bundle_id} of frontmost application."""
    try:
        import AppKit
        ws = AppKit.NSWorkspace.sharedWorkspace()
        app = ws.frontmostApplication()
        return {
            "name": app.localizedName() or "Unknown",
            "bundle_id": app.bundleIdentifier() or "",
        }
    except Exception:
        return {"name": "Unknown", "bundle_id": ""}


def toggle_fullscreen():
    """Toggle fullscreen on the frontmost window (Cmd+Ctrl+F)."""
    from .input_engine import press_key
    press_key("CTRL+CMD+F")
