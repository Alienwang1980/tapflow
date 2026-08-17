# 🎛️ Tapflow

> **The keyboard you're using was designed before the light bulb. It's time for a control surface built around *you*.**

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%2015%2B%20ARM64-silver?logo=apple" alt="platform">
  <img src="https://img.shields.io/badge/tablet-iPad%20%7C%20Android%20%7C%20any%20browser-blue" alt="device">
  <img src="https://img.shields.io/badge/tablet%20install-zero-brightgreen" alt="tablet: zero install">
  <img src="https://img.shields.io/badge/version-1.0.4-orange" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
</p>

---

## Your Keyboard Belongs to the 19th Century

The keyboard — a general-purpose tool invented last century for typing — does its job well in most cases. But computing has evolved, and the keyboard has had to take on new roles: high-frequency actions (switching windows, changing audio, launching apps) gradually became shortcuts, mostly key combinations. And shortcuts or multi-level mouse menus aren't always the most intuitive. As personalization demands grew, those shortcuts became customizable — but the keyboard itself cannot change. The contradiction is plain, and while we've learned to endure it, for most people it remains a steep learning curve.

![keyboard](docs/images/tapflow-02.jpg)

Shortcut count easily outgrows memory. What does `⌘⌥⇧K` do? Recall the function, recall the position, hunt with your fingers — once you have enough shortcuts, this process interrupts your flow.

This incomplete Mac shortcuts cheat sheet is already a lot to memorize.

![Mac shortcuts](docs/images/tapflow-03.jpg)

Your phone recognizes your face, your computer recognizes your fingerprint — yet you still operate your computer by memorizing shortcuts. Your brain, the most powerful computing capability on Earth, spent on memorizing shortcuts is a waste of resources.

**However, things have changed.**

In the AI era, vibe coding actually lowers the demand on keyboards while raising new demands on input methods — and matching products have appeared, like the Worklouder Creator Micro 2:

![Creator Micro 2](docs/images/tapflow-04.jpg)

![Creator Micro 2](docs/images/tapflow-05.jpg)

![Creator Micro 2](docs/images/tapflow-06.jpg)

These products still use physical keys: remappable, but the shape and size never change — and after enough customization, remembering each key's purpose remains a burden.

![forgotten macros](docs/images/tapflow-07.jpg)

Another established option is the Elgato Stream Deck: physical keys with tiny screens. Works well, priced from three figures.

![Stream Deck](docs/images/tapflow-08.jpg)

My approach was to solve one small problem with the lightest possible thing, then grow with real needs. So I made this:

![Tapflow](docs/images/tapflow-01.jpg)

## Tapflow — Your Personal Control Layer

Tapflow isn't a keyboard replacement — it works alongside keyboard and mouse: high-frequency actions become visible buttons, reducing what you have to memorize.

![panel](docs/images/tapflow-10.jpg)

![panel](docs/images/tapflow-11.jpg)

A fully customizable input surface for controlling your computer. **No app to install on the tablet** — a small server runs on your Mac, the tablet connects through the browser, that's it. A web-based editor is included:

![editor](docs/images/tapflow-12.jpg)

Drag out buttons in the editor; each gets its own name, color, size, position. Change a function and the label updates instantly — **see it, use it, nothing to memorize**.

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

## Scenarios, Not Feature Lists

### 🎤 One-Tap Voice Input for Vibe Coding

![voice button](docs/images/tapflow-13.jpg)

You're vibe coding with Claude Code or Cursor. AI is generating. You need to speak your next prompt.

With a keyboard: find the voice input shortcut (was it `⌃Space`? `F5`?) → press it → speak → press again to stop.

With Tapflow: on your iPad, there's a button labeled **"🎤 Talk"**. Tap. Speak. Tap again.

It's not about saving two keystrokes. It's about **never breaking your train of thought** to remember how to start talking.

### 🕹️ Window Tiling as a Joystick

![Window Swipe](docs/images/tapflow-14.jpg)

![Window Swipe demo](docs/images/tapflow-window-swiper.gif)

macOS has excellent window snapping — fullscreen, left half, right half, top, bottom. But triggering it means memorizing keyboard shortcuts or dragging with a mouse.

