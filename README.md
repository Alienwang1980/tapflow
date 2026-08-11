# Tapflow / 点流

> **Turn your tablet into a customizable touch control panel for vibe coding.**
> **把平板变成可定制的触控面板，为 vibe coding 而生。**

Tapflow is a macOS menu bar app that serves a virtual touch panel to any tablet browser (iPad, Android — anything with a modern browser). It works **alongside your tablet's physical keyboard**: your fingers handle shortcuts, window management, media controls, macros, and quick actions on the touch panel while your keyboard stays focused on code. Zero installation on the tablet — just open a URL.

Tapflow 是一个 macOS 菜单栏应用。它在 Mac 上启动一个 Web 服务，任何平板（iPad、Android，有浏览器就行）连上来就变成一个虚拟触控面板。它和**平板的物理键盘协同工作**：手指在面板上处理快捷键、窗口管理、媒体控制、宏指令、快捷操作，键盘专注于写代码。平板上零安装——打开网页即用。

---

## How It Works / 工作原理

```
┌─────────────────────┐         HTTP + WebSocket        ┌──────────────────────┐
│  Tablet (iPad/Android) │ ←────────────────────────── │  Mac (Tapflow)       │
│  browser               │     LAN :8082               │  menu bar app        │
│                        │                              │                      │
│  · Canvas-rendered     │   Touch events via WS        │  · CGEvent injection  │
│    control panel       │   Profile sync via WS        │  · System audio ctl   │
│  · Profile editor      │                              │  · Window management  │
│  · Zero install        │                              │  · Menu bar tray      │
└─────────────────────┘                                └──────────────────────┘
```

Every touch on the tablet is sent to the Mac in real time via WebSocket and injected into macOS as native keyboard/mouse events through Quartz CoreGraphics (`CGEvent`). The tablet feels like a native extension of your Mac.

平板上的每一次触摸都通过 WebSocket 实时发送到 Mac，再通过 Quartz CoreGraphics (`CGEvent`) 注入 macOS 成为原生的键盘/鼠标事件。平板就像 Mac 的原生扩展。

---

## Why Tapflow? / 为什么用 Tapflow？

| With Tapflow | Without Tapflow |
|--------------|-----------------|
| One tap = any shortcut or macro | Memorize dozens of key combinations |
| Swipe to manage windows | Reach for the trackpad constantly |
| Visual audio device switcher | Dig through System Settings |
| One tap to switch profiles (contexts) | Manually reconfigure everything |
| Your keyboard stays on code | Context-switching breaks flow |

Tapflow keeps you **in flow**. Your keyboard writes code. Your fingers tap commands. No context switching.

Tapflow 让你**保持心流**。键盘写代码，手指下指令。无需切换上下文。

---

## Features / 功能

### Control Widgets (14 types)

| Widget | What It Does |
|--------|-------------|
| **Regular Key** | Any keyboard key — tap, hold, or turbo-repeat. Custom label, color, border radius, sound. |
| **Macro Key** | Multi-key combos like `⌘⇧A`, `⌃⌘Space`. Tap once, fire a sequence. |
| **Text Macro** | Record a text snippet, replay character-by-character on tap. Full Unicode support. |
| **Touch Pad** | Mac trackpad emulation — single-finger move, two-finger scroll, tap to click, drag support. |
| **Volume Slider** | Horizontal or vertical system volume control. Tap to mute/unmute. |
| **Mic Mute** | Toggle microphone mute. Optional real-time audio level visualization with animated rings. |
| **Audio Out / Audio In** | Switch audio devices. Tap for a device picker popup, long-press to cycle. |
| **Window Switcher** | Visual window/tab switcher with real-time thumbnails. Grouped by app, scroll horizontally. Tap to focus any window. |
| **Window Control (Click)** | Five-zone click pad: fullscreen, top-half, bottom-half, left-half, right-half. Instant window tiling. |
| **Window Control (Swipe)** | Joystick-style gesture pad. Swipe to snap windows to edges, tap to maximize/restore, long-press for fullscreen. |
| **Dock Panel** | macOS Dock simulation — launch and quit apps directly from the tablet. Detects running state. |
| **Fullscreen Toggle** | Toggle iPad browser fullscreen mode. Pure frontend, no backend call. |
| **Switch Profile** | Switch between profiles (workspace contexts) with one tap. Long-press shows the profile picker. Custom icon color, show/hide label. |
| **Balance** | DeepSeek API credit balance display. Auto-refreshes every 30s. |

