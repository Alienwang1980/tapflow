"""Profile CRUD with JSON file persistence + auto-switch matching."""
import json
import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger("stp.profile")

def _safe_path(profiles_dir: Path, filename: str) -> Path:
    """Resolve and validate filename stays within profiles_dir. Raises ValueError on traversal."""
    resolved = (profiles_dir / filename).resolve()
    if not str(resolved).startswith(str(profiles_dir.resolve()) + os.sep) and resolved != profiles_dir.resolve():
        raise ValueError(f"Path traversal rejected: {filename!r}")
    return resolved

def _get_data_dir() -> Path:
    """Get writable data directory. Always uses App Support."""
    base = Path.home() / "Library" / "Application Support" / "Smart Touch Panel"
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

# Load default profile from template file
def _load_default_template():
    import json, sys
    # Try app bundle first, then source directory
    if getattr(sys, 'frozen', False):
        resource_dir = Path(sys.executable).parent.parent / "Resources"
        template_path = resource_dir / "server" / "profiles" / "_default_template.json"
    else:
        template_path = Path(__file__).parent / "profiles" / "_default_template.json"
    if template_path.exists():
        return json.loads(template_path.read_text(encoding='utf-8'))
    return {"profileName":"Default","version":"1.0","device":"iPad 11\" (landscape)","deviceWidth":1210,"deviceHeight":834,"cellSize":60,"canvasX":0,"canvasY":0,"defaultSound":"click","windowRules":[],"pages":[{"id":"main","label":"Main","keys":[]}]}

# Default profile that ships with the app
DEFAULT_PROFILE = _load_default_template()

def migrate_key_positions(profile: dict) -> dict:
    """Ensure profile has required fields + keys have col/row/w/h."""
    profile.setdefault("device", "iPad 11\" (landscape)")
    profile.setdefault("deviceWidth", 1210)
    profile.setdefault("deviceHeight", 834)
    profile.setdefault("cellSize", 60)
    profile.setdefault("gap", 0)
    profile.setdefault("groups", [])
    profile.setdefault("canvasX", 0)
    profile.setdefault("canvasY", 0)
    profile.setdefault("defaultSound", "click")
    profile.setdefault("bgColor", "")
    profile.setdefault("bgTexture", "")
    profile.setdefault("showGrid", True)
    for page in profile.get("pages", []):
        page.pop("columns", None)
        page.pop("rows", None)
        for key in page.get("keys", []):
            key.setdefault("col", 0)
            key.setdefault("row", 0)
            key.setdefault("w", 1)
            key.setdefault("h", 1)
            key.setdefault("sound", "");
            key.setdefault("closeSound", "");
            key.setdefault("action", "hold");
            if key.get("action") == "key": key["action"] = "hold"
            key.setdefault("color", "#0f3460");
            key.setdefault("groupId", None)
            if key.get("groupId") and not key.get("groups"):
                key["groups"] = [key["groupId"]]
            key.setdefault("groups", None)
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

    def get_profile(self, filename: str, mask_secrets: bool = True) -> Optional[dict]:
        path = _safe_path(self.dir, filename)
        if not path.exists():
            return None
        profile = json.loads(path.read_text(encoding='utf-8'))
        profile = migrate_key_positions(profile)
        if mask_secrets:
            for page in profile.get("pages", []):
                for key in page.get("keys", []):
                    if key.get("action") == "balance":
                        key["hasApiKey"] = bool(key.get("apiKey"))
                        key.pop("apiKey", None)
        return profile

    def get_key_api_key(self, filename: str, key_id: str) -> Optional[str]:
        """Return the actual apiKey for a balance key (for server-side proxy)."""
        path = _safe_path(self.dir, filename)
        if not path.exists():
            return None
        profile = json.loads(path.read_text(encoding='utf-8'))
        for page in profile.get("pages", []):
            for key in page.get("keys", []):
                if key.get("id") == key_id and key.get("action") == "balance":
                    return key.get("apiKey") or None
        return None

    def set_key_api_key(self, filename: str, key_id: str, api_key: str) -> bool:
        """Set the apiKey for a specific balance key. Returns True if key found."""
        path = _safe_path(self.dir, filename)
        if not path.exists():
            return False
        profile = json.loads(path.read_text(encoding='utf-8'))
        found = False
        for page in profile.get("pages", []):
            for key in page.get("keys", []):
                if key.get("id") == key_id and key.get("action") == "balance":
                    key["apiKey"] = api_key
                    found = True
        if found:
            path.write_text(json.dumps(profile, indent=2, ensure_ascii=False), encoding='utf-8')
            logger.info(f"API key updated for key {key_id} in {filename}")
        return found

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
        # Preserve existing apiKey values (editor masks them, never sends real value)
        path = _safe_path(self.dir, filename)
        if path.exists():
            try:
                existing = json.loads(path.read_text(encoding='utf-8'))
                for ep in existing.get("pages", []):
                    for ek in ep.get("keys", []):
                        if ek.get("action") == "balance" and ek.get("apiKey"):
                            for pp in profile.get("pages", []):
                                for pk in pp.get("keys", []):
                                    if pk.get("id") == ek.get("id") and pk.get("action") == "balance":
                                        if not pk.get("apiKey"):
                                            pk["apiKey"] = ek["apiKey"]
            except Exception:
                pass
        # Strip virtual hasApiKey (derived from apiKey presence, not a stored field)
        for page in profile.get("pages", []):
            for key in page.get("keys", []):
                if key.get("action") == "balance":
                    key.pop("hasApiKey", None)
        # Migrate to grid positions before saving
        profile = migrate_key_positions(profile)
        path.write_text(json.dumps(profile, indent=2, ensure_ascii=False), encoding='utf-8')
        logger.info(f"Profile saved: {filename}")
        return filename

    def import_profile(self, profile: dict) -> str:
        """Import an externally exported profile. Never overwrites:
        name conflicts (filename OR profileName, case-insensitive — APFS
        is case-insensitive and PATCH rename can desync the two) get an
        auto " (2)" / " (3)"... suffix. Returns the saved filename."""
        raw = str(profile.get("profileName", "") or "Imported").strip() or "Imported"
        # Sanitize: external input crosses a trust boundary — no path tricks.
        base = raw.replace("/", "_").replace("\\", "_").replace("\0", "").lstrip(".") or "Imported"

        taken_files = {f.name.lower() for f in self.dir.glob("*.json")}
        taken_names = {p["profileName"].strip().lower() for p in self.list_profiles()}

        name, n = base, 1
        while f"{name}.json".lower() in taken_files or name.lower() in taken_names:
            n += 1
            name = f"{base} ({n})"

        imported = dict(profile, profileName=name)
        return self.save_profile(imported, f"{name}.json")

    def delete_profile(self, filename: str) -> bool:
        path = _safe_path(self.dir, filename)
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
