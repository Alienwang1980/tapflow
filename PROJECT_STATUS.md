# Smart Touch Panel — 项目全貌 & 进度

> 最后更新: 2026-08-04 | 版本: 1.0.0

## 一句话描述

**Smart Touch Panel** 是一个 macOS 菜单栏应用。在 Mac 上启动 HTTP + WebSocket 服务（端口 8082），iPad 通过局域网浏览器连接，将 iPad 屏幕变成可自定义的虚拟触控面板。所有触摸操作通过 Quartz CoreGraphics `CGEvent` 注入 macOS，模拟键盘/鼠标输入。

---

## 项目结构

```
smart-touch-panel/
├── server/                  # Python 后端（FastAPI + WebSocket）
│   ├── tray_app.py          ★ 入口文件（菜单栏图标 + 服务器 + 设置面板）
│   ├── main.py              FastAPI app + WebSocket 主循环 + 静态文件服务
│   ├── input_engine.py      CGEvent 键盘/鼠标注入引擎
│   ├── profile_manager.py   面板配置文件的 CRUD + 窗口自动切换
│   ├── connection_manager.py WebSocket 连接池管理
│   ├── editor_app.py        打开编辑器（浏览器）
│   ├── ax_bridge.py         窗口/标签页枚举（CGWindowList + osascript）
│   ├── system_control.py    音量/静音/音频设备/窗口管理
│   ├── window_watcher.py    前台应用切换监听
│   ├── balance_poller.py    DeepSeek API 余额轮询
│   ├── widget_extension.py  Widget 扩展路由
│   ├── profiles/            面板配置文件（JSON）
│   └── certs/               TLS 自签名证书
│
├── client/                  前端静态文件（纯 HTML/JS，无框架）
│   ├── index.html           ★ iPad 主面板（83KB，画布渲染 + WebSocket 客户端）
│   ├── editor.html          ★ 面板编辑器（161KB，拖拽布局、Widget 属性编辑、按键绑定）
│   ├── icon-preview.html    图标设计预览（draw5() 算法的权威参考）
│   ├── fonts/               像素字体（PressStart2P, Russo One, VT323）
│   └── *.svg                音频图标（voice, volume-mute 等）
│
├── tools/
│   ├── generate_icons.py    ★ 图标生成脚本（7×7 点阵 AppIcon + 5×5 菜单栏图标）
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
├── CONTEXT.md               项目圣经（详细架构文档）
├── docs/                    历史计划/设计文档
├── logs/                    运行日志（gitignore）
└── dist/                    构建产物（gitignore）
```

---

## 架构概览

```
┌─────────────────────┐      HTTP/WS       ┌──────────────────────┐
│   iPad 浏览器         │ ←───────────────→ │  Mac (STP Server)    │
│   client/index.html   │   局域网 :8082     │  server/tray_app.py  │
│                       │                    │  server/main.py      │
│   · 触控面板 UI        │                    │                      │
│   · WebSocket 实时通信  │                    │  · FastAPI REST API   │
│   · Canvas 渲染按键    │                    │  · WebSocket 双向通道  │
└─────────────────────┘                      │  · mDNS 服务发现      │
                                             │  · 菜单栏图标 (pystray)│
┌─────────────────────┐                      │  · NSPanel 设置面板   │
│   iPad / Mac 浏览器   │                      └──────────┬───────────┘
│   client/editor.html  │                                 │
│                       │                            CGEvent 注入
│   · 拖拽布局编辑        │                      ┌──────────┴───────────┐
│   · Widget 属性面板     │                      │  macOS 系统           │
│   · Profile 管理       │                      │  · 键盘事件           │
└─────────────────────┘                      │  · 鼠标事件           │
                                             │  · 音量/静音控制       │
                                             │  · 窗口管理            │
                                             └──────────────────────┘
```

---

## 已完成的最近改动（2026-07-31 ~ 2026-08-04）

