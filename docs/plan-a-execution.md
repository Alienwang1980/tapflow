# Plan A 执行计划

## 复杂度排序（简单→复杂）

| # | Widget | 复杂度 | 理由 |
|---|--------|--------|------|
| 1 | 当前应用指示器 | ★ | 已有 window_watcher，加个 GET API + 文字 widget |
| 2 | 音量滑块 | ★★ | osascript 两行，canvas 滑块需要触摸处理 |
| 3 | 静音按钮 | ★★ | 同音量，toggle 逻辑 |
| 4 | 麦克风静音 | ★★ | 同静音，改 input volume |
| 5 | 亮度滑块 | ★★ | 同音量，待外接屏验证（先做 UI，API 空实现） |
| 6 | 输出音源 | ★★★ | SwitchAudioSource 二进制打包 + 设备列表 UI |
| 7 | 输入音源 | ★★★ | 同输出，不同 mode |
| 8 | 窗口快捷 | ★★★ | AX API 设 position/size，快捷键 button 组 |
| 9 | Dock 面板 | ★★★★ | plist 解析 + 图标提取 + 启动/退出 + 运行检测 |
| 10 | 窗口平铺 | ★★★★ | 多窗口坐标计算 + AX API |
| 11 | 动态菜单 | ★★★★★ | AX 菜单树遍历 + 快捷键执行 + CGEvent |
| 12 | 布局预设 | ★★★★★ | 全窗口状态快照 + 序列化 + 恢复 |

## 需要网上搜索的技术点

以下信息不能猜，需要查文档：

| # | 搜索内容 | 用途 | Phase |
|---|---------|------|-------|
| S1 | `osascript set volume` 完整语法 | 音量 API | 1 |
| S2 | SwitchAudioSource CLI flags (-a, -t, -i) | 音源切换 | 2 |
| S3 | AppleScript `set position/size of window` | 窗口控制 | 3 |
| S4 | CGEvent 创建按键事件的 key code 映射表 | 快捷键执行 | 5 |
| S5 | `sips` 命令 icns→PNG 参数 | Dock 图标 | 4 |
| S6 | pyobjc 在 py2app bundle 中的可用性 | 全部 AX API | 1（先验证） |

## Phase 1: 基础搭建 + 音量系（预计 1-2 小时）

### Step 1.1 — 验证 pyobjc 可用性

```
搜索 S6: "pyobjc py2app bundle AppKit NSWorkspace accessibility"
验证: 在 .app 环境下 import AppKit 是否成功
Commit: 无（验证步骤）
```

### Step 1.2 — 创建 `server/system_control.py`

```
新文件: server/system_control.py
包含:
  get_volume() → osascript get volume settings, parse
  set_volume(n) → osascript set volume output volume {n}
  toggle_output_mute() → osascript toggle
  toggle_input_mute() → 保存旧值, 设0/恢复
  get_brightness()/set_brightness(n) → pass（空实现）

搜索 S1: osascript volume 语法已在前面测过，需确认 input mute 恢复逻辑
```

### Step 1.3 — 服务端路由

```
tray_app.py 加 inline 路由:
  GET    /api/system/volume      → {output_volume, input_volume, output_muted}
  POST   /api/system/volume      → body: {value: 75}
  POST   /api/system/mute        → toggle_output_mute()
  POST   /api/system/mic-mute    → toggle_input_mute()

Commit: "feat: volume/mute system control API"
```

### Step 1.4 — 当前应用指示器

```
路由: GET /api/system/current-app → {name, bundle_id}
iPad: canvas 文本显示当前应用名（图标留到 Dock Phase）
Editor: WIDGET_TYPES 加 active-app

Commit: "feat: active app indicator widget"
```

### Step 1.5 — 音量 slider widget

```
新文件: client/ipad/32-media.js
  _drawVolume(canvas, value, muted) → 水平滑块 + 图标 + 百分比
  _onSliderTouch(e, canvas, apiPath) → 触摸拖动, POST 值
  _fetchAndDrawVolume(canvas) → GET API, 调 _drawVolume

client/ipad/60-render.js:
  k.action==="volume" → 创建 canvas → _drawVolume → 绑 touch

Editor: WIDGET_TYPES + Button Library 加 volume

Commit: "feat: volume slider widget"
```

### Step 1.6 — 静音 + 麦克风静音

```
32-media.js 新增: _drawMuteBtn, _drawMicMuteBtn
Editor: WIDGET_TYPES 加 mute, mic-mute

Commit: "feat: mute and mic-mute toggle widgets"
```

### Phase 1 收尾

