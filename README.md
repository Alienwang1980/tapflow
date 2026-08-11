# 🎛️ Tapflow / 点流

> *[Skip to English →](#english)*

> **物理键盘诞生于 1870 年代。150 多年了，你还在用那套交互逻辑控制你的电脑。**

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%2015%2B%20ARM64-silver?logo=apple" alt="platform">
  <img src="https://img.shields.io/badge/tablet-iPad%20%7C%20Android%20%7C%20any%20browser-blue" alt="device">
  <img src="https://img.shields.io/badge/tablet%20install-zero-brightgreen" alt="tablet: zero install">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
</p>

---

# 中文

## 你的键盘，来自上个世纪

键盘是一个"通用工具"——它被设计来让**任何人**都能打字，而不是让**你**高效地操控你的电脑。

100 多个键，每一个长得差不多。快捷键全靠脑子记。`⌘⌥⇧K` 是什么？你得先回忆它的功能，再回忆它的键位，再让手指找过去。你的大脑——这台地球上最强大的生物计算机——在被当成快捷键备忘录来用。

**识别、记忆、回忆。** 这不是思考，这是浪费。

都 2026 年了。你的手机认得你的脸。你的 Mac 认得你的指纹。但你控制电脑的方式，还停留在**背键位**。

如果你还没有一套**为自己量身定制的控制方式**——你就还停留在上个世纪。

## Tapflow：你的个性化控制层

Tapflow 的思路不是做一个"更好的键盘"。而是让你**不用脑子记**。

你在编辑器里拖几个按钮出来。每个按钮有自己的**名字、颜色、尺寸、位置**。你不需要回忆它是什么——你一眼就看到了。改了功能？标签立刻跟着变。换了一个应用？自动切一套布局。

**你的大脑只负责"识别"，不用负责"记忆"。**

```
┌──────────────────────────┐       HTTP + WebSocket        ┌────────────────────────┐
│  任何带浏览器的设备        │ ◄─────────────────────────── │  Mac (装 Tapflow.app)  │
│  iPad · Android · 手机    │       局域网 :8082            │                        │
│                          │                               │  CGEvent 注入           │
│  打开网页就是控制面板      │  触摸事件 / Profile 实时同步   │  系统音频 / 窗口管理    │
│  零安装，零配置            │                               │  菜单栏常驻             │
└──────────────────────────┘                               └────────────────────────┘
```

> 平板上的每一次触摸 → WebSocket 实时发送到 Mac → `CGEvent` 注入 macOS。延迟低到你感觉不到。

## 几个使用场景，感受一下

### 🎤 Vibe Coding 语音激活

你在用 Claude Code / Cursor 做 vibe coding。AI 在写代码，你要说下一段 prompt。

键盘上：找到语音输入快捷键（是哪个来着？）→ 按下去 → 说话 → 再按一下结束。

Tapflow 上：iPad 旁边有一个按钮，上面写着 **"🎤 说话"**。点一下，开始说。说完了，再点一下。

不是"少按了几个键"的问题。是**你不用打断思路去想那个快捷键是什么**的问题。

### 🕹️ 窗口排列 = 游戏手柄摇杆

macOS 的窗口贴靠功能很强——全屏、左半、右半、上半、下半。但触发方式呢？要么背快捷键，要么用鼠标拖到屏幕边缘。

Tapflow 的 **Window Swipe** 组件把它做成了一个**摇杆**。

手指在平板上往上滑 → 窗口全屏。往左滑 → 贴左半。往右下滑 → 右下角。就跟打游戏一样。点一下最大化，长按全屏。

**排列窗口这件事，根本就不应该用快捷键。**

### 🖼️ 窗口缩略图，一眼切换

`⌘Tab` 切窗口是盲猜——你只能看到 App 图标，看不到窗口内容。开了三个 VS Code 窗口？猜吧，看哪个是你想要的。

**Window Switcher** 把所有窗口的实时缩略图排出来。按应用分组，横向滑动。哪个窗口里有什么，看得一清二楚。点一下，切过去。

### 📱 Dock 上平板，屏幕更干净

macOS 的 Dock 长年占着屏幕底下一排。隐藏了又不方便。

把 **Dock Panel** 放到 iPad 上。从平板启动 App、退出 App。Mac 屏幕上的 Dock 直接隐藏——每一寸屏幕都留给你的工作。

### ⌨️ 把 iPad 变成一整个键盘

平板屏幕足够大。在上面铺满按键、触控板、手势区、窗口摇杆——你的 iPad 就是一块**完全按你的习惯定制的输入面板**。

配合平板的物理键盘打字，触控面板处理一切操作。这不是在键盘上"加按钮"，这是**完全按你自己的方式重新设计输入**。

### 🔊 切音频设备？一眼就够了

会议室里要切 AirPods。工作室里要切外放。打游戏切耳机。

通常的做法：系统设置 → 声音 → 输出 → 找到设备 → 点一下。每次都这样。

Tapflow 的 **Audio Out** 组件：平板上一个按钮，点一下弹出所有设备列表，选一个。长按直接轮换。**一秒。**

### 🔄 换应用，自动换一套按钮

VS Code 里需要的快捷键，和 Photoshop 里需要的，完全是两套东西。

Tapflow 的 **Profile 系统**：每个应用一套布局。切到 VS Code → 自动加载 coding 面板。切到 Figma → 自动加载 design 面板。不用手动切换。

## 14 种组件，只放你需要的

### ⌨️ 输入

| 组件 | 一句话 |
|------|--------|
| **Key** | 普通按键。标签写什么，它就干什么。点按 / 长按连发 / Turbo。 |
| **Macro** | 组合键宏。`⌘⇧A` 这种多键组合，一下触发。 |
| **Text Macro** | 文字宏。录一段文本，点一下逐字回放。 |
| **Touch Pad** | 触控板。在平板上滑 = Mac 触控板。 |

### 🔊 音频

| 组件 | 一句话 |
|------|--------|
| **Volume** | 音量滑块。横竖都行。点一下静音。 |
| **Mic Mute** | 麦克风开关。可选实时电平动画——开会前扫一眼。 |
| **Audio Out / In** | 音频设备切换。点 = 弹出列表，长按 = 轮换。 |

### 🪟 窗口

| 组件 | 一句话 |
|------|--------|
| **Window Switcher** | 实时缩略图，按应用分组，横滑切换。 |
| **Window Click** | 五点按板：全屏 / 上半 / 下半 / 左半 / 右半。 |
| **Window Swipe** | 摇杆式手势。滑哪贴哪。 |
| **Fullscreen** | 浏览器全屏切换。 |

### ⚡ 系统

| 组件 | 一句话 |
|------|--------|
| **Dock** | macOS Dock 放平板上。启动/退出 App，屏幕更干净。 |
| **Switch Profile** | 一键切 Profile。换应用自动切布局。 |
| **Balance** | DeepSeek API 余额，30 秒刷新。 |

## 编辑器：拖就完了

Mac 上打开 `http://localhost:8082/editor`：

- **拖拽布局** — 组件库拖到画布，所见即所得
- **深度定制** — 颜色、尺寸、字体、圆角、音效、图标、标签
- **框选成组** — 多选、组合、复制——像 Figma 一样
- **无限撤销** — 放心试
- **设备预设** — iPad / Android 比例一键适配
- **滚轮缩放** — 放大细节，缩小全局

## 5 分钟上手

**Mac 端（需要安装）：**

1. 从 [Releases](https://github.com/Alienwang1980/tapflow/releases) 下载 DMG → 拖入 `/Applications`
2. 启动 Tapflow，按提示授予三项权限：

| 权限 | 用途 | 必须？ |
|------|------|:-----:|
| 辅助功能（Accessibility） | 注入键盘事件 | ✅ |
| 屏幕录制（Screen Recording） | 窗口缩略图 | ✅ |
| 麦克风（Microphone） | 音频电平显示 | ❌ |

3. 安装后自动注册 LaunchAgent，开机自启 + 崩溃重启

**平板端（零安装）：**

4. 平板和 Mac 同一 WiFi → 浏览器打开 `http://<Mac-IP>:8082`
5. Mac 上打开 `http://localhost:8082/editor`，拖几个按钮，保存

把平板放旁边。该干嘛干嘛。

## FAQ

<details>
<summary><b>平板连不上？</b></summary>
确认同一 WiFi。菜单栏图标下拉显示 Mac IP。检查防火墙放行 8082。
</details>

<details>
<summary><b>按键没反应？</b></summary>
系统设置 → 隐私与安全性 → 辅助功能 → 确保 Tapflow 已勾选。
</details>

<details>
<summary><b>窗口缩略图不显示？</b></summary>
系统设置 → 隐私与安全性 → 屏幕录制 → 确保 Tapflow 已勾选。
</details>

<details>
<summary><b>平板要装 App 吗？</b></summary>
不。浏览器打开网页即可。支持 PWA 添加到主屏幕。
</details>

<details>
<summary><b>支持 Windows / Linux？</b></summary>
目前仅 macOS（核心依赖 CGEvent + PyObjC）。
</details>

## License

MIT

> *你的大脑不该用来记快捷键。把它放在屏幕上。*

---

# English {#english}

> **The keyboard you're using was designed before the light bulb. It's time for a control surface built around *you*.**

## Your Keyboard Belongs to the 19th Century

The QWERTY keyboard was designed in the 1870s. For typewriters. And yet — 150 years later — you're still using that same generic grid of identical keys to control a machine that can generate code, render 3D scenes, and run AI models in real time.

A keyboard is a **general-purpose tool**. It was built so *anyone* could type, not so *you* could be efficient. 100+ identical keys. Shortcuts you have to memorize. `⌘⌥⇧K` — what does that even do? Your brain — the most powerful computer on the planet — is being used as a **shortcut lookup table**.

**Recognize. Recall. Reach.** That's not thinking. That's overhead.

It's 2026. Your phone unlocks with your face. Your Mac reads your fingerprint. But your input device still expects you to memorize key combinations designed decades before you were born.

If you don't have a control surface tailored to *your* workflow — you're still operating with last-century logic.

## Tapflow: Your Personal Control Layer

Tapflow isn't a "better keyboard." It's a different category entirely.

Instead of memorizing shortcuts, you **see** them. You drag a button onto a canvas. It has a name, a color, a position. You don't recall what it does — you read the label. Change its function? The label updates instantly. Switch to a different app? The entire layout switches with you.

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

## Scenarios, Not Feature Lists

### 🎤 One-Tap Voice Input for Vibe Coding

You're vibe coding with Claude Code, Cursor, or Windsurf. AI is generating. You need to speak your next prompt.

With a keyboard: find the voice input shortcut (was it `⌃Space`? `F5`?) → press it → speak → press again to stop.

With Tapflow: on your iPad, there's a button labeled **"🎤 Talk"**. Tap. Speak. Tap again.

It's not about saving two keystrokes. It's about **never breaking your train of thought** to remember how to start talking.

### 🕹️ Window Tiling as a Joystick

macOS has excellent window snapping — fullscreen, left half, right half, top, bottom. But triggering it means memorizing keyboard shortcuts or dragging with a mouse.

Tapflow's **Window Swipe** widget turns window management into a **joystick**.

Swipe up on your iPad → fullscreen. Swipe left → snap left. Swipe bottom-right → bottom-right corner. Tap to maximize. Long-press for fullscreen. It feels like a game controller, because **arranging windows shouldn't require a keyboard at all.**

### 🖼️ Window Thumbnails — See Before You Switch

`⌘Tab` is blind guessing. You see app icons, not window contents. Three VS Code windows open? Good luck finding the right one.

**Window Switcher** shows live thumbnails of every window, grouped by app, horizontally scrollable. You see exactly what's in each window before you switch. Tap the one you want.

### 📱 Dock on Your Tablet, Screen on Your Work

macOS Dock takes up the bottom of your screen. Hide it and it's annoying to summon. Keep it and you lose pixels.

Put the **Dock Panel** on your tablet instead. Launch apps, quit apps — from your iPad. Your Mac screen hides the Dock. Every pixel goes to your work.

### ⌨️ iPad as Your Entire Keyboard

A tablet screen is big enough. Fill it with keys, a touchpad, gesture pads, window joysticks — your iPad becomes an **input surface designed entirely around your habits**.

Type on a physical keyboard. Control everything else on the panel. This isn't adding buttons to a keyboard. This is **redesigning input from the ground up, for yourself.**

### 🔊 Switch Audio Devices in One Second

AirPods for a meeting. Studio monitors for music. Gaming headset. Switching means: System Settings → Sound → Output → find device → click. Every. Single. Time.

Tapflow's **Audio Out** widget: one button shows all devices. Tap to pick. Long-press to cycle. **One second.**

### 🔄 Switch Apps, Auto-Switch Your Panel

The shortcuts you need in VS Code are completely different from what you need in Photoshop.

Tapflow's **Profile system** gives each app its own layout. Switch to VS Code → coding panel loads automatically. Switch to Figma → design panel loads. No manual switching. No context collapse.

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
2. Launch Tapflow. Grant the permissions:

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

## FAQ

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
