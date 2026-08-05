# Smart Touch Panel — 项目全貌 & 进度

> 最后更新: 2026-08-05 | 版本: 1.2.0

## 一句话描述

**Smart Touch Panel** 是一个 macOS 菜单栏应用。在 Mac 上启动 HTTP + WebSocket 服务（端口 8082），iPad 通过局域网浏览器连接，将 iPad 屏幕变成可自定义的虚拟触控面板。所有触摸操作通过 Quartz CoreGraphics `CGEvent` 注入 macOS，模拟键盘/鼠标输入。

---

## 项目结构

```
smart-touch-panel/
├── server/                  # Python 后端（FastAPI + WebSocket）
│   ├── tray_app.py          ★ 入口 — 菜单栏图标 + 全部 API 路由 + 服务器启动
│   ├── main.py              FastAPI app 创建 + WebSocket 主循环 + 静态文件
│   ├── input_engine.py      CGEvent 键盘/鼠标注入引擎
│   ├── profile_manager.py   面板配置文件的 CRUD + 窗口自动切换
│   ├── connection_manager.py WebSocket 连接池管理
│   ├── editor_app.py        打开编辑器（浏览器）
│   ├── ax_bridge.py         窗口/标签页枚举（CGWindowList + osascript）
│   ├── system_control.py    音量/静音/音频设备/窗口管理
│   ├── window_watcher.py    前台应用切换监听
│   ├── balance_poller.py    DeepSeek API 余额轮询
│   ├── widget_extension.py  备用 Widget 路由（实际路由在 tray_app.py 内联）
│   ├── profiles/            面板配置文件（JSON）
│   └── certs/               TLS 自签名证书
│
├── client/                  前端（纯 HTML/JS，无框架）
│   ├── index.html           ★ iPad 主面板（Canvas 渲染 + WebSocket）
│   ├── editor.html          ★ 面板编辑器（拖拽布局、属性编辑、按键绑定）
│   ├── thumbnails/          12 个 Widget 缩略图（240×112 2x Retina PNG）
│   ├── icon-preview.html    图标设计预览
│   ├── fonts/               像素字体（PressStart2P, Russo One, VT323）
│   └── *.svg                音频图标（voice, volume-mute 等）
│
├── tools/
│   ├── generate_icons.py    图标生成（7×7 点阵 AppIcon + 5×5 菜单栏图标）
│   └── build.py             ⚠️ 已废弃（会覆盖权威 HTML，别用）
│
├── bin/
│   └── SwitchAudioSource    arm64 二进制，音频设备切换
│
├── icons/
│   ├── AppIcon.icns         App 图标
│   └── stp_menubar_icon.png 菜单栏图标（44×44，白色 5×5 点阵）
│
├── setup.py                 py2app 打包配置
├── start.sh                 手动启动入口
├── keep_alive.sh            守护脚本（30s pgrep）
├── CONTEXT.md               项目圣经（详细架构文档）
├── PROJECT_STATUS.md        本文件 — 项目进度 & 待办
├── docs/                    历史计划/设计文档
├── logs/                    运行日志（gitignore）
└── dist/                    构建产物（gitignore）
```

---

## Widget 类型总览（13 种）