### 控制组件（14 种）

| 组件 | 功能 |
|------|------|
| **普通按键** | 任意键盘按键——点按、长按、Turbo 连发。自定义标签、颜色、圆角、音效。 |
| **组合键宏** | 多键组合如 `⌘⇧A`、`⌃⌘Space`。一键触发序列。 |
| **文字宏** | 录制文字片段，点击逐字回放。完整 Unicode 支持。 |
| **触控板** | Mac 触控板模拟——单指移动、双指滚动、点击、拖拽。 |
| **音量滑块** | 横向或竖向系统音量控制。点击静音/取消静音。 |
| **麦克风静音** | 切换麦克风静音。可选实时音频电平动画显示。 |
| **音频输出/输入** | 切换音频设备。点击弹出设备菜单，长按轮换。 |
| **窗口切换器** | 可视化窗口/标签页切换器，含实时缩略图。按应用分组，横向滚动。点击聚焦任意窗口。 |
| **窗口控制（点击）** | 五区域点击板：全屏、上半、下半、左半、右半。即时窗口贴靠。 |
| **窗口控制（滑动）** | 摇杆式手势板。滑动贴边，点击最大化/恢复，长按全屏。 |
| **Dock 面板** | macOS Dock 模拟——直接从平板启动和退出应用。检测运行状态。 |
| **全屏切换** | 切换 iPad 浏览器全屏模式。纯前端，无后端调用。 |
| **切换 Profile** | 一键切换 Profile（工作区上下文）。长按显示 Profile 选择器。自定义图标颜色、显示/隐藏标签。 |
| **余额显示** | DeepSeek API 余额显示。每 30 秒自动刷新。 |

### Editor / 编辑器

A full visual editor (open `/editor` on your Mac in Safari) lets you:

- **Drag & drop** widgets from a library onto a canvas
- **Position freely** on an infinite grid — no snapping unless you want it
- **Customize every widget**: colors, sizes, fonts, border radius, sounds, icons, labels
- **Multi-select, group, clipboard** — rearrange your panel like a design tool
- **Undo/redo** — full history stack
- **Device presets** — iPad / Android tablet aspect ratios, or custom dimensions
- **Scroll to zoom** — zoom the viewport without changing content size
- **Profiles** — save multiple layouts, switch between them on the tablet with one tap
- **Window rules** — auto-switch profiles when you open a specific app on Mac

完整的可视化编辑器（Mac 上用 Safari 打开 `/editor`）：

- **拖拽布局**——从组件库拖到画布
- **自由定位**——无限网格，无强制对齐
- **深度定制**——颜色、尺寸、字体、圆角、音效、图标、标签
- **多选、成组、剪贴板**——像设计工具一样重新排列面板
- **撤销/重做**——完整历史栈
- **设备预设**——iPad / Android 平板比例，或自定义尺寸
- **滚轮缩放**——缩放视角不改变内容尺寸
- **Profiles**——保存多套布局，平板上点击切换
- **窗口规则**——打开特定 Mac 应用时自动切换 Profile

---

## Widget Showcase / 组件一览

