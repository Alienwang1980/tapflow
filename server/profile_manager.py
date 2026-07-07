"""Profile CRUD with JSON file persistence + auto-switch matching."""
import json
import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger("stp.profile")

def _get_data_dir() -> Path:
    """Get writable data directory. Uses ~/Library/Application Support when bundled."""
    import sys
    # py2app sets sys.frozen
    if getattr(sys, 'frozen', False):
        base = Path.home() / "Library" / "Application Support" / "Smart Touch Panel"
    else:
        base = Path(__file__).parent
    base.mkdir(parents=True, exist_ok=True)
    return base

DATA_DIR = _get_data_dir()
PROFILES_DIR = DATA_DIR / "profiles"
PROFILES_DIR.mkdir(exist_ok=True)

# Device presets grouped by aspect ratio
DEVICE_PRESETS = {
    "iPad 4:3":       {"width": 1024, "height": 1366},
    "iPad 11\"":      {"width": 834,  "height": 1210},
    "iPad mini":      {"width": 744,  "height": 1133},
    "Android 16:10":  {"width": 1280, "height": 800},
}

# Default profile that ships with the app
DEFAULT_PROFILE = {
    "profileName": "Default",
    "version": "1.0",
    "device": "iPad 11\"",
    "deviceWidth": 834,
    "deviceHeight": 1210,
    "cellSize": 60,
    "canvasX": 0,
    "canvasY": 0,
    "defaultSound": "click",
    "windowRules": [
        {"bundle_id": "com.apple.Safari", "page": "browsing"},
        {"bundle_id": "com.google.Chrome", "page": "browsing"},
        {"bundle_id": "com.apple.Finder", "page": "finder"},
        {"bundle_id": "com.apple.Terminal", "page": "terminal"},
        {"bundle_id": "com.microsoft.VSCode", "page": "coding"},
    ],
    "pages": [
        {
            "id": "main", "label": "Main",
            "keys": [
                {"id":"k1","label":"←","col":0,"row":0,"w":1,"h":1,"action":"key","value":"LEFT","color":"#444","sound":""},
                {"id":"k2","label":"↓","col":1,"row":0,"w":1,"h":1,"action":"key","value":"DOWN","color":"#444","sound":""},
                {"id":"k3","label":"→","col":2,"row":0,"w":1,"h":1,"action":"key","value":"RIGHT","color":"#444","sound":""},
                {"id":"k4","label":"↑","col":3,"row":0,"w":1,"h":1,"action":"key","value":"UP","color":"#444","sound":""},
                {"id":"k5","label":"Tab","col":0,"row":1,"w":1,"h":1,"action":"key","value":"TAB","color":"#555","sound":""},
                {"id":"k6","label":"Space","col":1,"row":1,"w":2,"h":1,"action":"key","value":"SPACE","color":"#3a7ca5","sound":""},
                {"id":"k7","label":"Enter","col":3,"row":1,"w":1,"h":1,"action":"key","value":"RETURN","color":"#3a7ca5","sound":""},
                {"id":"k9","label":"⌘","col":0,"row":2,"w":1,"h":1,"action":"key","value":"COMMAND","color":"#666","sound":""},
                {"id":"k10","label":"⌥","col":1,"row":2,"w":1,"h":1,"action":"key","value":"OPTION","color":"#666","sound":""},
                {"id":"k11","label":"⌃","col":2,"row":2,"w":1,"h":1,"action":"key","value":"CONTROL","color":"#666","sound":""},
                {"id":"k12","label":"⇧","col":3,"row":2,"w":1,"h":1,"action":"key","value":"SHIFT","color":"#666","sound":""},
                {"id":"k13","label":"⌫","col":4,"row":0,"w":1,"h":1,"action":"key","value":"DELETE","color":"#8b3a3a","sound":""},
            ],
        },
    ],
}

def migrate_key_positions(profile: dict) -> dict:
    """Ensure profile has new model fields + keys have col/row/w/h."""
    # Profile-level defaults
    profile.setdefault("device", "iPad 11\"")
    profile.setdefault("deviceWidth", 834)
    profile.setdefault("deviceHeight", 1210)
    profile.setdefault("cellSize", 60)
    profile.setdefault("canvasX", 0)
    profile.setdefault("canvasY", 0)
    profile.setdefault("defaultSound", "click")

    # Remove old cols/rows from pages (no longer used)
    for page in profile.get("pages", []):
        page.pop("columns", None)
        page.pop("rows", None)
        cur_col, cur_row = 0, 0
        for key in page.get("keys", []):
            w = key.get("w", 1)
            h = key.get("h", 1)
            if "col" not in key or "row" not in key:
                key["col"] = cur_col
                key["row"] = cur_row
                key.setdefault("h", h)
                cur_col += w
            else:
                cur_col = key["col"] + key.get("w", 1)
                cur_row = key["row"]
    return profile


class ProfileManager:
    """Profile JSON file storage with auto-switch matching."""

    def __init__(self, profiles_dir: Path = PROFILES_DIR):
        self.dir = profiles_dir
        self._ensure_default()

    def _ensure_default(self):
        default_path = self.dir / "Default.json"
        if not default_path.exists():
            # Try to copy from bundled app resources first
            import sys
            if getattr(sys, 'frozen', False):
                # py2app: resources are ../Resources relative to executable
                resource_dir = Path(sys.executable).parent.parent / "Resources"
                resource_default = resource_dir / "server" / "profiles" / "Default.json"
                if resource_default.exists():
                    import shutil
                    default_path.write_text(resource_default.read_text(encoding='utf-8'), encoding='utf-8')
                    return
            self.save_profile(DEFAULT_PROFILE, "Default.json")

    def list_profiles(self) -> list[dict]:
        profiles = []
        for f in sorted(self.dir.glob("*.json")):
            try:
                data = json.loads(f.read_text(encoding='utf-8'))
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
        profile = json.loads(path.read_text(encoding='utf-8'))
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
        path.write_text(json.dumps(profile, indent=2, ensure_ascii=False), encoding='utf-8')
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
                profile = json.loads(f.read_text(encoding='utf-8'))
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