| # | type | 名称 | 默认尺寸 | action | 说明 |
|---|------|------|---------|--------|------|
| 1 | `key` | Regular Key | 1.25×1.25 | turbo | 普通按键，支持 hold/turbo/macro |
| 2 | `touchpad` | Touch Pad | 4×3 | touchpad | Mac 触控板模拟（单指移动/双指滚动） |
| 3 | `volume` | Volume Slider | 2.5×1.25 | volume | 系统音量滑块（横/竖） |
| 4 | `micmute` | Mic Mute | 2.5×1.25 | mic-mute | 麦克风静音 + 电平显示 |
| 5 | `audioout` | Audio Out | 3.25×1.25 | audio-out | 输出设备切换（tap=菜单/hold=轮换） |
| 6 | `audioin` | Audio In | 3.25×1.25 | audio-in | 输入设备切换 |
| 7 | `activeapp` | Window Switcher | 9.25×3 | active-app | 应用窗口缩略图切换器 |
| 8 | `winshortcuts` | 窗口控制·点击 | 4×2 | win-shortcuts | 五方块窗口贴靠 |
| 9 | `wingesture` | 窗口控制·滑动 | 3.5×3.25 | win-gesture | 摇杆式窗口控制 |
| 10 | `fullscreen` | Fullscreen Toggle | 1.5×1.25 | fullscreen | iPad 浏览器全屏切换（纯前端） |
| 11 | `dock` | Dock Panel | 9.25×1.5 | dock | macOS Dock 模拟（启动/退出 App） |
| 12 | `switchprofile` | Switch Profile | 1.5×1.25 | switch-profile | 切换 Profile（⇄ 图标+名称两行布局） |
| 13 | `balance` | Deepseek Balance | 3.5×1.25 | balance | DeepSeek API 余额显示 |

---

## API 端点一览

### Profile
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/active-profile` | 获取当前活跃 Profile |
| POST | `/api/active-profile` | 设置活跃 Profile |

### 系统音量
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/system/volume` | 获取输出/输入音量 |
| POST | `/api/system/volume` | 设置输出音量 |
| POST | `/api/system/mute` | 切换输出静音 |
| POST | `/api/system/mic-mute` | 切换输入静音 |
| POST | `/api/system/mic-volume` | 设置输入音量 |

### 音频设备
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/system/audio-devices` | 列出音频设备 |
| POST | `/api/system/audio-output` | 切换输出设备 |
| POST | `/api/system/audio-input` | 切换输入设备 |
| POST | `/api/system/audio-output/cycle` | 轮换输出设备 |
| POST | `/api/system/audio-input/cycle` | 轮换输入设备 |

### 麦克风监控
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/system/mic-level` | 获取实时麦克风电平 |
| GET/POST | `/api/system/mic-monitor` | 启动/停止电平监控流 |

### 窗口管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/system/all-windows` | 所有应用窗口列表（含缩略图） |
| GET | `/api/system/current-app` | 当前前台应用 |
| GET | `/api/system/current-app-windows` | 当前应用窗口 |
| GET | `/api/system/window-thumbnail` | 窗口缩略图 JPEG |
| POST | `/api/system/focus-window` | 聚焦到指定窗口 |
| POST | `/api/system/window/fullscreen` | 全屏（ctrl+cmd+f） |
| POST | `/api/system/window/minimize` | 最小化（cmd+m） |
| POST | `/api/system/window/mission-control` | Mission Control |
| POST | `/api/system/window/show-desktop` | 显示桌面 |
| POST | `/api/system/window/arrange` | 窗口贴靠（左/右/顶/底/填充） |
| POST | `/api/system/window/tile` | 窗口平铺 |

### Dock / App 启动
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/system/dock-items` | Dock 中 App 列表 |
| GET | `/api/system/app-icon` | App 图标 |
| POST | `/api/system/launch-app` | 启动 App |
| POST | `/api/system/quit-app` | 退出 App |
| POST | `/api/system/execute-shortcut` | 执行快捷指令 |

### 菜单栏 / 布局
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/system/current-menus` | 当前应用菜单栏 |
| GET/POST | `/api/system/layouts` | 布局预设管理 |
| POST | `/api/system/layouts/apply` | 应用布局预设 |

