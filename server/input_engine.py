"""
macOS input simulation engine using Quartz CoreGraphics (CGEvent).
Requires Accessibility permission: System Settings → Privacy → Accessibility.
"""
import logging

logger = logging.getLogger("stp.input")

try:
    from Quartz.CoreGraphics import (
        CGEventCreateKeyboardEvent, CGEventPost, CGEventSetFlags,
        kCGHIDEventTap,
    )
    HAVE_QUARTZ = True
except ImportError:
    HAVE_QUARTZ = False
    logger.warning("Quartz import failed — running on non-macOS or missing pyobjc")
    kCGHIDEventTap = 0

# macOS virtual keycode map
KEYCODE_MAP = {
    'A': 0x00, 'B': 0x0B, 'C': 0x08, 'D': 0x02, 'E': 0x0E,
    'F': 0x03, 'G': 0x05, 'H': 0x04, 'I': 0x22, 'J': 0x26,
    'K': 0x28, 'L': 0x25, 'M': 0x2E, 'N': 0x2D, 'O': 0x1F,
    'P': 0x23, 'Q': 0x0C, 'R': 0x0F, 'S': 0x01, 'T': 0x11,
    'U': 0x20, 'V': 0x09, 'W': 0x0D, 'X': 0x07, 'Y': 0x10, 'Z': 0x06,
    '0': 0x1D, '1': 0x12, '2': 0x13, '3': 0x14, '4': 0x15,
    '5': 0x17, '6': 0x16, '7': 0x1A, '8': 0x1C, '9': 0x19,
    'RETURN': 0x24, 'TAB': 0x30, 'SPACE': 0x31, 'DELETE': 0x33,
    'ESCAPE': 0x35, 'ENTER': 0x4C,
    'LSHIFT': 0x38, 'RSHIFT': 0x3C, 'SHIFT': 0x38,
    'LCONTROL': 0x3B, 'RCONTROL': 0x3E, 'CONTROL': 0x3B,
    'LOPTION': 0x3A, 'ROPTION': 0x3D, 'OPTION': 0x3A,
    'LCOMMAND': 0x37, 'RCOMMAND': 0x36, 'COMMAND': 0x37,
    'FN': 0x3F,
    'CAPSLOCK': 0x39,
    'UP': 0x7E, 'DOWN': 0x7D, 'LEFT': 0x7B, 'RIGHT': 0x7C,
    'F1': 0x7A, 'F2': 0x78, 'F3': 0x63, 'F4': 0x76, 'F5': 0x60,
    'F6': 0x61, 'F7': 0x62, 'F8': 0x64, 'F9': 0x65, 'F10': 0x6D,
    'F11': 0x67, 'F12': 0x6F,
    '-': 0x1B, '=': 0x18, '[': 0x21, ']': 0x1E, '\\': 0x2A,
    ';': 0x29, '\'': 0x27, ',': 0x2B, '.': 0x2F, '/': 0x2C,
    '`': 0x32,
}

MODIFIER_FLAGS = {
    'LSHIFT': 0x00020000, 'RSHIFT': 0x00020000, 'SHIFT': 0x00020000,
    'LCONTROL': 0x00040000, 'RCONTROL': 0x00040000, 'CONTROL': 0x00040000,
    'LOPTION': 0x00080000, 'ROPTION': 0x00080000, 'OPTION': 0x00080000,
    'LCOMMAND': 0x00100000, 'RCOMMAND': 0x00100000, 'COMMAND': 0x00100000,
    'FN': 0x00800000,
    'CAPSLOCK': 0x00010000,
}

SHIFT_MAP = {
    '!': '1', '@': '2', '#': '3', '$': '4', '%': '5',
    '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
    '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\',
    ':': ';', '"': '\'', '<': ',', '>': '.', '?': '/',
    '~': '`',
}


