"""Shared mutable state for tray app routes. Replaces nonlocal variables in run_server()."""
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ServerState:
    """All mutable state shared across tray routes. Explicit attributes replace 7 nonlocal variables."""

    # Profile
    current_profile: str = "Default.json"

    # Volume / Mute
    output_muted: bool = False
    mic_pre: int | None = None   # input volume level before mute, for restore
    mic_muted: bool = False

    # Mic sampler (AVAudioRecorder)
    mic_level: float = 0.0
    mic_sampling: bool = False
    mic_recorder: Any = None
    mic_monitor_enabled: bool = False

    # Window thumbnail cache — key: (pid, title_lower) → (jpeg_bytes, timestamp)
    thumb_cache: dict = field(default_factory=dict)
    # Favicon proxy cache — key: domain → (bytes, timestamp, content_type)
    favicon_cache: dict = field(default_factory=dict)