### 权限 & 诊断
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/system/accessibility` | 辅助功能权限 |
| GET/POST | `/api/system/mic-permission` | 麦克风权限 |
| GET/POST | `/api/system/screen-capture` | 屏幕录制权限 |
| GET | `/api/deepseek/balance` | DeepSeek API 余额查询 |

---

## 架构要点

```
┌─────────────────────┐      HTTP/WS       ┌──────────────────────┐
│   iPad 浏览器         │ ←───────────────→ │  Mac (STP Server)    │
│   index.html          │   局域网 :8082     │  tray_app.py         │
│                       │                    │                      │
│   · Canvas 渲染 Widget │                    │  · 菜单栏图标 (pystray)│
│   · WebSocket 实时通信  │                    │  · NSPanel 设置面板   │
│   · 浏览器全屏 API      │                    │  · 全部 API 路由 (内联)│
└─────────────────────┘                      └──────────┬───────────┘
                                                         │
┌─────────────────────┐                            CGEvent 注入
│   iPad / Mac 浏览器   │                      ┌──────────┴───────────┐
│   editor.html         │                      │  macOS 系统          │
│                       │                      │  · 键盘/鼠标事件     │
│   · 拖拽布局编辑        │                      │  · 音量/静音控制     │
│   · Widget 属性面板     │                      │  · 窗口管理          │
│   · Profile 管理       │                      └──────────────────────┘
└─────────────────────┘
```

### 坐标系统（editor）

```
carea (flexbox 居中 cwrap)
  └── cwrap: transform="translate(viewX, viewY) scale(fitScale * viewZoom)"
       └── keys 定位在 wrap 坐标系内 (canvasX + col*cellSize, canvasY + row*cellSize)
