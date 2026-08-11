# 🎛️ Tapflow

> **The keyboard you're using was designed before the light bulb. It's time for a control surface built around *you*.**

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%2015%2B%20ARM64-silver?logo=apple" alt="platform">
  <img src="https://img.shields.io/badge/tablet-iPad%20%7C%20Android%20%7C%20any%20browser-blue" alt="device">
  <img src="https://img.shields.io/badge/tablet%20install-zero-brightgreen" alt="tablet: zero install">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
</p>

---

## 🏛️ Your Keyboard Belongs to the 19th Century

The QWERTY keyboard was designed in the 1870s. For typewriters. And yet — 150 years later — you're still using that same generic grid to control a machine that can generate code, render 3D scenes, and run AI models in real time.

A keyboard is a **general-purpose tool**. It was built so *anyone* could type, not so *you* could be efficient. 100+ identical keys. Shortcuts you have to memorize. `⌘⌥⇧K` — what does that even do? Your brain — the most powerful computer on the planet — is being used as a **shortcut lookup table**.

**Recognize. Recall. Reach.** That's not thinking. That's overhead.

It's 2026. Your phone unlocks with your face. Your Mac reads your fingerprint. But your input device still expects you to memorize key combinations designed decades before you were born.

If you don't have a control surface tailored to *your* workflow — you're still operating with last-century logic.

---

## 🎯 Tapflow: Your Personal Control Layer

Tapflow isn't a "better keyboard." It's a different category entirely.

Instead of memorizing shortcuts, you **see them**. You drag a button onto a canvas. It has a name, a color, a position. You don't recall what it does — you read the label. Change its function? The label updates instantly. Switch to a different app? The entire layout switches with you.

**Your brain recognizes. It doesn't memorize.**

```
┌──────────────────────────┐       HTTP + WebSocket        ┌────────────────────────┐
│  Any device with a       │ ◄─────────────────────────── │  Mac (Tapflow.app)     │
│  browser                 │        LAN :8082              │                        │
│                          │                               │  CGEvent injection     │
│  iPad · Android · phone  │   Touch events via WS         │  System audio control  │
│  Open a URL. Done.       │   Profile sync via WS         │  Window management     │
└──────────────────────────┘                               └────────────────────────┘
```

> Every touch → WebSocket → `CGEvent` injected into macOS. The latency is imperceptible.

---

## 🎬 Scenarios, Not Feature Lists

### 🎤 One-Tap Voice Input for Vibe Coding

You're vibe coding with Claude Code, Cursor, or Windsurf. AI is generating. You need to speak your next prompt.

With a keyboard: find the voice input shortcut (was it `⌃Space`? `F5`?) → press it → speak → press again to stop.

With Tapflow: on your iPad, there's a button labeled **"🎤 Talk"**. Tap. Speak. Tap again.

It's not about saving two keystrokes. It's about **never breaking your train of thought** to remember how to start talking.

---

### 🕹️ Window Tiling as a Joystick

macOS has excellent window snapping — fullscreen, left half, right half, top, bottom. But triggering it means memorizing keyboard shortcuts or dragging with a mouse.

Tapflow's **Window Swipe** widget turns window management into a **joystick**.

Swipe up on your iPad → fullscreen. Swipe left → snap left. Swipe bottom-right → bottom-right corner. Tap to maximize. Long-press for fullscreen. It feels like a game controller, because **arranging windows shouldn't require a keyboard at all.**

---

### 🖼️ Window Thumbnails — See Before You Switch

`⌘Tab` is blind guessing. You see app icons, not window contents. Three VS Code windows open? Good luck finding the right one.

**Window Switcher** shows live thumbnails of every window, grouped by app, horizontally scrollable. You see exactly what's in each window before you switch. Tap the one you want.

---

### 📱 Dock on Your Tablet, Screen on Your Work

macOS Dock takes up the bottom of your screen. Hide it and it's annoying to summon. Keep it and you lose pixels.

Put the **Dock Panel** on your tablet instead. Launch apps, quit apps — from your iPad. Your Mac screen hides the Dock. Every pixel goes to your work.

---

### ⌨️ iPad as Your Entire Keyboard

A tablet screen is big enough. Fill it with keys, a touchpad, gesture pads, window joysticks — your iPad becomes an **input surface designed entirely around your habits**.

Type on a physical keyboard. Control everything else on the panel. This isn't adding buttons to a keyboard. This is **redesigning input from the ground up, for yourself.**

---

### 🔊 Switch Audio Devices in One Second

