"""Profile CRUD with JSON file persistence + auto-switch matching."""
import json
import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger("stp.profile")

PROFILES_DIR = Path(__file__).parent / "profiles"
PROFILES_DIR.mkdir(exist_ok=True)

# Default profile that ships with the app
DEFAULT_PROFILE = {
    "profileName": "Default",
    "version": "1.0",
    "windowRules": [
        {"bundle_id": "com.apple.Safari", "page": "browsing"},
        {"bundle_id": "com.google.Chrome", "page": "browsing"},
        {"bundle_id": "com.apple.Finder", "page": "finder"},
        {"bundle_id": "com.apple.Terminal", "page": "terminal"},
        {"bundle_id": "com.microsoft.VSCode", "page": "coding"},
    ],
    "pages": [
        # ── Apple Magic Keyboard (ANSI, 77 keys) ──
        {
            "id": "keyboard", "label": "Keyboard", "columns": 15,
            "keys": [
                # Row 1: Function keys
                {"id":"esc","label":"esc","action":"key","value":"ESCAPE","color":"#555","w":1},
                {"id":"f1","label":"F1","action":"key","value":"F1","color":"#444","w":1},
                {"id":"f2","label":"F2","action":"key","value":"F2","color":"#444","w":1},
                {"id":"f3","label":"F3","action":"key","value":"F3","color":"#444","w":1},
                {"id":"f4","label":"F4","action":"key","value":"F4","color":"#444","w":1},
                {"id":"f5","label":"F5","action":"key","value":"F5","color":"#444","w":1},
                {"id":"f6","label":"F6","action":"key","value":"F6","color":"#444","w":1},
                {"id":"f7","label":"F7","action":"key","value":"F7","color":"#444","w":1},
                {"id":"f8","label":"F8","action":"key","value":"F8","color":"#444","w":1},
                {"id":"f9","label":"F9","action":"key","value":"F9","color":"#444","w":1},
                {"id":"f10","label":"F10","action":"key","value":"F10","color":"#444","w":1},
                {"id":"f11","label":"F11","action":"key","value":"F11","color":"#444","w":1},
                {"id":"f12","label":"F12","action":"key","value":"F12","color":"#444","w":1},
                # Row 2: Numbers
                {"id":"grave","label":"`","action":"key","value":"`","color":"#3a3a4a","w":1},
                {"id":"n1","label":"1","action":"key","value":"1","color":"#3a3a4a","w":1},
                {"id":"n2","label":"2","action":"key","value":"2","color":"#3a3a4a","w":1},
                {"id":"n3","label":"3","action":"key","value":"3","color":"#3a3a4a","w":1},
                {"id":"n4","label":"4","action":"key","value":"4","color":"#3a3a4a","w":1},
                {"id":"n5","label":"5","action":"key","value":"5","color":"#3a3a4a","w":1},
                {"id":"n6","label":"6","action":"key","value":"6","color":"#3a3a4a","w":1},
                {"id":"n7","label":"7","action":"key","value":"7","color":"#3a3a4a","w":1},
                {"id":"n8","label":"8","action":"key","value":"8","color":"#3a3a4a","w":1},
                {"id":"n9","label":"9","action":"key","value":"9","color":"#3a3a4a","w":1},
                {"id":"n0","label":"0","action":"key","value":"0","color":"#3a3a4a","w":1},
                {"id":"minus","label":"-","action":"key","value":"-","color":"#3a3a4a","w":1},
                {"id":"equal","label":"=","action":"key","value":"=","color":"#3a3a4a","w":1},
                {"id":"delete","label":"delete","action":"key","value":"DELETE","color":"#555","w":2},
                # Row 3: QWERTY
                {"id":"tab","label":"tab","action":"key","value":"TAB","color":"#555","w":1},
                {"id":"q","label":"Q","action":"key","value":"Q","color":"#3a3a4a","w":1},
                {"id":"w","label":"W","action":"key","value":"W","color":"#3a3a4a","w":1},
                {"id":"e","label":"E","action":"key","value":"E","color":"#3a3a4a","w":1},
                {"id":"r","label":"R","action":"key","value":"R","color":"#3a3a4a","w":1},
                {"id":"t","label":"T","action":"key","value":"T","color":"#3a3a4a","w":1},
                {"id":"y","label":"Y","action":"key","value":"Y","color":"#3a3a4a","w":1},
                {"id":"u","label":"U","action":"key","value":"U","color":"#3a3a4a","w":1},
                {"id":"i","label":"I","action":"key","value":"I","color":"#3a3a4a","w":1},
                {"id":"o","label":"O","action":"key","value":"O","color":"#3a3a4a","w":1},
                {"id":"p","label":"P","action":"key","value":"P","color":"#3a3a4a","w":1},
                {"id":"lbracket","label":"[","action":"key","value":"[","color":"#3a3a4a","w":1},
                {"id":"rbracket","label":"]","action":"key","value":"]","color":"#3a3a4a","w":1},
                {"id":"bslash","label":"\\","action":"key","value":"\\","color":"#3a3a4a","w":1},
                # Row 4: Home
                {"id":"caps","label":"caps lock","action":"key","value":"CAPSLOCK","color":"#555","w":1},
                {"id":"a","label":"A","action":"key","value":"A","color":"#3a3a4a","w":1},
                {"id":"s","label":"S","action":"key","value":"S","color":"#3a3a4a","w":1},
                {"id":"d","label":"D","action":"key","value":"D","color":"#3a3a4a","w":1},
                {"id":"f","label":"F","action":"key","value":"F","color":"#3a3a4a","w":1},
                {"id":"g","label":"G","action":"key","value":"G","color":"#3a3a4a","w":1},
                {"id":"h","label":"H","action":"key","value":"H","color":"#3a3a4a","w":1},
                {"id":"j","label":"J","action":"key","value":"J","color":"#3a3a4a","w":1},
                {"id":"k","label":"K","action":"key","value":"K","color":"#3a3a4a","w":1},
                {"id":"l","label":"L","action":"key","value":"L","color":"#3a3a4a","w":1},
                {"id":"semicolon","label":";","action":"key","value":";","color":"#3a3a4a","w":1},
                {"id":"quote","label":"'","action":"key","value":"'","color":"#3a3a4a","w":1},
                {"id":"return","label":"return","action":"key","value":"RETURN","color":"#3a7ca5","w":2},
                # Row 5: Shift
                {"id":"lshift","label":"shift","action":"key","value":"SHIFT","color":"#555","w":2},
                {"id":"z","label":"Z","action":"key","value":"Z","color":"#3a3a4a","w":1},
                {"id":"x","label":"X","action":"key","value":"X","color":"#3a3a4a","w":1},
                {"id":"c","label":"C","action":"key","value":"C","color":"#3a3a4a","w":1},
                {"id":"v","label":"V","action":"key","value":"V","color":"#3a3a4a","w":1},
                {"id":"b","label":"B","action":"key","value":"B","color":"#3a3a4a","w":1},
                {"id":"n","label":"N","action":"key","value":"N","color":"#3a3a4a","w":1},
                {"id":"m","label":"M","action":"key","value":"M","color":"#3a3a4a","w":1},
                {"id":"comma","label":",","action":"key","value":",","color":"#3a3a4a","w":1},
                {"id":"period","label":".","action":"key","value":".","color":"#3a3a4a","w":1},
                {"id":"slash","label":"/","action":"key","value":"/","color":"#3a3a4a","w":1},
                {"id":"rshift","label":"shift","action":"key","value":"SHIFT","color":"#555","w":2},
                # Row 6: Modifiers + arrows
                {"id":"fn","label":"fn","action":"key","value":"F13","color":"#555","w":1},
                {"id":"lctrl","label":"⌃","action":"key","value":"CONTROL","color":"#555","w":1},
                {"id":"lopt","label":"⌥","action":"key","value":"OPTION","color":"#555","w":1},
                {"id":"lcmd","label":"⌘","action":"key","value":"COMMAND","color":"#555","w":1},
                {"id":"space","label":"","action":"key","value":"SPACE","color":"#4a4a5a","w":5},
                {"id":"rcmd","label":"⌘","action":"key","value":"COMMAND","color":"#555","w":1},
                {"id":"ropt","label":"⌥","action":"key","value":"OPTION","color":"#555","w":1},
                {"id":"left","label":"←","action":"key","value":"LEFT","color":"#555","w":1},
                {"id":"up","label":"↑","action":"key","value":"UP","color":"#555","w":1},
                {"id":"down","label":"↓","action":"key","value":"DOWN","color":"#555","w":1},
                {"id":"right","label":"→","action":"key","value":"RIGHT","color":"#555","w":1},
            ],
        },
        # ── Context shortcuts ──
        {
            "id": "browsing", "label": "Browser", "columns": 4,
            "keys": [
                {"id":"b1","label":"⌘T","action":"key","value":"COMMAND+T","color":"#555","w":1},
                {"id":"b2","label":"⌘W","action":"key","value":"COMMAND+W","color":"#8b3a3a","w":1},
                {"id":"b3","label":"⌘R","action":"key","value":"COMMAND+R","color":"#3a7ca5","w":1},
                {"id":"b4","label":"⌘L","action":"key","value":"COMMAND+L","color":"#555","w":1},
                {"id":"b5","label":"⌘⇧T","action":"key","value":"COMMAND+SHIFT+T","color":"#555","w":1},
                {"id":"b6","label":"⌘+","action":"key","value":"COMMAND+=","color":"#555","w":1},
                {"id":"b7","label":"⌘-","action":"key","value":"COMMAND+-","color":"#555","w":1},
                {"id":"b8","label":"⌘0","action":"key","value":"COMMAND+0","color":"#555","w":1},
            ],
        },
        {
            "id": "terminal", "label": "Terminal", "columns": 4,
            "keys": [
                {"id":"t1","label":"⌘C","action":"key","value":"COMMAND+C","color":"#8b3a3a","w":1},
                {"id":"t2","label":"⌘K","action":"key","value":"COMMAND+K","color":"#555","w":1},
                {"id":"t3","label":"⌃C","action":"key","value":"CONTROL+C","color":"#8b3a3a","w":1},
                {"id":"t4","label":"⌃D","action":"key","value":"CONTROL+D","color":"#555","w":1},
                {"id":"t5","label":"↑","action":"key","value":"UP","color":"#444","w":1},
                {"id":"t6","label":"↓","action":"key","value":"DOWN","color":"#444","w":1},
                {"id":"t7","label":"Tab","action":"key","value":"TAB","color":"#555","w":1},
                {"id":"t8","label":"clear","action":"key","value":"COMMAND+K","color":"#555","w":1},
            ],
        },
        {
            "id": "coding", "label": "Coding", "columns": 4,
            "keys": [
                {"id":"c1","label":"⌘S","action":"key","value":"COMMAND+S","color":"#3a7ca5","w":1},
                {"id":"c2","label":"⌘Z","action":"key","value":"COMMAND+Z","color":"#555","w":1},
                {"id":"c3","label":"⌘⇧Z","action":"key","value":"COMMAND+SHIFT+Z","color":"#555","w":1},
                {"id":"c4","label":"⌘F","action":"key","value":"COMMAND+F","color":"#555","w":1},
                {"id":"c5","label":"⌘P","action":"key","value":"COMMAND+P","color":"#555","w":1},
                {"id":"c6","label":"⌘/","action":"key","value":"COMMAND+/","color":"#555","w":1},
                {"id":"c7","label":"⌘D","action":"key","value":"COMMAND+D","color":"#555","w":1},
                {"id":"c8","label":"⌘⇧F","action":"key","value":"COMMAND+SHIFT+F","color":"#555","w":1},
            ],
        },
    ],
}