```
┌──────────┬──────────┬──────────┬──────────┬──────────────┐
│ REGULAR  │  MACRO   │  VOLUME  │ MIC MUTE │ AUDIO OUT/IN │
│   KEY    │   KEY    │  SLIDER  │  +LEVEL  │   SWITCHER   │
│  Tap /   │ ⌘⇧A one │ Horizontal│ Animated │  Tap=menu    │
│  Hold /  │   tap    │  /Vert    │  rings   │  Hold=cycle  │
│  Turbo   │          │          │          │              │
├──────────┼──────────┼──────────┼──────────┼──────────────┤
│  WINDOW  │  TOUCH   │ WINDOW   │ WINDOW   │  FULLSCREEN  │
│ SWITCHER │   PAD    │  CTRL    │  SWIPE   │   TOGGLE     │
│Thumbnails│  Move/   │ 5-zone   │Joystick  │  Browser     │
│+tab list │ Scroll/  │  click   │  snap    │  fullscreen  │
│          │  Drag    │          │          │              │
├──────────┼──────────┼──────────┼──────────┼──────────────┤
│   DOCK   │  SWITCH  │  TEXT    │ BALANCE  │              │
│  PANEL   │ PROFILE  │  MACRO   │ DISPLAY  │              │
│ Launch/  │ 1-tap to │ Record & │ DeepSeek │              │
│ Quit app │  switch  │  replay  │ credits  │              │
└──────────┴──────────┴──────────┴──────────┴──────────────┘
```

---

## Installation / 安装

### Requirements / 环境要求

- **Mac**: Apple Silicon (arm64), macOS 15+
- **Tablet**: Any tablet with a modern browser — iPad (Safari), Android (Chrome), etc.
- **Network**: Mac and tablet on the same LAN

### Install / 安装步骤

1. Download `Tapflow.dmg` from [Releases](https://github.com/Alienwang1980/tapflow/releases)
2. Open the DMG, drag `Tapflow.app` to `Applications`
3. Launch Tapflow — a menu bar icon will appear
4. Grant permissions when prompted:
   - **Accessibility** (辅助功能) — for keyboard simulation
   - **Screen Recording** (屏幕录制) — for window thumbnails
   - **Microphone** (麦克风) — for audio level display (optional)
5. On your tablet, open a browser and go to `http://<Mac-IP>:8082`
6. On your Mac, open Safari and go to `http://localhost:8082/editor` to customize your panel

---

## Tech Stack / 技术栈

| Layer | Tech |
|-------|------|
| Web framework | FastAPI + Starlette |
| Real-time | WebSocket (uvicorn, single event loop) |
| Input injection | Quartz CoreGraphics `CGEvent` |
| System integration | PyObjC (AppKit / Quartz / Foundation / AVFoundation) |
| Menu bar | pystray (`LSUIElement=True`) |
| Service discovery | zeroconf (mDNS) |
| Packaging | py2app (arm64, Apple Development signed) |
| Frontend | Vanilla HTML5 Canvas + JavaScript (zero framework) |

---

## Architecture / 架构

```
tapflow/
├── server/                  # Python backend
│   ├── tray_app.py          ★ Entry point — menu bar + dashboard
│   ├── main.py              FastAPI app + WebSocket + profile CRUD
│   ├── input_engine.py      CGEvent keyboard/mouse injection
│   ├── ax_bridge.py         macOS Accessibility bridge (windows/menus)
│   ├── profile_manager.py   Profile JSON CRUD + window rules
│   ├── system_control.py    Volume / mute / audio devices
│   ├── window_watcher.py    Foreground app change detection
│   ├── state.py             Shared mutable state
│   └── routes_*.py          11 route modules (audio, mic, window, dock...)
│
├── client/                  # Frontend (static HTML/JS)
│   ├── index.html           ★ Tablet control panel (WebSocket client)
│   ├── editor.html          ★ Visual panel editor (drag-drop layout)
│   └── thumbnails/          Widget preview thumbnails
│
├── Default_Profile/         Bundled default profiles
├── setup.py                 py2app packaging config
└── docs/                    Design & architecture docs
```

---

## Profile System / Profile 系统

Profiles are JSON files that define a complete panel layout. Each profile contains:

- **Pages**: Multiple pages within a profile (auto-switched by window rules)
- **Keys**: Widget instances with full configuration (type, position, size, colors, sounds...)
- **Window Rules**: Auto-switch to a page when a specific Mac app is frontmost

Profiles can be imported/exported via the editor. Bundled defaults include a full 68-key Keyboard profile and a curated 25-key vibe profile.

---

## License / 许可证

MIT

---

> *Tap points. Flow keys.*
> *触点成流。*
