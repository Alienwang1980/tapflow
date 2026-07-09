# Smart Touch Panel — Plan A: 媒体控制 + Dock + 菜单 + 窗口 Widget

> 12 个 Widget，1 个待外接屏验证（亮度），其余全部实测可行
> 
> 系统要求: 辅助功能权限（一次性授权）


## 已具备的能力（实测验证）

| # | 功能 | 方式 | 状态 |
|---|------|------|------|
| 1 | 音量读写 | `osascript get/set volume` | ✅ 已验证 |
| 2 | 输出静音 | `osascript set volume output muted` | ✅ 已验证 |
| 3 | 麦克风静音 | `osascript set volume input volume 0` | ✅ 已验证 |
| 4 | 音频设备列表 | `SwitchAudioSource -a -t all` | ✅ 已验证 |
| 5 | 切换输出音源 | `SwitchAudioSource -t output -i NAME` | ✅ 已验证 |
| 6 | 切换输入音源 | `SwitchAudioSource -t input -i NAME` | ✅ 已验证 |
| 7 | 亮度读写 | `ddcctl -d 1 -b` | ⏳ 待外接屏验证 |
| 8 | Dock 应用列表 | `com.apple.dock.plist` (17 apps) | ✅ 已验证 |
| 9 | 检测应用运行中 | `pgrep -qi appname` | ✅ 已验证 |
| 10 | 启动应用 | `open -a "AppName"` | ✅ 已验证 |
| 11 | 退出应用 | `osascript quit app "AppName"` | ✅ 已验证 |
| 12 | 应用图标提取 | `sips` icns→PNG / `NSWorkspace` | ✅ 已验证 |
| 13 | 当前前台应用 | `NSWorkspace.frontmostApplication()` | ✅ 已验证（window_watcher 已有） |

## Widget 清单（最终 8 个）

### 音频类
| # | Widget | 尺寸 | 类型 | 说明 |
|---|--------|------|------|------|
| 1 | 音量滑块 | 2×1 | `volume` | 拖动调音量 0-100，显示% |
| 2 | 静音按钮 | 1×1 | `mute` | 红色/灰色切换，toggle 输出静音 |
| 3 | 麦克风静音 | 1×1 | `mic-mute` | 红色/灰色切换，toggle 输入静音 |
| 4 | 输出音源 | 3×1 | `audio-out` | 显示当前设备名，点击切下一个 |
| 5 | 输入音源 | 3×1 | `audio-in` | 显示当前设备名，点击切下一个 |

### 显示类
| # | Widget | 尺寸 | 类型 | 说明 |
|---|--------|------|------|------|
| 6 | 亮度滑块 | 2×1 | `brightness` | 同音量滑块，待外接屏验证 |

### 系统类
| # | Widget | 尺寸 | 类型 | 说明 |
|---|--------|------|------|------|
| 7 | Dock 面板 | 4×4 | `dock` | 显示 Dock 应用图标 + 运行中指示，点击启动/切换，长按退出 |
| 8 | 当前应用 | 3×1 | `active-app` | 显示 Mac 当前前台应用名 + 图标 |

## 新增文件

```
server/
├── bin/
│   ├── SwitchAudioSource     # 55KB — 音源切换
│   └── ddcctl                # 30KB — 亮度 (待验证)
├── system_control.py         # 统一封装：音量/静音/音源/亮度/Dock/图标
client/ipad/
├── 32-media.js               # 音量/静音/音源/亮度 widget
├── 33-dock.js                # Dock + 当前应用 widget
setup.py                       # data_files: server/bin/
```

## 服务端 API

```
音频:
  GET    /api/system/volume              → {output_volume, input_volume, output_muted}
  POST   /api/system/volume              → set_volume(value)
  POST   /api/system/mute                → toggle_output_mute()
  POST   /api/system/mic-mute            → toggle_input_mute()
  GET    /api/system/audio-devices       → [{name, type, current}]
  POST   /api/system/audio-output        → set_audio_device(name, "output")
  POST   /api/system/audio-input         → set_audio_device(name, "input")

显示:
  GET    /api/system/brightness          → {value} (待外接屏)
  POST   /api/system/brightness          → set_brightness(value)

Dock:
  GET    /api/system/dock-items          → [{name, bundle_id, path, icon_url, running}]
  POST   /api/system/launch-app          → open -a {name}
  POST   /api/system/quit-app            → osascript quit app {name}
  GET    /api/system/app-icon?name=xxx   → PNG 图标
  GET    /api/system/current-app         → {name, bundle_id, icon_url}
```

## iPad 渲染

