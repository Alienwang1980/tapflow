# 🎛️ Tapflow / 点流

> **Turn your tablet into a customizable touch control panel for vibe coding.**
> **把平板变成可定制的触控面板，为 vibe coding 而生。**

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%2015%2B%20ARM64-silver?logo=apple" alt="platform">
  <img src="https://img.shields.io/badge/tablet-iPad%20%7C%20Android-blue" alt="tablet">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
  <img src="https://img.shields.io/badge/built%20with-Python%20%7C%20Vanilla%20JS-yellow" alt="tech">
</p>

Tapflow is a macOS menu bar app that turns **any tablet** (iPad, Android — anything with a browser) into a visual shortcut panel. Every app has its own keyboard shortcuts — powerful, but **impossible to remember** across different apps. Tapflow puts them on your tablet as **labeled buttons you can see**: tap once to fire a shortcut that would otherwise take 2-4 keys. Physical keyboards can't relabel themselves; Tapflow buttons always show what they do, and update instantly when you reconfigure. **Zero installation on the tablet** — just open a URL.

Tapflow 是一个 macOS 菜单栏应用。它在 Mac 上启动一个 Web 服务，任何平板（iPad、Android，有浏览器就行）连上来就变成一个**可视化快捷键面板**。每个应用都有自己的快捷键——功能强大，但**跨应用根本记不住**。Tapflow 把它们变成平板上的**带标签按钮，看得见、点得到**：原本要按 2-4 个键的组合键，现在一下触发。实体键盘没法改键帽标签，设了宏两天就忘；Tapflow 的按钮始终显示当前功能，改了立刻生效。平板上**零安装**——打开网页即用。

---

## 📡 How It Works / 工作原理

```
┌──────────────────────┐         HTTP + WebSocket         ┌──────────────────────┐
│   Tablet (any OS)    │ ◄────────────────────────────── │   Mac (Tapflow)      │
│   browser            │           LAN :8082             │   menu bar app       │
│                      │                                  │                      │
│   · Canvas-rendered  │    Touch events via WS           │   · CGEvent inject   │
│     control panel    │    Profile sync via WS           │   · System audio     │
│   · Profile editor   │                                  │   · Window mgmt      │
│   · Zero install     │                                  │   · Tray icon        │
└──────────────────────┘                                  └──────────────────────┘
```

Every touch on the tablet is sent to the Mac in real time via WebSocket and injected into macOS as native keyboard/mouse events through Quartz CoreGraphics (`CGEvent`). The tablet feels like a native extension of your Mac.

平板上的每一次触摸都通过 WebSocket 实时发送到 Mac，再通过 Quartz CoreGraphics (`CGEvent`) 注入 macOS 成为原生的键盘/鼠标事件。平板就像 Mac 的原生扩展。

---

## ✨ Why Tapflow? / 为什么用 Tapflow？

键盘很强大，但也很复杂。几十个快捷键、不同应用各有各的习惯——**记不住才是常态**。你可能设过宏键，但过两天就忘了它干嘛的，因为键帽上什么都没写。

Tapflow 的思路是：**做一个只属于你自己的、精简的键盘**。你只放用得着的按钮，每个都带着名字，一眼就知道是干嘛的。改了立刻生效，标签跟着更新。它不替代键盘——它帮你**把键盘上记不住的部分，变成平板上看得见的东西**。

| Tapflow ✅ | 不用 Tapflow ❌ |
|-----------|--------------|
| **一个按钮**，标签写着功能，点一下触发 | 背几十个组合键，换一个应用就忘 |
| 只放**你需要的**，越用越顺手 | 键盘上 100+ 个键，90% 你用不上 |
| 改了功能**标签立刻更新**，不会忘 | 设了个宏键，两天后忘了是干嘛的 |
| 每个 Profile 一套布局，**换应用自动切** | 手动记住每个应用的快捷键体系 |

> **Vibe coding 场景：** 你在 Mac 上用 Claude Code / Cursor / Windsurf 做 vibe coding。过程中你需要的快捷键就那几组——运行、审查、提交、切换文件。在编辑器里把这些拖成按钮，iPad 放旁边，每个按钮标得清清楚楚。不用背，不用记，不用翻 cheat sheet。这就是 Tapflow：**一个你自己定义、自己命名、一眼就知道点哪的可视化键盘。**

---

## 🚀 Quick Start / 快速开始

### 1. Mac 端安装
```bash
# 下载 DMG → 拖入 /Applications → 启动
open /Applications/Tapflow.app
```

### 2. 授予权限
首次启动会弹出系统权限请求，**全部允许**：
- **辅助功能**（Accessibility）— 模拟键盘输入
- **屏幕录制**（Screen Recording）— 窗口缩略图
- **麦克风**（Microphone）— 音频电平显示（可选）

