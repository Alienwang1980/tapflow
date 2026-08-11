# 🎛️ Tapflow / 点流

> **你上一次忘记自己设的快捷键，是什么时候？**
> *When was the last time you forgot your own keyboard shortcut?*

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%2015%2B%20ARM64-silver?logo=apple" alt="platform">
  <img src="https://img.shields.io/badge/device-iPad%20%7C%20Android%20%7C%20any%20browser-blue" alt="device">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license">
  <img src="https://img.shields.io/badge/tablet%20install-zero-brightgreen" alt="zero install">
</p>

---

## 😤 你的键盘，一直在骗你
### *Your Keyboard Is Gaslighting You*

你的键盘上有 100 多个键。你真正每天用到的，不超过 15 个。

剩下的呢？有的是你**根本不知道存在**的快捷键。有的是你**曾经设过、两天后就忘了**的宏键——因为键帽上什么都没写，它不会告诉你它是干嘛的。

`⌘⌥⇧K` —— 这不是快捷键，这是手指瑜伽。换个应用，快捷键体系全变了：VS Code 里的 `⌘K ⌘S`，到了 JetBrains 变成了 `⌘,`。你背得过来吗？

**这不是你的问题。** 键盘这种东西，诞生于打字机时代。它从来不是被设计来"让你记住快捷键"的。

---

## 💡 所以 Tapflow 干了一件很简单的事
### *One Simple Thing*

**把那些你记不住的快捷键，变成平板上看得见、点得到的按钮。**

每个按钮**有自己的名字**，一眼就知道它是干嘛的。改了功能，标签**立刻跟着变**。你不用背，不用猜，不用翻 cheat sheet。

它不替代你的键盘——键盘还是用来打字。它替代的是**你大脑里那个不靠谱的"快捷键记忆区"**。

```
┌──────────────────────────┐       HTTP + WebSocket        ┌────────────────────────┐
│  任何带浏览器的设备        │ ◄─────────────────────────── │  Mac (Tapflow.app)     │
│                          │       局域网 :8082             │                        │
│  iPad → 几十个按钮        │  触摸事件 / Profile 同步       │  CGEvent 注入           │
│  手机 → 三五个核心键      │                               │  系统音频 / 窗口管理    │
│  零安装，打开网页即用      │                               │  菜单栏常驻             │
└──────────────────────────┘                               └────────────────────────┘
```

> 平板上的每一次触摸 → WebSocket 实时发送到 Mac → `CGEvent` 注入 macOS → 就像 Mac 原生输入。延迟低到你感觉不到。

---

## 📱 你手里已经有一块触摸屏了
### *You Already Own a Touch Screen*

市面上有 Stream Deck、Loupedeck 这类硬件快捷键面板。$100–$250 一块，十几个物理按键，一块小屏幕。

但你抽屉里已经有一块 iPad。可能还有一部 6.7 寸的手机。

**它们都有触摸屏。它们都有浏览器。它们都能变成你的快捷键面板。**

不买硬件。不装 App。不占桌面。平板架在旁边，打开网页——这就是你的专属控制台。

而且，Stream Deck 只有 15 个键。iPad 上**你可以放 50 个**。

---

## 🧩 14 种组件。你需要几种？
### *14 Widgets. Pick Your Arsenal.*

不是让你全用。恰恰相反——**只放你需要的。**

### ⌨️ 按键类——快捷键的本质

| 组件 | 一句话 |
|------|--------|
| **Key** | 普通按键。标签写什么，它就干什么。点按 / 长按连发 / Turbo 急速。 |
| **Macro** | 组合键。`⌘⇧A` 这种多键组合，一下触发。不用练手指。 |
| **Text Macro** | 文字宏。录一段文本，点一下逐字回放。Unicode 全支持。 |
| **Touch Pad** | 触控板。在平板上滑手指 = Mac 触控板。移动、滚动、拖拽。 |