### `32-media.js`
- `_drawVolume(canvas, value)` — 水平滑块 + 音量图标 + 数字
- `_drawMuteBtn(canvas, muted)` — 圆形按钮，静音时红色
- `_drawDeviceBtn(canvas, name)` — 设备名按钮
- `_drawBrightness(canvas, value)` — 同音量
- `_onSliderTouch(e, canvas, apiPath)` — 通用触摸拖动
- `_fetchVolume/Devices/Brightness()` — API 请求

### `33-dock.js`
- `_drawAppIcon(canvas, app)` — 单个应用图标 + 名称 + 运行指示圆点
- `_drawDockGrid(container, apps)` — 网格布局
- `_drawCurrentApp(canvas, app)` — 当前应用显示
- `_onAppTap(app)` — 启动或切换
- `_onAppLongPress(app)` — 退出应用

## Editor 注册

```javascript
WIDGET_TYPES 新增:
  "volume":     {label:"Volume Slider",  defaults:{w:2,h:1,color:"#1a2a1a",action:"volume"}}
  "mute":       {label:"Mute Toggle",    defaults:{w:1,h:1,color:"#2a1a1a",action:"mute"}}
  "mic-mute":   {label:"Mic Mute",       defaults:{w:1,h:1,color:"#1a2a2a",action:"mic-mute"}}
  "audio-out":  {label:"Audio Output",   defaults:{w:3,h:1,color:"#1a1a2a",action:"audio-out"}}
  "audio-in":   {label:"Audio Input",    defaults:{w:3,h:1,color:"#1a2a2a",action:"audio-in"}}
  "brightness": {label:"Brightness",     defaults:{w:2,h:1,color:"#2a2a1a",action:"brightness"}}
  "dock":       {label:"Dock",           defaults:{w:4,h:4,color:"#1a1a1a",action:"dock"}}
  "active-app": {label:"Active App",     defaults:{w:3,h:1,color:"#1a1a1a",action:"active-app"}}
```

## 构建集成

### setup.py
```python
DATA_FILES = [
    ("bin", ["server/bin/SwitchAudioSource", "server/bin/ddcctl"]),
]
```

### 构建后验证
```bash
python tools/build.py ipad    # 新增 32-media.js, 33-dock.js 到拼接列表
python tools/build.py editor  # 新增 WIDGET_TYPES
```

## 实施 Phase

### Phase 1: 服务端基础
1. 复制 SwitchAudioSource 到 `server/bin/`
2. 写 `server/system_control.py`（音频 + Dock + 当前应用）
3. `main.py` 加路由

### Phase 2: 音频 widgets（音量/静音/音源）
1. `32-media.js` 渲染函数
2. Editor WIDGET_TYPES + Button Library
3. iPad `60-render.js` 加分支

### Phase 3: Dock + 当前应用
1. `33-dock.js` 渲染函数
2. 图标服务 `/api/system/app-icon`
3. 运行状态检测

### Phase 4: 亮度（待外接屏）
1. 复制 ddcctl
2. 亮度 API
3. Widget

### Phase 5: 打包 + 回归测试

## 待定
- DDC/CI 亮度：等外接屏幕接入后验证

## 动态菜单栏（新增 — 已实测验证）

### 验证结果

通过 AX API 从"系统设置"应用读出的 Apple 菜单：

```
关于本机, 系统信息, 强制退出… [shift+⎋], 强制退出"系统设置" [cmd+shift+⎋],
睡眠, 重新启动…, 关机…
```

结构：`AXMenuBar → AXChildren(bar items) → AXChildren[0](AXMenu) → AXChildren(menu items) → AXTitle + AXMenuItemCmdChar`

### Widget

| # | Widget | 尺寸 | 类型 | 说明 |
|---|--------|------|------|------|
| 9 | 动态菜单 | 4×5 | `app-menu` | 读取当前前台应用的全部菜单项+快捷键，显示为可点击按钮 |

### 工作流

1. iPad 轮询 `GET /api/system/current-menus`（或在 `window_watcher` 切应用时推送）
2. iPad 渲染：菜单名 → 子菜单项列表，每个带快捷键的项显示为按钮
3. 点击按钮 → `POST /api/system/execute-shortcut` → 服务器执行 `osascript keystroke` 或 `CGEvent`

### API

```
GET  /api/system/current-menus      → {app, menus: [{name, items: [{title, shortcut}]}]}
POST /api/system/execute-shortcut   → {keys: ["cmd","r"]}  执行快捷键
```

### 依赖

