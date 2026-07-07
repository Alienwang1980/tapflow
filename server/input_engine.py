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
    'SHIFT': 0x38, 'CONTROL': 0x3B, 'OPTION': 0x3A, 'COMMAND': 0x37,
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
    'SHIFT': 0x00020000,
    'CONTROL': 0x00040000,
    'OPTION': 0x00080000,
    'COMMAND': 0x00100000,
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
    """Press and release a key (or combo)."""
    key_code, flags = _parse_key_combo(key_combo)
    
    # Press modifier keys first (for combos like COMMAND+TAB)
    parts = key_combo.upper().split('+')
    mods_pressed = []
    for mod in parts[:-1]:
        mod = mod.strip()
        if mod in MODIFIER_FLAGS:
            mod_code = KEYCODE_MAP.get(mod)
            if mod_code:
                _post_key_event(mod_code, True, 0)
                mods_pressed.append(mod_code)
    
    # Press and release main key
    _post_key_event(key_code, True, flags)
    _post_key_event(key_code, False, flags)
    
    # Release modifier keys
    for mod_code in reversed(mods_pressed):
        _post_key_event(mod_code, False, 0)
    
    logger.debug(f"Key pressed: {key_combo} (code=0x{key_code:02X}, flags=0x{flags:08X})")


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


def type_text(text: str):
    """Type a string character by character."""
    for char in text:
        press_key(char)