### 🔊 音频类——别再去设置里翻了

| 组件 | 一句话 |
|------|--------|
| **Volume** | 音量滑块。横的竖的都行。点一下静音。 |
| **Mic Mute** | 麦克风开关。可选实时电平动画环——开会前看一眼就知道麦开没开。 |
| **Audio Out / In** | 音频设备切换。点一下弹出设备列表，长按轮换下一个。 |

### 🪟 窗口类——窗口管理不用摸鼠标

| 组件 | 一句话 |
|------|--------|
| **Window Switcher** | 所有窗口 + 实时缩略图。按应用分组，横滑切换。点一个切一个。 |
| **Window Click** | 五区域点按：全屏 / 上半 / 下半 / 左半 / 右半。一键贴靠。 |
| **Window Swipe** | 摇杆式手势。滑到哪贴到哪，点按最大化，长按全屏。 |
| **Fullscreen** | 浏览器全屏切换。纯前端，不打扰后端。 |

### ⚡ 系统类——你的个人控制台

| 组件 | 一句话 |
|------|--------|
| **Dock** | macOS Dock 模拟。在平板上启动 / 退出 Mac App。跑着的应用会亮。 |
| **Switch Profile** | 一键切 Profile。长按弹出选择器。换应用自动切到对应布局。 |
| **Balance** | DeepSeek API 余额。每 30 秒自动刷新。再也不用打开网页查。 |

---

## 🖥️ iPad 当调音台，手机当遥控器
### *Tablet = Console. Phone = Remote.*

同一个 Web 应用，不同设备，不同密度。

- **iPad 大屏：** 铺满几十个按钮，密密麻麻像专业调音台。分组、分页、分 Profile——一个应用一套布局，切应用自动换。
- **手机小屏：** 只放三五个最核心的。拇指一够就着，裤兜里掏出来就能用。开会时手机切个音频设备、调个音量，不用碰电脑。

**这就是 Web 方案的灵活性——硬件面板做不到。**

---

## 🔥 Vibe Coding 的最后一公里
### *The Killer Use Case*

你在 Mac 上用 Claude Code / Cursor / Windsurf 做 vibe coding。AI 帮你写代码，你负责审查和决策。

这个过程中，你需要的快捷键其实就那几组：**运行、审查、提交、切换文件、调亮度、切歌**。

但问题是——它们散落在键盘各处，有些还是你临时设的。凌晨两点，vibe coding 正爽，突然想切个文件……快捷键是什么来着？翻 cheat sheet？上网搜？

**Tapflow 在这里的价值：**

1. 在编辑器里把常用操作**拖成按钮**，每个标清楚名字
2. iPad 架在旁边，**扫一眼就知道按哪**
3. 新的操作？随时加一个按钮，**标签即刻生效**
4. 换项目了？**切一个 Profile**，整套按钮全换

你的键盘写 prompt。你的 Tapflow 替你记住那些该死的快捷键。

---

## 🎨 编辑器的快乐
### *The Editor Is Fun*

Mac 上打开 `http://localhost:8082/editor`，一个完整的可视化编辑器：

- **拖就完了** —— 从组件库拖到画布，所见即所得
- **改什么都行** —— 颜色、尺寸、字体、圆角、音效、图标、标签
- **框选 + 成组 + 复制** —— 像 Figma 一样操作
- **无限撤销** —— 放心试，试不坏
- **设备预设** —— iPad / Android 比例一键适配
- **滚轮缩放** —— 放大看细节，缩小看全局
- **Profile 切换** —— 多套布局，换应用自动切

---

## 🚀 5 分钟，搭好你自己的面板
### *5-Minute Setup*