Tapflow's **Window Swipe** widget turns window management into a **joystick**: swipe up on your iPad → fullscreen. Swipe left → snap left. Swipe bottom-right → bottom-right corner. Tap to maximize. Long-press for fullscreen. It feels like a game controller — **arranging windows shouldn't require a keyboard at all**.

### 🖼️ Window Thumbnails — See Before You Switch

![Window Switcher](docs/images/tapflow-15.jpg)

`⌘Tab` is blind guessing. You see app icons, not window contents. Three VS Code windows open? Good luck finding the right one.

**Window Switcher** shows live thumbnails of every window, grouped by app, horizontally scrollable. You see exactly what's in each window before you switch. Tap the one you want.

### 📱 Dock on Your Tablet, Screen on Your Work

![Dock Panel](docs/images/tapflow-16.jpg)

macOS Dock takes up the bottom of your screen. Hide it and it's annoying to summon. Keep it and you lose pixels.

Put the **Dock Panel** on your tablet instead. Launch apps, quit apps — from your iPad. Your Mac screen hides the Dock. Every pixel goes to your work.

### 🔊 Switch Audio Devices in One Second

![Audio Out](docs/images/tapflow-17.jpg)

AirPods for a meeting. Studio monitors for music. Gaming headset. Switching means: System Settings → Sound → Output → find device → click. Every. Single. Time.

Tapflow's **Audio Out** widget: one button shows all devices. Tap to pick. Long-press to cycle. **One second.**

### ⌨️ iPad as Your Entire Keyboard

![full panel](docs/images/tapflow-18.jpg)

A tablet screen is big enough. Fill it with keys, a touchpad, gesture pads, window joysticks — your iPad becomes an **input surface designed entirely around your habits**.

Type on a physical keyboard. Control everything else on the panel. This isn't adding buttons to a keyboard. This is **redesigning input from the ground up, for yourself.**

You can even watch your DeepSeek API balance right on the panel:

![balance widget](docs/images/tapflow-19.jpg)

Buttons that update in real time aren't just inputs — they're outputs too.

## 14 Widgets. Take What You Need.

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

## Editor: Drag. Drop. Done.

Open `http://localhost:8082/editor` on your Mac:

- **Drag-and-drop canvas** — widgets from panel to canvas, WYSIWYG
- **Customize everything** — color, size, font, rounded corners, sound, icon, label
- **Multi-select & group** — select, group, copy-paste like Figma
- **Infinite undo** — experiment fearlessly
- **Device presets** — iPad / Android aspect ratios, one click
- **Scroll to zoom** — zoom the viewport without changing content size

## Five Minutes to Your Own Panel

**On your Mac** (one-time install):

1. Download `Tapflow.dmg` from [Releases](https://github.com/Alienwang1980/tapflow/releases) → drag to `/Applications`
2. On first open you'll see "cannot be verified" (v1 ships ad-hoc signed, not notarized) → System Settings → Privacy & Security → "Open Anyway" → "Open". Once only
3. Launch Tapflow and grant the permissions via the onboarding panel:

| Permission | Why | Required? |
|-----------|-----|:---------:|
| Accessibility | Keyboard event injection | ✅ |
| Screen Recording | Window thumbnails | ✅ |
| Microphone | Audio level display | ❌ |

4. (Optional) Enable auto-start in the settings panel — a launchd daemon starts it on boot and relaunches it on crash

**On your tablet** (zero install):

5. Same WiFi as your Mac → open `http://<Mac-IP>:8082` in any browser
6. On your Mac, open `http://localhost:8082/editor` → drag a few buttons → save

Put your tablet next to your keyboard. Get back to work.

## What Tapflow Is Not

To be clear: Tapflow was never meant to replace the keyboard — for typing, a keyboard is still the right tool. It's designed to work alongside keyboard and mouse, taking over high-frequency actions. (Some users report barely touching their keyboard in certain scenarios — that's an incidental use case, not the design goal.)

This is v1, built to test whether the idea is useful — or whether my own itch is general. There are plenty of rough edges; feedback, especially the critical kind, is very welcome.

## FAQ

<details>
<summary><b>"Cannot be verified" on first open?</b></summary>
The current release is ad-hoc signed (not notarized), so Gatekeeper soft-blocks it once. System Settings → Privacy & Security → "Open Anyway" — once only, then it opens normally.
</details>

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

## License

MIT — use it, modify it, ship it.

> *Your brain was not designed to memorize keyboard shortcuts. Put them on screen.*