AirPods for a meeting. Studio monitors for music. Gaming headset. Switching means: System Settings → Sound → Output → find device → click. Every. Single. Time.

Tapflow's **Audio Out** widget: one button shows all devices. Tap to pick. Long-press to cycle. One second.

---

### 🔄 Switch Apps, Auto-Switch Your Panel

The shortcuts you need in VS Code are completely different from what you need in Photoshop.

Tapflow's **Profile system** gives each app its own layout. Switch to VS Code → coding panel loads automatically. Switch to Figma → design panel loads. No manual switching. No context collapse.

---

## 🧩 14 Widgets. Take What You Need.

### ⌨️ Input

| Widget | What it does |
|--------|-------------|
| **Key** | A labeled button that fires a key. Tap, hold-repeat, or turbo. |
| **Macro** | Multi-key combo like `⌘⇧A`. One tap = entire sequence. |
| **Text Macro** | Record a text snippet. Replay character by character. Full Unicode. |
| **Touch Pad** | Trackpad emulation. Move, scroll, tap, drag — from your tablet. |

### 🔊 Audio

| Widget | What it does |
|--------|-------------|
| **Volume** | Slider — horizontal or vertical. Tap to mute. |
| **Mic Mute** | Toggle mic. Optional live audio level rings. |
| **Audio Out / In** | Switch audio devices. Tap = picker. Hold = cycle. |

### 🪟 Windows

| Widget | What it does |
|--------|-------------|
| **Window Switcher** | Live thumbnails of all windows, grouped by app. Scroll, tap, switch. |
| **Window Click** | Five-zone click pad: fullscreen, top, bottom, left, right half. |
| **Window Swipe** | Joystick-style gesture pad. Swipe to snap edges. |
| **Fullscreen** | Toggle browser fullscreen (client-side only). |

### ⚡ System

| Widget | What it does |
|--------|-------------|
| **Dock** | macOS Dock on your tablet. Launch/quit apps. Hide the screen Dock. |
| **Switch Profile** | One-tap profile switch. Auto-switches per app. |
| **Balance** | DeepSeek API credit balance. Refreshes every 30s. |

---

## 🎨 Editor: Drag. Drop. Done.

Open `http://localhost:8082/editor` on your Mac:

- **Drag-and-drop canvas** — widgets from panel to canvas, WYSIWYG
- **Customize everything** — color, size, font, rounded corners, sound, icon, label
- **Multi-select & group** — select, group, copy-paste like Figma
- **Infinite undo** — experiment fearlessly
- **Device presets** — iPad / Android aspect ratios, one click
- **Scroll to zoom** — zoom the viewport without changing content size

---

## 🚀 Five Minutes to Your Own Panel

**On your Mac** (one-time install):

1. Download `Tapflow.dmg` from [Releases](https://github.com/Alienwang1980/tapflow/releases) → drag to `/Applications`
2. Launch Tapflow. Grant the permissions it asks for:

| Permission | Why | Required? |
|-----------|-----|:---------:|
| Accessibility | Keyboard event injection | ✅ |
| Screen Recording | Window thumbnails | ✅ |
| Microphone | Audio level display | ❌ |

3. A LaunchAgent is registered automatically — auto-start on boot, auto-restart on crash.

**On your tablet** (zero install):

4. Same WiFi as your Mac → open `http://<Mac-IP>:8082` in any browser
5. On your Mac, open `http://localhost:8082/editor` → drag a few buttons → save

Put your tablet next to your keyboard. Get back to work.

---

## ❓ FAQ

<details>
<summary><b>Tablet can't connect?</b></summary>
Same WiFi. Check the Mac's IP in the menu bar dropdown. Firewall must allow port 8082.
</details>

<details>
<summary><b>Keys not working?</b></summary>
System Settings → Privacy & Security → Accessibility → make sure Tapflow is checked.
</details>

<details>
<summary><b>No window thumbnails?</b></summary>
System Settings → Privacy & Security → Screen Recording → make sure Tapflow is checked.
</details>

<details>
<summary><b>Does the tablet need an app?</b></summary>
No. Open a URL in any browser. Supports PWA "Add to Home Screen."
</details>

<details>
<summary><b>Windows / Linux support?</b></summary>
macOS only for now (depends on CGEvent + PyObjC).
</details>

<details>
<summary><b>Multiple tablets?</b></summary>
Technically yes (WebSocket broadcast). One active touch stream at a time. Different tablets can use different Profiles.
</details>

---

## 📄 License

MIT — use it, modify it, ship it.

---

> *Your brain was not designed to memorize keyboard shortcuts. Put them on screen.*