- **辅助功能权限**（一次性授权，已验证可用）
- window_watcher 推送前台应用切换事件（已有）

## 最终 Widget 清单（9 个）

| # | Widget | 尺寸 | 类型 | 方式 | 状态 |
|---|--------|------|------|------|------|
| 1 | 音量滑块 | 2×1 | `volume` | `osascript` | ✅ |
| 2 | 静音按钮 | 1×1 | `mute` | `osascript` | ✅ |
| 3 | 麦克风静音 | 1×1 | `mic-mute` | `osascript` | ✅ |
| 4 | 输出音源 | 3×1 | `audio-out` | `SwitchAudioSource` | ✅ |
| 5 | 输入音源 | 3×1 | `audio-in` | `SwitchAudioSource` | ✅ |
| 6 | 亮度滑块 | 2×1 | `brightness` | `ddcctl` | ⏳ 待外接屏 |
| 7 | Dock 面板 | 4×4 | `dock` | plist + `open`/`quit` | ✅ |
| 8 | 当前应用 | 3×1 | `active-app` | `NSWorkspace` | ✅ |
| 9 | 动态菜单 | 4×5 | `app-menu` | AX API | ✅ 已验证 |

## 限制条件

### 动态菜单 & 快捷键执行

**只能控制前台应用。** macOS 窗口系统将键盘事件路由到当前活动窗口 — 这是系统级限制，无法绕过。

| 如果目标应用... | 动态菜单 | 快捷键 | 替代方案 |
|-------------|---------|--------|---------|
| 在前台 | ✅ 完整菜单+快捷键 | ✅ 直接执行 | — |
| 在后台 | ❌ 菜单不可读 | ❌ 快捷键无效 | 用 Dock widget 先"启动/切换"到前台 |

**工作流**：
1. Dock widget 显示应用运行状态（● 绿色=运行中，○ 灰色=未运行）
2. 点击 Dock 图标 → 应用切到前台
3. 动态菜单 widget 自动刷新 → 显示该应用的菜单+快捷键
4. 点快捷键按钮 → 执行

**`active-app` widget 的作用**：始终显示 Mac 当前前台应用名+图标，让用户知道快捷键会发给谁。

## 窗口管理（新增）

### 已确认的 AX API 能力

通过 `AXUIElementCreateApplication(pid)` + `AXWindows` 属性：

| 读 | 写 | 说明 |
|----|-----|------|
| `AXWindows` | — | 所有窗口列表 |
| `AXTitle` | — | 窗口标题 |
| `AXPosition` | ✅ | 位置 (x, y) |
| `AXSize` | ✅ | 尺寸 (w, h) |
| `AXFullScreen` | ✅ | 全屏状态 |
| `AXMinimized` | ✅ | 最小化状态 |
| `AXFrontmost` | — | 是否前台 |

**不限前台应用** — 可以读写任何应用的所有窗口。

### Widget

| # | Widget | 尺寸 | 类型 | 说明 |
|---|--------|------|------|------|
| 10 | 窗口快捷 | 4×2 | `win-shortcuts` | 左半屏/右半屏/全屏/最小化/Mission Control/显示桌面 |
| 11 | 窗口平铺 | 4×2 | `win-tile` | 选应用 → 选布局 → 自动排布（2×2/1×3/左右分栏） |
| 12 | 布局预设 | 4×4 | `layout-preset` | 保存当前所有窗口状态 → 命名 → 一键恢复 |

### 布局预设工作流

**保存**：
1. 遍历所有应用 → `AXWindows` → 收集 position/size/fullscreen
2. 序列化为 JSON `{name, apps: [{bundle_id, windows: [{title, x, y, w, h, fullscreen}]}]}`
3. 存到本地文件

**恢复**：
1. 读 JSON 布局预设
2. 对每个 app：如未运行 → `open -a` 启动
3. 对每个 window：`set AXPosition` + `set AXSize` + `set AXFullScreen`
4. 分屏：通过快捷键 `⌃⌘F` 或 Mission Control API 进入

### API

```
窗口:
  GET    /api/system/windows              → [{app, windows: [{title, x, y, w, h, fullscreen, minimized}]}]
  POST   /api/system/window/move          → {pid, index, x, y, w, h}
  POST   /api/system/window/fullscreen    → {pid, index}
  POST   /api/system/window/minimize      → {pid, index}

布局预设:
  GET    /api/system/layouts              → [{name, apps: [...]}]
  POST   /api/system/layouts              → {name}  保存当前布局
  POST   /api/system/layouts/apply        → {name}  恢复布局
  DELETE /api/system/layouts/{name}       → 删除预设
```