### App 图标 & 菜单栏图标
- 设计 Dot Grid 方案（7×7 彩色点阵，中心暖色高亮簇，深色圆角矩形背景）
- 编写 `tools/generate_icons.py`，与 `client/icon-preview.html draw5()` 算法完全一致
- 生成 `icons/AppIcon.icns`（137KB）和 `icons/stp_menubar_icon.png`（44×44）
- **App 图标不变**，菜单栏图标为独立设计：透明背景 + 5×5 白色点阵 + 4 级大小渐变

### 菜单栏重构
- 去掉 Health 菜单项（删除 `on_show_health()` 和相关菜单）
- 去掉独立的 "Open Editor" 菜单项，改为 Dashboard NSPanel（CleanMyMac 风格双卡片入口）
- 后根据用户反馈简化为直接菜单：
  1. **⚙️ 设置** → 打开 NSPanel 设置面板（权限 + 端口）
  2. **Dashboard** → 在浏览器打开 iPad 面板网页
  3. **Open Editor** → 在浏览器打开编辑器
  4. **退出** → 退出应用

### 打包 & 部署
- `setup.py` 添加 `iconfile` + icons data_files
- py2app 构建成功，Apple Development 签名
- 部署到 `/Applications/`
- DMG 生成：`dist/SmartTouchPanel.dmg`
- `.gitignore` 添加 `dist/`
- Git commit + push 到 NAS（`192.168.2.62`）

### 技术备忘
- **py2app site_packages=False** 必须（否则 venv 绝对路径烧进 `__boot__.py` → launchd 挂死）
- **AppKit 类定义**必须在 try/except 块内（否则 module-level 引用导致 py2app 启动崩溃）
- **签名用 Apple Development 证书**，不能用 `--options runtime`（那是 Developer ID 的）
- **服务器启动约需 12-15 秒**（uvicorn 在 daemon 线程初始化）

---

## 当前待办（Next Up）

| # | 需求 | 状态 | 涉及文件 |
|---|------|------|---------|
| 1 | **Profile 切换按钮图标/文字两行** — 图标在上文字在下，目前是并排 | 📋 待实现 | `client/index.html`（主面板） |
| 2 | **图标显隐开关** — 在设置/选项里加「是否显示图标」 | 📋 待实现 | `client/index.html` + 设置面板 |
| 3 | **Editor 滚轮缩放视角** — 滚轮改 viewZoom（不改 cellSize），+/- 控制内容尺寸 | 📋 待实现 | `client/editor.html` |

### 已记录为 memory 的详细分析

- `stp-profile-button-icon-text-split.md` — 需求 1+2 的完整描述
- `stp-editor-scroll-zoom-viewport.md` — 需求 3 的详细分析，含当前代码关键行号和修改方案

---

## 关键约束（备忘）

这些是踩过的坑，不能忘：

| 约束 | 说明 |
|------|------|
| `client/index.html` 和 `editor.html` 是权威源 | 直接改这两个文件，不要跑 `tools/build.py`（会覆盖） |
| Port 8082 硬编码 | plist / 前端 / 逻辑三处硬编码，改端口需同步 |
| 单事件循环 | FastAPI 上不要写 `async def` 慢端点，用 `def` |
| 重打包 → 新 cdhash → TCC 重授权 | 先 `tccutil reset` 再重授权 |
| Editor 必须在 Safari 打开 | 其他浏览器没有原生 `<input type=color>` |
| py2app 用 server/venv 的 Python | 不能用 `.venv`（缺少 AVFoundation/PyObjC） |
| 服务器启动慢（~15s） | 菜单栏图标出现不代表服务就绪 |

---

## 环境信息

- **设备**: Mac mini (Apple Silicon, macOS 25 Sequoia)
- **Python**: 3.12 (server/venv) / 3.14 (系统)
- **局域网 IP**: 192.168.2.20
- **Git 远端**: NAS `192.168.2.62:/volume1/Git_Station/smart-touch-panel.git`
- **签名**: Apple Development, `50035AAD0722786A4C024087383B654504F75C33`, Team `7F246MKBN2`