**Step 1.** 从 [Releases](https://github.com/Alienwang1980/tapflow/releases) 下载 DMG → 拖进 `/Applications`

**Step 2.** 启动 Tapflow，按提示授权三项权限：

| 权限 | 为什么需要 | 必须？ |
|------|----------|:-----:|
| 辅助功能（Accessibility） | 注入键盘事件 | ✅ |
| 屏幕录制（Screen Recording） | 窗口缩略图 | ✅ |
| 麦克风（Microphone） | 音频电平显示 | ❌ 可选 |

**Step 3.** 平板和 Mac 同一 WiFi → 浏览器打开 `http://<Mac-IP>:8082`

**Step 4.** Mac Safari 打开 `http://localhost:8082/editor` → 拖几个按钮 → 保存

**Step 5.** 把平板放旁边。开始 vibe coding。🎉

---

## 🏗️ 架构一览
### *Under the Hood*

```
tapflow/
├── server/                     # Python 后端
│   ├── tray_app.py             ★ 入口 — 菜单栏 + 仪表盘
│   ├── main.py                 FastAPI + WebSocket + REST
│   ├── input_engine.py         CGEvent 键盘/鼠标注入
│   ├── ax_bridge.py            macOS 辅助功能桥接
│   ├── profile_manager.py      Profile CRUD + 窗口规则
│   ├── system_control.py       音量 / 静音 / 音频设备
│   ├── window_watcher.py       前台应用检测 → 自动切 Profile
│   ├── state.py                AppState 共享状态
│   └── routes_*.py             11 个路由模块
│
├── client/                     # 前端 (零框架)
│   ├── index.html              ★ 平板控制面板
│   ├── editor.html             ★ 可视化编辑器
│   ├── ipad/                   iPad 优化 JS 模块
│   └── thumbnails/             组件预览缩略图
│
├── Default_Profile/            内置默认 Profile
├── docs/                       设计文档 & 架构决策
├── setup.py                    py2app 打包配置
└── README.md
```

| 技术层 | 选型 | 备注 |
|--------|------|------|
| Web 框架 | FastAPI + Starlette | 异步，原生 WebSocket |
| 实时通信 | WebSocket (uvicorn) | 单事件循环，同步操作走 `run_in_executor` |
| 输入注入 | Quartz CoreGraphics | `CGEvent` — 键盘、鼠标、滚轮 |
| 系统桥接 | PyObjC | AppKit, Quartz, Foundation, AVFoundation |
| 菜单栏 | pystray | `LSUIElement=True` 无 Dock 图标 |
| 服务发现 | zeroconf (mDNS) | Bonjour 广播 |
| 打包 | py2app | arm64，Apple Development 签名 |
| 前端 | Vanilla JS + Canvas | 零框架，总大小 < 200KB |

---

## ❓ FAQ

<details>
<summary><b>平板连不上？</b></summary>
确认同一 WiFi。菜单栏图标下拉会显示 Mac 当前 IP。检查防火墙是否放行 8082 端口。
</details>

<details>
<summary><b>按键没反应？</b></summary>
系统设置 → 隐私与安全性 → 辅助功能 → 确保 Tapflow 已打勾。
</details>

<details>
<summary><b>窗口缩略图不显示？</b></summary>
系统设置 → 隐私与安全性 → 屏幕录制 → 确保 Tapflow 已打勾。
</details>

<details>
<summary><b>平板要装 App 吗？</b></summary>
不。浏览器打开网页即可。Safari / Chrome 都行。支持添加到主屏幕（PWA）。
</details>

<details>
<summary><b>支持 Windows / Linux 吗？</b></summary>
目前只支持 macOS（核心依赖 CGEvent + PyObjC）。其他平台需要替换输入注入层。
</details>

<details>
<summary><b>怎么让 Tapflow 开机自启？</b></summary>
安装后自动注册 LaunchAgent（`com.tapflow.app`），开机自启 + 崩溃自动重启。
</details>

---

## 📄 License

MIT — 随便用，随便改，随便分发。

---

> *别背快捷键了。把它们放在屏幕上。*
> *Stop memorizing shortcuts. Put them on screen.*