```

- `viewX/viewY`: CSS translate 偏移（右键拖拽临时平移，刷新后重置为 0）
- `panX/panY`: keys 在 wrap 内的内容偏移（保存为 canvasX/canvasY）
- `_totalScale() = _fitScale() * viewZoom`
- `_viewOrigin()`: 计算 carea 到 wrap 视觉原点的偏移

### 前端渲染（index.html）

- 每个 Widget 渲染为 `<div.key-btn>` + 内部 `<canvas>`
- Canvas 上绑 `touchstart`（stopPropagation），避免触发 document 级通用按键处理
- 特殊 action（volume/mic-mute/win-gesture/dock 等）有专属 Canvas 绘制函数和 touch 处理
- fullscreen widget 调用浏览器原生 `requestFullscreen()` / `exitFullscreen()`

---

## 最近改动

### 2026-08-05

| 提交 | 内容 |
|------|------|
| `87f0a0a` | **fix**: bgOpacity 推广到全部 widget（复用 Dock 模式）— Editor 通用 CSS bgOpacity + canvas fillRect globalAlpha；Dashboard 通用 CSS bgOpacity + _kcrgba rgba 预计算；0% 设 `transparent` 而非 `rgba(...,0)` |
| `4cfb571` | **feat**: bgOpacity 滑块加在通用属性面板和 win-ctrl 面板（后被 87f0a0a 修复替换） |
| `faaac76` | **revert**: 撤回 bgTransparent 方案（改用 bgOpacity） |
| `3ac26be` | **style**: 颜色选择器改为 30×30 正方形深色背景；pagePatColor 单起一行加 "Pat Color" 标签 |
| `5e65de6` | **refactor**: 23 个自定义 showCP 色板全部替换为原生 `<input type=color>` |

### 2026-08-04

| 提交 | 内容 |
|------|------|
| `a51b70a` | **fix**: fullscreen 图标/文字居中；switch-profile 改为 canvas 两行布局（⇄上+名称下）；新增 showIcon/showLabel/iconColor |
| `5219558` | **fix**: fullscreen 图标/文字居中修复；属性面板加 showIcon/showLabel 开关 |
| `eb9245d` | **fix**: fullscreen widget 改为浏览器全屏 API（纯前端，不调后端） |
| `4cf41d1` | **feat**: 新增 Fullscreen Toggle widget 模块 |
| `fd06fa3` | **fix**: profile 加载时重置 viewX/viewY=0（临时平移不持久化） |

### 更早（2026-07 ~ 2026-08-03）

| 提交 | 内容 |
|------|------|
| `d3475ad` | **fix**: _viewOrigin 用 fitScale 而非 totalScale → 框选错位 |
| `7a88ca7` | **refactor**: 删除 Audio Visualizer（无音频管线，占位代码） |
| `8a15225` | **fix**: WIDGET_TYPES 默认 label、补充 switchprofile 到 Key Type Modal |
| `32595c2` | **refactor**: WIDGET_TYPES 默认值与 vibe profile (Apple.json) 对齐 |
| `63e18b1` | **refactor**: Button Library 文字预览 → 图片缩略图；移除 app-menu / layout-preset |
| `e556ee7` | **fix**: Save & Sync 按钮背景色从 #9b8c5a 改为 #6b5c30（WCAG AA 对比度） |
| `bb5657e` | **refactor**: iconScale/fontScale（float ratio）→ iconSize/fontSize（int px） |
| `b13f7f1` | **fix**: iconSize/fontSize 加入 addKeyOfType；fontSize stepper 浮点精度修复 |

---

## 当前待办

| # | 需求 | 状态 | 涉及文件 |
|---|------|------|---------|
| 1 | **Editor 滚轮缩放锚定光标** — 滚轮改 viewZoom 时以光标位置为缩放中心 | ✅ 已实现 | `editor.html` |
| 2 | **Editor 右键拖拽平移视角** — 替代 Space+拖拽 | ✅ 已实现 | `editor.html` |
| 3 | **Profile 按钮图标/文字两行** — switch-profile 两行布局 | ✅ 已实现 | `index.html` |
| 4 | **图标显隐开关** — 设置面板加 showIcon/showLabel | ✅ 已实现 | `editor.html` + `index.html` |
| 5 | **Editor 框选修复** — _viewOrigin 坐标错位 | ✅ 已修复 | `editor.html` |
| 6 | **Fullscreen widget** — iPad 浏览器全屏切换按钮 | ✅ 已实现 | `editor.html` + `index.html` |
| 7 | **通用 bgOpacity** — 所有 widget 背景透明度（复用 Dock 模式） | ✅ 已实现 | `editor.html` + `index.html` |
| 8 | **STP Profile 按钮图标文字分行 + 图标显隐开关** | 📋 待实现 | `index.html` |
| 9 | **STP Editor 滚轮缩放视角** | 📋 待实现 | `editor.html` |

---

## 关键约束（备忘）

| 约束 | 说明 |
|------|------|
| `client/index.html` 和 `editor.html` 是权威源 | 直接改这两个文件，不要跑 `tools/build.py`（会覆盖） |
| Port 8082 硬编码 | plist / 前端 / 逻辑三处硬编码，改端口需同步 |
| API 路由在 `tray_app.py` 内联 | `widget_extension.py` 是备用，实际路由在 `run_server()` 里 |
| 服务端从源码目录运行 | `start.sh` 跑 `server/tray_app.py`，不是 app bundle |
| 运行 App 在 `/Applications/` | 非 `dist/`！修改后必须 cp 到 `/Applications/Smart Touch Panel.app/Contents/Resources/client/` |
| 重打包 → 新 cdhash → TCC 重授权 | 先 `tccutil reset` 再重授权 |
| Editor 必须在 Safari 打开 | 其他浏览器没有原生 `<input type=color>` |
| py2app 用 server/venv 的 Python | 不能用 `.venv`（缺少 AVFoundation/PyObjC） |
| py2app site_packages=False 必须 | 否则 venv 绝对路径烧进 `__boot__.py` → launchd 挂死 |
| 服务器启动慢（~15s） | 菜单栏图标出现不代表服务就绪 |

---

## 环境信息

- **设备**: Mac mini (Apple Silicon, macOS 25 Sequoia)
- **Python**: 3.12 (server/venv) / 3.14 (系统)
- **局域网 IP**: 192.168.2.20
- **Git 远端**: NAS `192.168.2.62:/volume1/Git_Station/smart-touch-panel.git`
- **签名**: Apple Development, `50035AAD0722786A4C024087383B654504F75C33`, Team `7F246MKBN2`