def migrate_key_positions(profile: dict) -> dict:
    """Ensure all keys have col/row/h. Auto-calculate for keys without them."""
    for page in profile.get("pages", []):
        cols = page.get("columns", 15)
        page.setdefault("rows", 8)
        cur_col, cur_row = 1, 1
        for key in page.get("keys", []):
            w = key.get("w", 1)
            h = key.get("h", 1)
            if "col" not in key or "row" not in key:
                if cur_col + w - 1 > cols:
                    cur_col = 1
                    cur_row += 1
                key["col"] = cur_col
                key["row"] = cur_row
                key.setdefault("h", h)
                cur_col += w
            else:
                # Key has explicit position — advance cursor past it
                cur_col = key["col"] + key.get("w", 1)
                cur_row = key["row"]
        # Ensure rows is at least the max key row
        max_row = max((k.get("row", 1) + k.get("h", 1) - 1 for k in page.get("keys", [])), default=1)
        page["rows"] = max(page.get("rows", 8), max_row)
    return profile


class ProfileManager:
    """Profile JSON file storage with auto-switch matching."""

    def __init__(self, profiles_dir: Path = PROFILES_DIR):
        self.dir = profiles_dir
        self._ensure_default()

    def _ensure_default(self):
        default_path = self.dir / "Default.json"
        if not default_path.exists():
            self.save_profile(DEFAULT_PROFILE, "Default.json")

    def list_profiles(self) -> list[dict]:
        profiles = []
        for f in sorted(self.dir.glob("*.json")):
            try:
                data = json.loads(f.read_text())
                profiles.append({
                    "profileName": data.get("profileName", f.stem),
                    "filename": f.name,
                    "version": data.get("version", "1.0"),
                    "pageCount": len(data.get("pages", [])),
                    "keyCount": sum(len(p.get("keys", [])) for p in data.get("pages", [])),
                })
            except Exception as e:
                logger.warning(f"Failed to load profile {f.name}: {e}")
        return profiles

    def get_profile(self, filename: str) -> Optional[dict]:
        path = self.dir / filename
        if not path.exists():
            return None
        profile = json.loads(path.read_text())
        return migrate_key_positions(profile)

    def save_profile(self, profile: dict, filename: Optional[str] = None) -> str:
        if not filename:
            name = profile.get("profileName", "untitled")
            filename = f"{name}.json"
        if not filename.endswith(".json"):
            filename += ".json"
        # Ensure each key has an id
        for page in profile.get("pages", []):
            for i, key in enumerate(page.get("keys", [])):
                if not key.get("id"):
                    key["id"] = f"{page.get('id', 'p')}_{i}"
        # Migrate to grid positions before saving
        profile = migrate_key_positions(profile)
        path = self.dir / filename
        path.write_text(json.dumps(profile, indent=2, ensure_ascii=False))
        logger.info(f"Profile saved: {filename}")
        return filename

    def delete_profile(self, filename: str) -> bool:
        path = self.dir / filename
        if path.exists():
            path.unlink()
            logger.info(f"Profile deleted: {filename}")
            return True
        return False

    def find_page_for_app(self, profile: dict, bundle_id: str, app_name: str = "") -> Optional[str]:
        """Find the matching page ID for a given app. Returns None if no match."""
        rules = profile.get("windowRules", [])
        for rule in rules:
            rule_bundle = rule.get("bundle_id", "")
            rule_name = rule.get("name", "")
            if bundle_id and rule_bundle and bundle_id == rule_bundle:
                return rule.get("page")
            if app_name and rule_name and app_name.lower() == rule_name.lower():
                return rule.get("page")
        return None

    def match_app_to_page(self, bundle_id: str, app_name: str = "") -> Optional[dict]:
        """Search all profiles for a window rule matching the given app.
        Returns {"filename": ..., "profileName": ..., "page": ...} or None."""
        for f in sorted(self.dir.glob("*.json")):
            try:
                profile = json.loads(f.read_text())
                page_id = self.find_page_for_app(profile, bundle_id, app_name)
                if page_id:
                    return {
                        "filename": f.name,
                        "profileName": profile.get("profileName", f.stem),
                        "page": page_id,
                    }
            except Exception:
                continue
        return None


# Singleton
profile_manager = ProfileManager()