### 3. 平板连接
平板和 Mac 在**同一局域网**，浏览器打开：
```
http://<Mac-IP-地址>:8082
```
Mac IP 可以在菜单栏图标下拉菜单中找到，也可以用 `ifconfig` 查看。

### 4. 定制面板（可选）
Mac 上 Safari 打开编辑器：
```
http://localhost:8082/editor
```
从组件库拖拽组件到画布，自由布局，保存为 Profile。

### 5. 定制你自己的快捷键面板 🎉
只放你用得到的按钮，每个都标清楚。键盘负责打字，面板负责那些记不住的快捷键。不用背，不用翻 cheat sheet。

---

## 🎛️ Widget Library / 组件库（14 种）

### ⌨️ Input / 输入类

| Widget | EN | CN |
|--------|----|----|
| **Regular Key** | Any key — tap, hold (repeat), or turbo. Custom color, label, border radius, sound. | 任意按键——点按、长按连发、Turbo 急速连发。自定义颜色、标签、圆角、音效。 |
| **Macro Key** | Multi-key combos like `⌘⇧A`, `⌃⌘Space`. One tap fires the whole sequence. | 组合键宏如 `⌘⇧A`、`⌃⌘Space`。一键触发完整序列。 |
| **Text Macro** | Record a text snippet, replay character-by-character. Full Unicode. | 录制文字片段，点击逐字回放。完整 Unicode 支持。 |
| **Touch Pad** | Mac trackpad emulation — move, scroll, tap, drag. Relative positioning. | Mac 触控板模拟——移动、滚动、点击、拖拽。相对位移模式。 |

### 🔊 Audio / 音频类

| Widget | EN | CN |
|--------|----|----|
| **Volume Slider** | Horizontal/vertical system volume. Tap to mute/unmute. Real-time level feedback. | 横向/竖向系统音量滑块。点击静音/取消。实时电平反馈。 |
| **Mic Mute** | Toggle mic mute. Optional animated audio level rings (configurable `showLevel`). | 切换麦克风静音。可选实时音频电平动画环（`showLevel` 可配）。 |
| **Audio Out** | Switch audio output device. Tap = picker popup, long-press = cycle next. | 切换音频输出设备。点击 = 弹出选择器，长按 = 轮换下一个。 |
| **Audio In** | Switch audio input device. Same tap/hold behavior as Audio Out. | 切换音频输入设备。点击/长按行为同 Audio Out。 |

### 🪟 Window / 窗口类

| Widget | EN | CN |
|--------|----|----|
| **Window Switcher** | Visual switcher with real-time window thumbnails. Grouped by app, horizontal scroll. Tap any window to focus. | 可视化切换器，实时窗口缩略图。按应用分组，横向滚动。点击聚焦任意窗口。 |
| **Window Click** | Five-zone click pad: fullscreen, top-half, bottom-half, left-half, right-half. Instant window tiling. | 五区域点击板：全屏、上半、下半、左半、右半。即时窗口贴靠。 |
| **Window Swipe** | Joystick-style gesture pad. Swipe to snap edges, tap to maximize/restore, long-press for fullscreen. | 摇杆式手势板。滑动贴边，点击最大化/恢复，长按全屏。 |
| **Fullscreen** | Toggle browser fullscreen (pure frontend, no backend call). | 切换浏览器全屏（纯前端，无后端调用）。 |

### ⚡ System / 系统类

| Widget | EN | CN |
|--------|----|----|
| **Dock Panel** | macOS Dock simulation — launch/quit apps from tablet. Detects running state. | macOS Dock 模拟——从平板启动/退出应用。检测运行状态。 |
| **Switch Profile** | One-tap profile switch. Long-press shows profile picker. Configurable icon, color, label visibility. | 一键切换 Profile。长按显示选择器。可配图标、颜色、标签显隐。 |
| **Balance** | DeepSeek API credit balance display. Auto-refresh every 30s. Tap to force refresh. | DeepSeek API 余额显示。每 30 秒自动刷新。点击强制刷新。 |

---

## 🎨 Editor / 可视化编辑器

在 Mac 上打开 `http://localhost:8082/editor`（Safari 或 Chrome）：

- **拖拽布局** — 从右侧组件库拖到无限画布
- **自由定位** — 无强制对齐网格，像素级精度
- **深度定制** — 每个组件的颜色、尺寸、字体、圆角、音效、图标、标签
- **多选操作** — 框选、成组、复制粘贴（内部剪贴板）
- **撤销/重做** — 完整历史栈，放心试
- **设备预设** — iPad / Android 平板比例一键适配画布
- **滚轮缩放** — 缩放视角不改变内容实际尺寸
- **Profile 管理** — 保存/加载/导入/导出多套布局
- **窗口规则** — 打开特定 Mac App → 自动切换到对应 Profile 页面

---

## 🏗️ Architecture / 项目架构

