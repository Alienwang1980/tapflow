# 🎛️ Tapflow / 点流

> *[Skip to English →](#english)*

> **物理键盘诞生于 1870 年代。150 多年了，你还在用那套交互逻辑控制你的电脑。**

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%2015%2B%20ARM64-silver?logo=apple" alt="platform">
  <img src="https://img.shields.io/badge/tablet-iPad%20%7C%20Android%20%7C%20any%20browser-blue" alt="device">
  <img src="https://img.shields.io/badge/tablet%20install-zero-brightgreen" alt="tablet: zero install">
  <img src="https://img.shields.io/badge/version-1.0.4-orange" alt="version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
</p>

---

# 中文

## 你的键盘，来自上个世纪

键盘是上个世纪创造出来用于打字的通用工具，大多数情况下它做得很好。但电脑的操作在演变，键盘需要承担一些新的角色：大量高频动作——切换窗口、调音频、启动应用——逐步演变成了快捷键，而且大多是组合键。而快捷键或鼠标多级菜单，并不总是最直观的。

加上个性化需求越来越高，这些快捷键虽然可以定制，键盘本身却不能改变——矛盾就显而易见了。这个早已被习以为常、被习惯忍受的问题，对大多数人来说，其实是一个很高的学习门槛。

![键盘](docs/images/tapflow-02.jpg)

快捷键的数量很容易超出记忆负担。`⌘⌥⇧K` 是什么？先回忆功能，再回忆键位，再让手指找过去——快捷键多到一定程度，这个过程就会打断思路。

这张 Mac 快捷键图还不完整，数量已经相当可观。

![Mac 快捷键](docs/images/tapflow-03.jpg)

如今的手机能认得你的脸，电脑能认得你的指纹，但你还在背快捷键来操作电脑。你的大脑——地球上最强的运算能力——用来背快捷键，简直是资源的浪费。

**然而，情况也有变化。**

如今 AI 时代，Vibe Coding 对键盘的需求反而降低了，对输入方式提出了新需求。市面上也出现了相应的产品，例如 Worklouder Creator Micro 2：

![Creator Micro 2](docs/images/tapflow-04.jpg)

![Creator Micro 2](docs/images/tapflow-05.jpg)

![Creator Micro 2](docs/images/tapflow-06.jpg)

这类产品仍然是实体按键：按键可以自定义，样子和大小却不会变。自定义多了以后，记住每个键的用途依然是个负担。

![自定义宏的负担](docs/images/tapflow-07.jpg)

另一类成熟产品是 Elgato Stream Deck：实体按键 + 小屏幕，体验不错，价格从千元级起步。

![Stream Deck](docs/images/tapflow-08.jpg)

我的做法是从一个小问题入手，做一个轻量的方案，和用户的需求一起成长。于是我做了这个：

![Tapflow](docs/images/tapflow-01.jpg)

## Tapflow：点流 —— 你的个性化控制层

Tapflow 不是要替代键盘，而是与键盘鼠标配合：把高频操作做成看得见的按钮，减少记忆负担。

![面板](docs/images/tapflow-10.jpg)

![面板](docs/images/tapflow-11.jpg)

一个可以完全定制的、用于操作电脑的输入界面。有一个运行在 macOS 上的服务端，平板通过网页端连接，仅此而已。并提供了一个用于定制的网页编辑器：

![编辑器](docs/images/tapflow-12.jpg)

你在编辑器里拖出按钮，每个按钮可以定义名字、颜色、尺寸、位置。改了功能，标签立刻跟着变——**看见即用，不用记**。

> 平板上的每一次触摸 → WebSocket 实时发送到 Mac → `CGEvent` 注入 macOS。延迟低到你感觉不到。

## 几个使用场景，感受一下

### 🎤 Vibe Coding 语音激活

![语音按钮](docs/images/tapflow-13.jpg)

你在用 Claude Code / Cursor 做 vibe coding，AI 在写代码，你要说下一段 prompt。

键盘上：找到语音输入快捷键（是哪个来着？）→ 按下去 → 说话 → 再按一下结束。

Tapflow 上：平板旁边有一个按钮，上面写着 **"🎤 说话"**。点一下，开始说。说完了，再点一下。

不是"少按了几个键"的问题，是**你不用打断思路去想那个快捷键是什么**的问题。

### 🕹️ 窗口排列 = 游戏手柄摇杆

![Window Swipe](docs/images/tapflow-14.jpg)

![Window Swipe 演示](docs/images/tapflow-window-swiper.gif)

macOS 的窗口贴靠功能很强——全屏、左半、右半、上半、下半。但触发方式呢？要么背快捷键，要么用鼠标拖到屏幕边缘。

Tapflow 的 **Window Swipe** 组件把它做成了一个**摇杆**：手指往上滑 → 窗口全屏。往左滑 → 贴左半。往右下滑 → 贴右下角。点一下最大化，长按全屏。跟打游戏一样——**排列窗口，根本不应该用快捷键**。

### 🖼️ 窗口缩略图，一眼切换

![Window Switcher](docs/images/tapflow-15.jpg)

`⌘Tab` 切窗口是盲猜——你只能看到 App 图标，看不到窗口内容。开了三个 VS Code 窗口？猜吧，看哪个是你想要的。

**Window Switcher** 把所有窗口的实时缩略图排出来，按应用分组，横向滑动。哪个窗口里有什么，看得一清二楚。点一下，切过去。

### 📱 Dock 上平板，屏幕更干净

![Dock Panel](docs/images/tapflow-16.jpg)

macOS 的 Dock 常年占着屏幕底下一排，隐藏了又不方便召唤。

把 **Dock Panel** 放到 iPad 上：从平板启动 App、退出 App。Mac 屏幕上的 Dock 可以隐藏起来——屏幕全部留给工作。

### 🔊 切音频设备？一眼就够了

![Audio Out](docs/images/tapflow-17.jpg)

会议室里要切 AirPods。工作室里要切外放。打游戏切耳机。

通常的做法：系统设置 → 声音 → 输出 → 找到设备 → 点一下。每次都这样。

Tapflow 的 **Audio Out** 组件：平板上一个按钮，点一下弹出所有设备列表，选一个。长按直接轮换。**一秒。**

### ⌨️ 把 iPad 变成一整个键盘

![完整面板](docs/images/tapflow-18.jpg)

平板屏幕足够大。在上面铺满按键、触控板、手势区、窗口摇杆——iPad 变成一块**完全按你的习惯定制的输入面板**。配合平板的物理键盘打字，触控面板处理一切其他操作。

甚至，你可以在面板上看 DeepSeek 的余额：

![余额组件](docs/images/tapflow-19.jpg)

按钮可以实时变化，就不只是输入指令，还能输出信息。

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
2. 首次打开：双击会弹「无法验证开发者」（当前版本为 ad-hoc 签名、未公证）→ 系统设置 → 隐私与安全性 → 点「仍要打开」→ 再点「打开」。只需一次，以后正常打开
3. 启动 Tapflow，按弹出的授权面板提示授予权限：

| 权限 | 用途 | 必须？ |
|------|------|:-----:|
| 辅助功能（Accessibility） | 注入键盘事件 | ✅ |
| 屏幕录制（Screen Recording） | 窗口缩略图 | ✅ |
| 麦克风（Microphone） | 音频电平显示 | ❌ |

4. （可选）在设置面板开启开机自启——launchd 守护，开机启动、崩溃自动拉起

**平板端（零安装）：**

5. 平板和 Mac 同一 WiFi → 浏览器打开 `http://<Mac-IP>:8082`
6. Mac 上打开 `http://localhost:8082/editor`，拖几个按钮，保存

把平板放在键盘旁边。该干嘛干嘛。

## 定位与现状

需要说明的是：我从未打算让它替代键盘——打字这类任务，键盘依然是最合适的工具。Tapflow 的定位是与键盘鼠标配合，分担高频操作，提升效率。当然，也有用户告诉我，在特定场景下他们几乎不再碰键盘——这是意外的使用方式，不是设计目标。

目前刚做了第一个版本，目的只是验证这个想法是不是有用，或者说我自己的需求有没有普遍性。还有很多不完善的地方，欢迎提出你的想法和意见！

## FAQ

<details>
<summary><b>打开时提示「无法验证开发者」？</b></summary>
当前版本为 ad-hoc 签名（未公证），Gatekeeper 会软拦截一次。系统设置 → 隐私与安全性 → 点「仍要打开」即可，只需设置一次，以后正常打开。
</details>

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
