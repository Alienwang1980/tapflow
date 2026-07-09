# Plan A 执行计划 v3

> 审核历史: V1(9问题)→V2(5问题)→V3(无新问题)
> v3 已写入全部修正，待最终审核

## Phase 顺序

```
Phase 1 (音量系 + 当前应用) → Phase 2 (音源)
    → Phase 0.5 (ctypes AX 桥) → Phase 3 (窗口) → Phase 4 (Dock)
    → Phase 5 (动态菜单) → Phase 6 (平铺 + 布局)
```

## 依赖审计

### 系统自带
`osascript`, `sips`, `pgrep`, `plistlib`, `ctypes`, `ApplicationServices.framework`, `CoreFoundation.framework`

### 需打包（不放 .app 内，避免权限丢失）
`~/Library/Application Support/Smart Touch Panel/bin/SwitchAudioSource` (55KB ARM64)

### 不需要
`pyobjc` (ctypes 替代), `ddcctl` (待验证)

---

## Phase 0.5: ctypes AX 绑定层（Phase 2 和 Phase 3 之间）

### `server/ax_bridge.py`（职责：只读 AX 结构，不写）
```
ctypes 封装:
  _cf_string / _py_string → CFString 互转
  create_app_elem(pid) → AX element
  get_attr / get_children → 读 AX 属性/子元素
  get_menu_bar / get_menu_items → 菜单 + 快捷键

NOTE: 不包含位置/尺寸写入（Phase 3 直接调 osascript），
      不包含快捷键执行（复用 input_engine.press_key）
```

### 验证脚本（Phase 0.5 末尾）
```python
# Fallback 到 Finder (macOS 永远运行)
# 验证: frontmost_app, windows_of, get_position, get_size,
#        get_menu_bar, get_menu_items, AXMenuItemCmdChar
# 全部通过 → Phase 3 解锁
```

---

## Phase 1: 音量系 + 当前应用（无 AX 依赖）

### 1.1 — SwitchAudioSource 准备
```
mkdir -p ~/Library/Application Support/Smart Touch Panel/bin
cp SwitchAudioSource → bin/ (55KB)
Commit: "chore: add SwitchAudioSource binary"
```

### 1.2 — `server/system_control.py`（音量/静音）
```
get_volume / set_volume / toggle_output_mute / toggle_input_mute → osascript
路由: GET+POST /api/system/volume, POST /api/system/mute, /api/system/mic-mute
Commit: "feat: volume/mute system control API"
```

### 1.3 — 当前应用指示器
```
get_current_app → NSWorkspace.frontmostApplication
window_watcher 扩展: 广播 "app_changed" (500ms debounce)
iPad WS handler: case "app_changed" → 更新 widget
32-media.js: _drawCurrentApp → canvas 文本显示应用名
Commit: "feat: current app indicator widget"
```

### 1.4 — 音量 slider
```
32-media.js: _drawVolume + _onSliderTouch + _fetchAndDrawVolume
Editor: WIDGET_TYPES 加 volume
Commit: "feat: volume slider widget"
```

### 1.5 — 静音 + 麦克风静音
```
32-media.js: _drawMuteBtn / _drawMicMuteBtn
Editor: mute, mic-mute
Commit: "feat: mute and mic-mute toggle widgets"
```

---

## Phase 2: 音源切换

### 2.1 — 设备 API
```
system_control: list_audio_devices / set_audio_device → SwitchAudioSource
路由: GET /api/system/audio-devices, POST /api/system/audio-output, /audio-input
Commit: "feat: audio device list + switch API"
```

### 2.2 — iPad widget
```
32-media.js: _drawDeviceBtn + 设备列表选择
Editor: audio-out, audio-in
Commit: "feat: audio source selector widgets"
```

---

## Phase 3: 窗口快捷（依赖 Phase 0.5 验证通过）

### 3.1 — 窗口 API
```
system_control: tile_left/right, toggle_fullscreen, minimize,
               mission_control, show_desktop → osascript + 快捷键
路由: 6 POST endpoints
Commit: "feat: window shortcuts API"
```

### 3.2 — iPad widget
```
33-dock.js: _drawWinShortcuts → 6 按钮网格
Editor: win-shortcuts
Commit: "feat: window shortcuts widget"
```

---

## Phase 4: Dock 面板

### 4.1 — Dock API
```
system_control:
  list_dock_items → plist 解析 (17 apps)
  get_app_icon → sips 转 PNG, 缓存到 icon_cache/
  launch_app / quit_app / check_running
路由: GET /api/system/dock-items, /app-icon, POST /launch-app, /quit-app
Commit: "feat: dock items + app icon API"
```

### 4.2 — iPad widget
```
33-dock.js:
  _drawDockGrid → new Image() + ctx.drawImage() + 运行绿点
  _onDockTap / _onDockLongPress
Editor: dock
错误: 图标失败→首字母, 启动失败→静默跳过
Commit: "feat: dock panel widget"
```

---

## Phase 5: 动态菜单（依赖 Phase 0.5）

### 5.1 — 菜单 API
```
ax_bridge: get_menu_bar + get_menu_items (快捷键映射)
system_control: get_current_menus → ax_bridge
execute_shortcut → 复用 input_engine.press_key (不是 CGEvent)
window_watcher "app_changed" 附带菜单摘要
路由: GET /api/system/current-menus, POST /api/system/execute-shortcut
Commit: "feat: menu reading + shortcut execution API"
```

### 5.2 — iPad widget
```
33-dock.js: _drawMenuPanel → canvas 可滚动列表
WS handler: "app_changed" → 自动刷新
Editor: app-menu
Commit: "feat: dynamic app menu widget"
```

---

## Phase 6: 窗口平铺 + 布局预设

### 6.1 — 平铺
```
system_control: tile_windows(app, layout) → 2x2/1x3/left-right/top-bottom
Commit: "feat: window tile layout widget"
```

### 6.2 — 布局预设
```
system_control: save_layout/load_layout/list_layouts → JSON 文件
恢复失败: skip 单个 app, log 记录, 继续恢复
Commit: "feat: window layout presets"
```

---

## 模块划分

`32-media.js` → 音频 + 亮度 (volume, mute, mic-mute, audio-out/in, brightness)
`33-dock.js` → 系统 (active-app, dock, win-shortcuts, app-menu, win-tile, layout-preset)

## 错误处理

| API 失败 | "Error" + 灰色 |
| 网络断开 | 最后数据 + 灰色 |
| 图标失败 | 首字母 |
| 恢复失败 | skip + log |
| 窗口不存在 | skip |

## 用户参与

1. 辅助权限确认（Phase 0 前，已确认 ✅）
2. py2app 重建（Phase 6 后，一次性）
3. iPad 真机测试（Phase 6 后）