```
tapflow/
├── server/                       # Python backend
│   ├── tray_app.py               ★ Entry point — menu bar + dashboard
│   ├── main.py                   FastAPI app + WebSocket + REST API
│   ├── input_engine.py           CGEvent keyboard/mouse injection
│   ├── ax_bridge.py              macOS Accessibility bridge (windows/menus)
│   ├── profile_manager.py        Profile JSON CRUD + window rules
│   ├── system_control.py         Volume / mute / audio device switching
│   ├── window_watcher.py         Foreground app change → auto-switch
│   ├── state.py                  AppState dataclass (shared mutable state)
│   └── routes_*.py               11 route modules (audio, mic, window, dock...)
│
├── client/                       # Frontend (zero framework)
│   ├── index.html                ★ Tablet control panel (WebSocket client)
│   ├── editor.html               ★ Visual panel editor (drag-drop layout)
│   ├── ipad/                     iPad-optimized JS modules
│   └── thumbnails/               Widget preview thumbnails (14 icons)
│
├── Default_Profile/              Bundled default profiles
├── docs/                         Design docs & architecture decisions
├── icons/                        App icon & menu bar icon
├── setup.py                      py2app packaging config
└── README.md
```

---

## 📦 Installation / 安装详解

### Requirements / 环境要求

| Requirement | Detail |
|------------|--------|
| **Mac** | Apple Silicon (arm64), macOS 15+ |
| **Tablet** | Any modern browser — iPad (Safari), Android (Chrome), etc. |
| **Network** | Same LAN — Mac and tablet on the same WiFi |

### Steps / 安装步骤

1. 从 [Releases](https://github.com/Alienwang1980/tapflow/releases) 下载 `Tapflow.dmg`
2. 打开 DMG，拖 `Tapflow.app` 到 `Applications`
3. 启动 Tapflow — 菜单栏出现图标
4. 按提示授予三项系统权限
5. 平板浏览器打开 `http://<Mac-IP>:8082`
6. Mac Safari 打开 `http://localhost:8082/editor` 定制面板

### Permissions / 权限说明

| Permission | Why Needed | Optional? |
|-----------|-----------|:---------:|
| Accessibility（辅助功能） | Inject keyboard/mouse events via CGEvent | **Required** |
| Screen Recording（屏幕录制） | Capture window thumbnails for switcher | **Required** |
| Microphone（麦克风） | Audio level display on Mic Mute widget | Optional |

### Auto-start / 开机自启

Tapflow 安装后自动注册 LaunchAgent (`com.tapflow.app`)，开机自启 + 崩溃自动重启。通过 launchd 启动确保 TCC 权限归因正确。

```bash
# 查看状态
launchctl list | grep tapflow

# 手动重启
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.tapflow.app.plist
```

---

## 🛠️ Tech Stack / 技术栈

| Layer | Tech | Notes |
|-------|------|-------|
| Web framework | FastAPI + Starlette | Async, WebSocket native |
| Real-time | WebSocket (uvicorn) | Single event loop, sync ops via `run_in_executor` |
| Input injection | Quartz CoreGraphics | `CGEvent` — keyboard, mouse, scroll |
| System bridge | PyObjC | AppKit, Quartz, Foundation, AVFoundation |
| Menu bar | pystray | `LSUIElement=True` (no Dock icon) |
| Discovery | zeroconf (mDNS) | Bonjour service advertisement |
| Packaging | py2app | arm64, Apple Development signed |
| Frontend | Vanilla HTML5 Canvas + JS | Zero framework, <200KB total |

---

## ❓ FAQ / 常见问题

### Q: 平板连不上？
确认 Mac 和平板在**同一 WiFi**，检查 Mac 防火墙是否放行 `:8082`。菜单栏图标下拉菜单会显示 Mac 当前 IP。

### Q: 按键没反应？
检查 **辅助功能** 权限：系统设置 → 隐私与安全性 → 辅助功能 → 确保 Tapflow 已勾选。

### Q: 窗口缩略图不显示？
检查 **屏幕录制** 权限：系统设置 → 隐私与安全性 → 屏幕录制 → 确保 Tapflow 已勾选。

### Q: 怎么添加自定义 Profile？
编辑器里做好布局 → 右上角 Save → 输入名字。也可以直接编辑 `~/Library/Application Support/Tapflow/profiles/` 下的 JSON 文件。

### Q: 支持 Windows / Linux 吗？
目前只支持 macOS（核心依赖 CGEvent + PyObjC）。Windows/Linux 需要替换输入注入层，暂不在路线图上。

### Q: 平板需要装 App 吗？
**不需要。**纯浏览器，零安装。iPad Safari、Android Chrome 都行。PWA 支持可添加到主屏幕。

### Q: 多个平板能同时连吗？
技术上可以（WebSocket 广播），但同一时间只有**一个活跃连接**的 touch 事件会被处理。多平板场景可用不同 Profile。

---

## 📄 License / 许可证

MIT — 随便用，随便改，随便分发。

---

> *Tap points. Flow keys. 触点成流。*