```
Playwright 验证: 音量拖动/静音切换/当前应用显示
构建: python tools/build.py ipad && python tools/build.py editor
Git push
```

## Phase 2: 音源切换（预计 1 小时）

### Step 2.1 — 打包 SwitchAudioSource

```
搜索 S2: SwitchAudioSource CLI flags
操作:
  cp /opt/homebrew/Cellar/switchaudio-osx/1.2.2/SwitchAudioSource → server/bin/
  chmod +x, 验证 ./server/bin/SwitchAudioSource -a

Commit: "chore: bundle SwitchAudioSource binary"
```

### Step 2.2 — 服务端设备 API

```
system_control.py 新增:
  list_audio_devices() → subprocess SwitchAudioSource -a -t all, parse
  set_audio_device(name, type) → SwitchAudioSource -t {type} -i "{name}"

路由:
  GET    /api/system/audio-devices
  POST   /api/system/audio-output
  POST   /api/system/audio-input

Commit: "feat: audio device list + switch API"
```

### Step 2.3 — iPad 音源 widget

```
32-media.js 新增: _drawDeviceBtn + 设备列表交互
Editor: WIDGET_TYPES 加 audio-out, audio-in

Commit: "feat: audio source selector widgets"
```

## Phase 3: 窗口控制（预计 1.5 小时）

### Step 3.1 — 窗口快捷 API

```
搜索 S3: AppleScript set position/size of window 语法

system_control.py 新增:
  tile_left/right/fullscreen/minimize/mission_control/show_desktop

路由:
  POST /api/system/window/tile-left    (等6个)

Commit: "feat: window shortcuts API"
```

### Step 3.2 — 窗口快捷 widget

```
新文件: client/ipad/33-dock.js
  _drawWinShortcuts → 6 按钮网格

Editor: WIDGET_TYPES 加 win-shortcuts

Commit: "feat: window shortcuts widget"
```

## Phase 4: Dock 面板（预计 2 小时）

### Step 4.1 — Dock 数据 + 图标

```
搜索 S5: sips icns→PNG 参数

system_control.py 新增:
  list_dock_items() → plist 解析
  get_app_icon(name) → sips 转换 → PNG
  launch_app/quit_app/check_running

路由:
  GET    /api/system/dock-items
  GET    /api/system/app-icon?name=
  POST   /api/system/launch-app
  POST   /api/system/quit-app

Commit: "feat: dock items + app icon API"
```

### Step 4.2 — Dock widget

```
33-dock.js 新增:
  _drawDockGrid → <img> + 运行绿点
  _onDockTap/_onDockLongPress

Editor: WIDGET_TYPES 加 dock

Commit: "feat: dock panel widget"
```

## Phase 5: 动态菜单（预计 2 小时）

### Step 5.1 — 菜单读取 API

```
搜索 S4: CGEvent key code mapping table

system_control.py 新增:
  get_current_menus() → AX API 读菜单树
  execute_shortcut(keys) → CGEvent 构造

路由:
  GET  /api/system/current-menus
  POST /api/system/execute-shortcut

Commit: "feat: menu reading + shortcut execution API"
```

### Step 5.2 — 动态菜单 widget

```
33-dock.js 新增: _drawMenuPanel → 可滚动菜单列表
Editor: WIDGET_TYPES 加 app-menu

Commit: "feat: dynamic app menu widget"
```

## Phase 6: 窗口平铺 + 布局预设（预计 1.5 小时）

### Step 6.1 — 窗口平铺

```
system_control.py 新增: tile_windows(app_name, layout)
布局: 2x2/1x3/left-right/top-bottom

Commit: "feat: window tile layout widget"
```

### Step 6.2 — 布局预设

```
system_control.py 新增: save_layout/load_layout/list_layouts
数据格式: JSON → 本地文件

Commit: "feat: window layout presets"
```

## Git 提交节奏

每个 Step 独立提交，共 ~15 commits。
每次提交后运行: `python tools/build.py ipad && python tools/build.py editor`

## 文件改动汇总

| 文件 | 改动 |
|------|------|
| `server/system_control.py` | **新** — 所有系统控制逻辑 |
| `server/bin/SwitchAudioSource` | **新** — 55KB 二进制 |
| `server/tray_app.py` | 加 inline 路由 |
| `client/ipad/32-media.js` | **新** — 音量/静音/音源/亮度 |
| `client/ipad/33-dock.js` | **新** — Dock/窗口/菜单/布局 |
| `client/ipad/60-render.js` | 加 12 个 widget 分支 |
| `client/editor/40-widgets.js` | WIDGET_TYPES + Library |

## 验证标准

每 Phase 后: 构建 → Playwright → commit