## 最终 Widget 清单（12 个）

| # | Widget | 尺寸 | 类型 | 状态 |
|---|--------|------|------|------|
| 1 | 音量滑块 | 2×1 | `volume` | ✅ |
| 2 | 静音按钮 | 1×1 | `mute` | ✅ |
| 3 | 麦克风静音 | 1×1 | `mic-mute` | ✅ |
| 4 | 输出音源 | 3×1 | `audio-out` | ✅ |
| 5 | 输入音源 | 3×1 | `audio-in` | ✅ |
| 6 | 亮度滑块 | 2×1 | `brightness` | ⏳ 待外接屏 |
| 7 | Dock 面板 | 4×4 | `dock` | ✅ |
| 8 | 当前应用 | 3×1 | `active-app` | ✅ |
| 9 | 动态菜单 | 4×5 | `app-menu` | ✅ |
| 10 | 窗口快捷 | 4×2 | `win-shortcuts` | ✅ |
| 11 | 窗口平铺 | 4×2 | `win-tile` | ✅ |
| 12 | 布局预设 | 4×4 | `layout-preset` | ✅ |

## UX 架构影响（审核发现）

### 问题 1: Widget Library 分组

当前 Button Library 是平铺列表。14+ 类型需要分组。

```
🔤 Keys           Regular Key
🖐 Touch          Touch Pad  
🎵 Audio          Volume, Mute, Mic-Mute, Audio Out, Audio In
🖥 System         Dock, Active App, App Menu
🪟 Windows        Win Shortcuts, Win Tile, Layout Preset
📊 Data           Deepseek Balance, Audio Visualizer
```

**影响**: Editor `editor.html` — Button Library HTML 重构为手风琴/分组

### 问题 2: Profile 类型系统

当前所有 Profile 都是"键盘布局"。需要扩展到多种类型：

| 类型 | 内容 | iPad 行为 |
|------|------|----------|
| `keyboard` | keys 网格 | 静态，编辑器维护 |
| `shortcuts` | 当前应用菜单 | **动态**，切应用自动刷新 |
| `layouts` | 窗口布局预设 | 静态，点击触发恢复 |
| `controls` | 系统控件集合 | **常驻**，不随 Profile 切换消失 |

**影响**: 数据模型 — `profile.type` 字段。Profile 创建时选择类型。Editor 只编辑 `keyboard` 类型。

### 问题 3: 常驻区域 vs Profile 区域

Dock、音量、当前应用指示器 — 这些不应随 Profile 切换消失。

```
┌──────────────────────────┐
│  常驻区 (Dock, 音量...)   │  ← 固定在底部/顶部
├──────────────────────────┤
│  Profile 区 (键盘/快捷键) │  ← 随 Profile 切换
└──────────────────────────┘
```

**影响**: iPad `index.html` — 新增常驻区域容器。`render()` 只更新 Profile 区，不碰常驻区。

### 问题 4: iPad 端 Profile 切换器

当前 iPad 只能被动显示编辑器传来的 profile。需要独立切换。

**方案**: 底部 tab 栏，显示所有 Profile 的标签，点击切换。

**影响**: iPad — 新增 tab 栏 UI + `switchProfile()` 逻辑。常驻区跨所有 profile 可见。

### 问题 5: 跨 Profile 收藏

用户在快捷键 Profile 上看到 "刷新 ⌘R"，想固定到键盘 Profile。

**方案**: 长按菜单项 → "固定到 Profile → 选目标" → 创建 shortcut widget。

**影响**: 数据模型 — widget 类型 `shortcut`（存储 key sequence）。iPad 交互 — 长按菜单。

### 架构变更汇总

| # | 改动 | 文件 | 优先级 |
|---|------|------|--------|
| 1 | Widget Library 分组 | `editor.html` | 高 |
| 2 | Profile 类型系统 | 数据模型 + `editor.html` + `index.html` | 高 |
| 3 | 常驻区域 | `index.html` 布局 | 高 |
| 4 | iPad Profile 切换器 | `index.html` tab 栏 | 中 |
| 5 | 跨 Profile 收藏 | 数据模型 + iPad 交互 | 中 |

## 分阶段实施建议

原有计划 5 个 Phase 不变，架构变更拆成独立前置 Phase：

**Phase 0: 架构准备**
1. Profile 类型系统（数据模型 + 创建）
2. iPad 常驻区域布局
3. Widget Library 分组
4. iPad Profile 切换器

**Phase 1-5**: 音频、显示、Dock、菜单、窗口（同原计划）
**Phase 6**: 跨 Profile 收藏