def _parse_key_combo(combo: str) -> tuple[int, int]:
    """Parse key combo string → (keycode, modifier_flags)."""
    parts = combo.upper().split('+')
    flags = 0
    key_name = parts[-1].strip()

    for mod in parts[:-1]:
        mod = mod.strip()
        if mod in MODIFIER_FLAGS:
            flags |= MODIFIER_FLAGS[mod]

    key_code = KEYCODE_MAP.get(key_name)
    if key_code is None and len(combo) == 1:
        # Single char: check shift map
        if combo in SHIFT_MAP:
            key_code = KEYCODE_MAP.get(SHIFT_MAP[combo].upper())
            flags |= MODIFIER_FLAGS['SHIFT']
        elif combo.isupper():
            key_code = KEYCODE_MAP.get(combo.upper())
            flags |= MODIFIER_FLAGS['SHIFT']
        elif combo.islower():
            key_code = KEYCODE_MAP.get(combo.upper())

    if key_code is None:
        raise ValueError(f"Unknown key: {combo} (parsed as '{key_name}')")

    return key_code, flags


def press_key(key_combo: str):
    """Press and release a key (or combo). Supports multi-key simul (K+P+L)."""
    parts = [p.strip() for p in key_combo.upper().split('+')]
    
    # Separate modifiers from main keys
    mods = []
    keys = []
    for p in parts:
        if p in MODIFIER_FLAGS:
            mods.append(p)
        else:
            keys.append(p)
    
    # Press all modifiers first
    for mod in mods:
        mod_code = KEYCODE_MAP.get(mod)
        if mod_code:
            _post_key_event(mod_code, True, 0)
    
    # Build flags from all modifiers
    flags = 0
    for mod in mods:
        flags |= MODIFIER_FLAGS.get(mod, 0)
    
    # Press all main keys simultaneously, release in reverse
    for k in keys:
        kc = KEYCODE_MAP.get(k)
        if kc:
            _post_key_event(kc, True, flags)
    for k in reversed(keys):
        kc = KEYCODE_MAP.get(k)
        if kc:
            _post_key_event(kc, False, flags)
    
    # Release modifiers in reverse
    for mod in reversed(mods):
        mod_code = KEYCODE_MAP.get(mod)
        if mod_code:
            _post_key_event(mod_code, False, 0)
    
    logger.debug(f"Key pressed: {key_combo}")


def press_key_down(key_combo: str):
    """Press key down (hold)."""
    key_code, flags = _parse_key_combo(key_combo)
    _post_key_event(key_code, True, flags)


def release_key(key_combo: str):
    """Release key."""
    key_code, flags = _parse_key_combo(key_combo)
    _post_key_event(key_code, False, flags)


def _post_key_event(key_code: int, down: bool, flags: int = 0):
    if not HAVE_QUARTZ:
        action = "DOWN" if down else "UP"
        logger.info(f"[SIMULATE] Key{action}: code=0x{key_code:02X}, flags=0x{flags:08X}")
        return
    event = CGEventCreateKeyboardEvent(None, key_code, down)
    if flags:
        CGEventSetFlags(event, flags)
    CGEventPost(kCGHIDEventTap, event)


def is_accessibility_enabled() -> bool:
    """Check if Accessibility permission is granted."""
    try:
        from ApplicationServices import AXIsProcessTrusted
        return AXIsProcessTrusted()
    except ImportError:
        return False



def move_mouse(dx, dy, drag=False):
    """Move mouse cursor by relative offset. If drag=True, post drag event."""
    if not HAVE_QUARTZ:
        logger.info(f"[SIMULATE] Mouse move: dx={dx}, dy={dy}, drag={drag}")
        return
    from Quartz.CoreGraphics import CGEventCreate, CGEventGetLocation, CGWarpMouseCursorPosition
    from Quartz.CoreGraphics import CGEventCreateMouseEvent, CGEventPost, kCGHIDEventTap
    from Quartz.CoreGraphics import kCGEventLeftMouseDragged, kCGEventMouseMoved, kCGMouseButtonLeft
    # CGEventCreateMouseEvent takes absolute coords, not delta.
    # Get current position, add delta, warp to new absolute position.
    null_event = CGEventCreate(None)
    loc = CGEventGetLocation(null_event)
    new_x = loc.x + dx
    new_y = loc.y + dy
    CGWarpMouseCursorPosition((new_x, new_y))
    # Post move/drag event so apps see real-time selection updates
    evt_type = kCGEventLeftMouseDragged if drag else kCGEventMouseMoved
    event = CGEventCreateMouseEvent(None, evt_type, (new_x, new_y), kCGMouseButtonLeft)
    CGEventPost(0, event)


def mouse_down(button="left"):
    """Press and hold mouse button."""
    if not HAVE_QUARTZ:
        logger.info(f"[SIMULATE] Mouse down: {button}")
        return
    from Quartz.CoreGraphics import (
        CGEventCreate, CGEventGetLocation, CGEventCreateMouseEvent, CGEventPost,
        kCGMouseButtonLeft, kCGMouseButtonRight,
        kCGEventLeftMouseDown, kCGEventRightMouseDown, kCGHIDEventTap,
    )
    null_event = CGEventCreate(None)
    loc = CGEventGetLocation(null_event)
    pos = (loc.x, loc.y)
    btn = kCGMouseButtonRight if button == "right" else kCGMouseButtonLeft
    evt_type = kCGEventRightMouseDown if button == "right" else kCGEventLeftMouseDown
    event = CGEventCreateMouseEvent(None, evt_type, pos, btn)
    CGEventPost(0, event)

def mouse_up(button="left"):
    """Release mouse button."""
    if not HAVE_QUARTZ:
        logger.info(f"[SIMULATE] Mouse up: {button}")
        return
    from Quartz.CoreGraphics import (
        CGEventCreate, CGEventGetLocation, CGEventCreateMouseEvent, CGEventPost,
        kCGMouseButtonLeft, kCGMouseButtonRight,
        kCGEventLeftMouseUp, kCGEventRightMouseUp, kCGHIDEventTap,
    )
    null_event = CGEventCreate(None)
    loc = CGEventGetLocation(null_event)
    pos = (loc.x, loc.y)
    btn = kCGMouseButtonRight if button == "right" else kCGMouseButtonLeft
    evt_type = kCGEventRightMouseUp if button == "right" else kCGEventLeftMouseUp
    event = CGEventCreateMouseEvent(None, evt_type, pos, btn)
    CGEventPost(0, event)

def click_mouse(button="left"):
    """Click mouse button at current position (left or right)."""
    if not HAVE_QUARTZ:
        logger.info(f"[SIMULATE] Mouse click: {button}")
        return
    from Quartz.CoreGraphics import (
        CGEventCreate, CGEventGetLocation,
        CGEventCreateMouseEvent, CGEventPost,
        kCGMouseButtonLeft, kCGMouseButtonRight,
        kCGEventLeftMouseDown, kCGEventLeftMouseUp,
        kCGEventRightMouseDown, kCGEventRightMouseUp,
        kCGHIDEventTap,
    )
    null_event = CGEventCreate(None)
    loc = CGEventGetLocation(null_event)
    pos = (loc.x, loc.y)
    if button == "right":
        down_type = kCGEventRightMouseDown
        up_type = kCGEventRightMouseUp
        btn = kCGMouseButtonRight
    else:
        down_type = kCGEventLeftMouseDown
        up_type = kCGEventLeftMouseUp
        btn = kCGMouseButtonLeft
    down = CGEventCreateMouseEvent(None, down_type, pos, btn)
    up = CGEventCreateMouseEvent(None, up_type, pos, btn)
    CGEventPost(kCGHIDEventTap, down)
    CGEventPost(kCGHIDEventTap, up)

def scroll_mouse(dx, dy):
    """Scroll by delta."""
    if not HAVE_QUARTZ:
        logger.info(f"[SIMULATE] Scroll: dx={dx}, dy={dy}")
        return
    from Quartz.CoreGraphics import CGEventCreateScrollWheelEvent
    event = CGEventCreateScrollWheelEvent(None, 0, 1, int(dy))
    CGEventPost(0, event)


def type_text(text: str):
    """Type a string character by character."""
    for char in text:
        press_key(char)
