# tray_app.py 路由拆分计划

> 状态: 已审核，待执行 | 2026-08-11

## 审核历史

| 轮次 | 发现问题 | 处置 |
|------|---------|------|
| V1 自审 | 2 CRITICAL + 2 HIGH + 1 MEDIUM | 全部修正并入 V2 |
| V2 | 待 mini 审核 | — |

### V1 → V2 修正清单

| # | 严重度 | 问题 | 修正 |
|---|--------|------|------|
| C1 | CRITICAL | 路由模块 `from tray_app import check_accessibility` → `python server/tray_app.py` 时 `__name__=="__main__"` 无 `tray_app` 模块名，`ModuleNotFoundError` | 改为依赖注入：`create_router(state, check_accessibility, ...)` 接收函数作参数 |
| C2 | CRITICAL | `routes_audio.py` 的 `_ensure_switch_audio_source()` 需要 `_is_frozen()`，同样存在模块名问题 | `_is_frozen` 作为参数注入 `create_router(state, is_frozen)` |
| H1 | HIGH | `/api/deepseek/balance` 重复定义未在计划中明确处理 | 标注清楚：迁移到 `routes_volume.py` 时保留 `tray_app.py` 版本不变。已知 bug 不在此次修复 |
| H2 | HIGH | `_profile_state_file` / `_LAYOUT_DIR` 路径在闭包内定义，迁移后可直接用模块级常量 | 文档中明确写为模块级常量 |
| M1 | MEDIUM | 路由计数不准（profile 3 非 2，mic 7 非 10，window 10 非 11，system 5 非 4） | 全部更正为精确数字 |

---

## 1. 动机

`run_server()` 是一个 ~760 行的巨型闭包（L210-974），内含 43 个 API 路由，通过 7 个 `nonlocal` 变量共享可变状态。闭包 + `nonlocal` 导致：

- **改一个路由容易牵连其他路由**（共享可变状态,非显式依赖）
- **无法单独测试**（所有路由必须和闭包一起初始化）
- **代码难以定位**（760 行闭包中找特定路由需要全文搜索）
- **15+ `except Exception: pass`** 静默吞错
- **重复导入**: `import os as _os` / `_os2` / `_os5` / `_os8`

## 2. 方案

### 2.1 核心思路

1. 创建 `ServerState` 类 → 替换全部 `nonlocal` 变量
2. 每个路由模块导出 `create_router(...) -> APIRouter` → **依赖注入**（不 import tray_app）
3. `run_server()` 精简为: 创建 state → 创建 routers → `app.include_router()` → uvicorn.run

### 2.2 依赖注入原则（CRITICAL）

路由模块**禁止** `from tray_app import ...`。原因：

- `python server/tray_app.py` 直接运行时，模块名是 `__main__`，不是 `tray_app` → `from tray_app import ...` 会炸
- 即使 py2app bundle 模式有 `tray_app` 模块名，也存在循环导入风险

所有外部函数依赖通过 `create_router()` 的参数传入：

```python
# routes_system.py — 通过参数接收，不 import tray_app
def create_router(state, check_accessibility, check_screen_capture,
                  request_accessibility_permission, request_screen_capture_permission):
    router = APIRouter()
    @router.get("/api/system/accessibility")
    async def sys_acc():
        return {"granted": check_accessibility()}
    ...
    return router
```

```python
# tray_app.py → run_server() — 把函数作为参数传入
from routes_system import create_router as system_router
app.include_router(system_router(state, check_accessibility, check_screen_capture,
                                 request_accessibility_permission, request_screen_capture_permission))
```

### 2.3 模块拆分

```
server/
├── state.py              # NEW — ServerState 类
├── routes_profile.py     # NEW — 3 routes
├── routes_volume.py      # NEW — 4 routes (含 /api/deepseek/balance)
├── routes_mic.py         # NEW — 7 routes + AVAudioRecorder 采样器
├── routes_audio.py       # NEW — 5 routes + SwitchAudioSource 管理
├── routes_window.py      # NEW — 10 routes + arrange helpers
├── routes_thumbnail.py   # NEW — 1 route + 缓存
├── routes_dock.py        # NEW — 3 routes
├── routes_menu.py        # NEW — 2 routes
├── routes_layout.py      # NEW — 3 routes
├── routes_app_icon.py    # NEW — 1 route
├── routes_system.py      # NEW — 5 routes (含 /api/system/current-app)
├── tray_app.py           # MODIFIED — 去掉闭包路由,保留其余
```

## 3. ServerState 设计

```python
# server/state.py
from dataclasses import dataclass, field
from typing import Any

@dataclass
class ServerState:
    """Shared mutable state for all tray routes. Replaces nonlocal variables."""
    # Profile
    current_profile: str = "Default.json"

    # Volume / Mute
    output_muted: bool = False
    mic_pre: int | None = None   # volume level before mute, for restore
    mic_muted: bool = False

    # Mic sampler (AVAudioRecorder)
    mic_level: float = 0.0
    mic_sampling: bool = False
    mic_recorder: Any = None
    mic_monitor_enabled: bool = False

    # Window thumbnail cache
    thumb_cache: dict = field(default_factory=dict)
    # key: (pid, title_lower) → (jpeg_bytes, timestamp)
```

## 4. 路由分配详情

### 4.1 `routes_profile.py` — Profile 管理 (3 routes)

| 路径 | 方法 | 状态依赖 | 外部依赖 |
|------|------|---------|---------|
| `/api/test-ws-override` | GET | `state.current_profile` | `profile_manager` |
| `/api/active-profile` | GET | `state.current_profile` | `profile_manager` |
| `/api/active-profile` | POST | `state.current_profile` (write) | `profile_manager` |

模块级常量:
- `_PROFILE_STATE_FILE` = `~/Library/Application Support/Smart Touch Panel/active_profile.txt`

`create_router` 签名:
```python
def create_router(state: ServerState, profile_manager) -> APIRouter
```

### 4.2 `routes_volume.py` — 音量控制 + DeepSeek Balance (4 routes)

| 路径 | 方法 | 状态依赖 | 外部依赖 |
|------|------|---------|---------|
| `/api/system/volume` | GET | `state.output_muted` | `subprocess` (osascript) |
| `/api/system/volume` | POST | — | `subprocess` |
| `/api/system/mute` | POST | `state.output_muted` (toggle) | `subprocess` |
| `/api/deepseek/balance` | GET | — | `urllib` |

> ⚠️ `/api/deepseek/balance` 在 `main.py:401` 有重复定义（`main.py` 版本用 profile key 查询，`tray_app.py` 版本用直接 API key）。`tray_app.py` 版本后注册，覆盖前者。迁移时保留 `tray_app.py` 版本不变。已知 bug，不在本次重构修复。

`create_router` 签名:
```python
def create_router(state: ServerState) -> APIRouter
```

### 4.3 `routes_mic.py` — 麦克风 (7 routes)

| 路径 | 方法 | 状态依赖 | 外部依赖 |
|------|------|---------|---------|
| `/api/system/mic-mute` | POST | `mic_pre`, `mic_muted` | `subprocess` |
| `/api/system/mic-volume` | POST | `mic_muted` | `subprocess` |
| `/api/system/mic-monitor` | GET | `mic_monitor_enabled` | — |
| `/api/system/mic-monitor` | POST | `mic_monitor_enabled` | `_start/_stop_mic_sampler` |
| `/api/system/mic-level` | GET | `mic_sampling`, `mic_monitor_enabled`, `mic_level` | — |
| `/api/system/mic-permission` | GET | — | `AVCaptureDevice` |
| `/api/system/mic-permission` | POST | — | `request_mic_permission()` (注入) |

内部函数（不对外暴露）:
- `_start_mic_sampler(state)` → 启动 AVAudioRecorder 采样，后台线程更新 `state.mic_level`
- `_stop_mic_sampler(state)` → 停止采样，清理 `state.mic_recorder`

线程安全说明: `mic_level` 是 Python float（原子赋值），`mic_sampling` 是 bool（原子赋值），与当前代码模式一致，不引入额外锁。

`create_router` 签名:
```python
def create_router(state: ServerState, request_mic_permission) -> APIRouter
```

### 4.4 `routes_audio.py` — 音频设备 (5 routes)

| 路径 | 方法 | 状态依赖 | 外部依赖 |
|------|------|---------|---------|
| `/api/system/audio-devices` | GET | — | SwitchAudioSource |
| `/api/system/audio-output` | POST | — | SwitchAudioSource |
| `/api/system/audio-input` | POST | — | SwitchAudioSource |
| `/api/system/audio-input/cycle` | POST | — | SwitchAudioSource |
| `/api/system/audio-output/cycle` | POST | — | SwitchAudioSource |

内部函数:
- `_ensure_switch_audio_source(is_frozen)` → 确保 SAS 二进制已安装到 App Support。`is_frozen` 通过参数注入
- `_cycle_audio_device(dtype, is_frozen)` → 循环到下一个设备

`create_router` 签名:
```python
def create_router(state: ServerState, is_frozen) -> APIRouter
```

### 4.5 `routes_window.py` — 窗口管理 (10 routes)

| 路径 | 方法 | 状态依赖 | 外部依赖 |
|------|------|---------|---------|
| `/api/system/current-app-windows` | GET | — | `ax_bridge` |
| `/api/system/all-windows` | GET | — | `ax_bridge` |
| `/api/system/focus-window` | POST | — | `ax_bridge` |
| `/api/system/window/close` | POST | — | `ax_bridge` |
| `/api/system/window/fullscreen` | POST | — | `input_engine` |
| `/api/system/window/minimize` | POST | — | `input_engine` |
| `/api/system/window/mission-control` | POST | — | `input_engine` |
| `/api/system/window/show-desktop` | POST | — | `input_engine` |
| `/api/system/window/arrange` | POST | — | `subprocess` (osascript) |
| `/api/system/window/tile` | POST | — | `subprocess` (osascript) |

内部常量和函数:
- `_WIN_MENU = "窗口"`, `_MR_SUB = "移动与调整大小"`, `_FS_SUB = "全屏幕平铺"`
- `_ARRANGE_MAP` → 排列动作映射表
- `_menu_ref(submenu, item)` → 构建 AppleScript 菜单引用
- `_run_osa(lines)` → 执行 AppleScript

`create_router` 签名:
```python
def create_router(state: ServerState) -> APIRouter
```

### 4.6 `routes_thumbnail.py` — 窗口缩略图 (1 route)

| 路径 | 方法 | 状态依赖 | 外部依赖 |
|------|------|---------|---------|
| `/api/system/window-thumbnail` | GET | `state.thumb_cache` | `ax_bridge`, `fastapi.responses` |

常量:
- `_THUMB_TTL = 60.0` — 缓存有效期
- `_THUMB_PRUNE_AGE = 600.0` — 过期清理阈值

`create_router` 签名:
```python
def create_router(state: ServerState) -> APIRouter
```

### 4.7 `routes_dock.py` — Dock (3 routes)

| 路径 | 方法 | 状态依赖 | 外部依赖 |
|------|------|---------|---------|
| `/api/system/dock-items` | GET | — | `plistlib`, `Cocoa.NSWorkspace` |
| `/api/system/launch-app` | POST | — | `subprocess` |
| `/api/system/quit-app` | POST | — | `subprocess` (pkill) |

`create_router` 签名:
```python
def create_router(state: ServerState) -> APIRouter
```

### 4.8 `routes_menu.py` — 动态菜单 (2 routes)

| 路径 | 方法 | 状态依赖 | 外部依赖 |
|------|------|---------|---------|
| `/api/system/current-menus` | GET | — | `ax_bridge` |
| `/api/system/execute-shortcut` | POST | — | `input_engine` |

`create_router` 签名:
```python
def create_router(state: ServerState) -> APIRouter
```

### 4.9 `routes_layout.py` — 布局预设 (3 routes)

| 路径 | 方法 | 状态依赖 | 外部依赖 |
|------|------|---------|---------|
| `/api/system/layouts` | GET | — | `json`, 文件系统 |
| `/api/system/layouts` | POST | — | `json`, `AppKit` |
| `/api/system/layouts/apply` | POST | — | `json`, `subprocess` |

模块级常量:
- `_LAYOUT_DIR` = `~/Library/Application Support/Smart Touch Panel/layouts`

`create_router` 签名:
```python
def create_router(state: ServerState) -> APIRouter
```

### 4.10 `routes_app_icon.py` — App 图标 (1 route)

| 路径 | 方法 | 状态依赖 | 外部依赖 |
|------|------|---------|---------|
| `/api/system/app-icon` | GET | — | `sips`, `Cocoa` (NSWorkspace/NSImage fallback) |

`create_router` 签名:
```python
def create_router(state: ServerState) -> APIRouter
```

### 4.11 `routes_system.py` — 系统权限 + 当前应用 (5 routes)

| 路径 | 方法 | 状态依赖 | 外部依赖 |
|------|------|---------|---------|
| `/api/system/current-app` | GET | — | `AppKit` |
| `/api/system/accessibility` | GET | — | `check_accessibility()` (注入) |
| `/api/system/accessibility` | POST | — | `request_accessibility_permission()` (注入) |
| `/api/system/screen-capture` | GET | — | `check_screen_capture()` (注入) |
| `/api/system/screen-capture` | POST | — | `request_screen_capture_permission()` (注入) |

`create_router` 签名:
```python
def create_router(state, check_accessibility, check_screen_capture,
                  request_accessibility_permission, request_screen_capture_permission) -> APIRouter
```

## 5. 各模块 create_router 签名汇总

| 模块 | 签名 | 注入来源 |
|------|------|---------|
| `routes_system` | `(state, check_accessibility, check_screen_capture, request_acc, request_sc)` | `tray_app` 模块级函数 |
| `routes_profile` | `(state, profile_manager)` | `profile_manager` 模块 |
| `routes_mic` | `(state, request_mic_permission)` | `tray_app.request_mic_permission` |
| `routes_audio` | `(state, is_frozen)` | `tray_app._is_frozen` |
| `routes_volume` | `(state)` | 无外部函数依赖 |
| `routes_window` | `(state)` | 自 import `ax_bridge`, `input_engine` |
| `routes_thumbnail` | `(state)` | 自 import `ax_bridge` |
| `routes_dock` | `(state)` | 自 import `plistlib`, `Cocoa` |
| `routes_menu` | `(state)` | 自 import `ax_bridge`, `input_engine` |
| `routes_layout` | `(state)` | 自 import `json`, `AppKit` |
| `routes_app_icon` | `(state)` | 自 import `subprocess`, `Cocoa` |

**依赖注入的 4 个函数**（需要从 `tray_app` 传入）:
- `check_accessibility()` — L143
- `check_screen_capture()` — L156
- `request_accessibility_permission()` — L148
- `request_screen_capture_permission()` — L1020
- `request_mic_permission()` — L1012
- `_is_frozen()` — L1438

## 6. run_server() 变化

### Before（当前代码结构，伪代码）

```python
def run_server():
    import uvicorn, json, os, re, logging
    from profile_manager import profile_manager as _pm
    _current_profile = "Default.json"
    # ... 恢复 active profile ...
    _state = {"muted": False, "mic_pre": None}
    _mic_level = 0.0; _mic_sampling = False; _mic_recorder = None; _mic_monitor_enabled = False

    def _start_mic_sampler(): nonlocal _mic_sampling, _mic_recorder; ...
    def _stop_mic_sampler(): nonlocal _mic_sampling, _mic_recorder; ...

    # 内嵌函数 _ensure_switch_audio_source() ...
    # 内嵌函数 _cycle_audio_device() ...
    # 内嵌常量 _MENU_REF, _ARRANGE_MAP, _THUMB_TTL ...

    @app.get("/api/active-profile")
    async def _get(): nonlocal _current_profile; ...

    # ... 42 more @app routes ...

    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="warning")
```

### After（重构后，伪代码）

```python
def run_server():
    import uvicorn, os, logging
    from state import ServerState
    from profile_manager import profile_manager as _pm

    # 1. 初始化状态
    state = ServerState()
    _restore_active_profile(state, _pm)

    # 2. 延迟导入路由模块 + 依赖注入 + 注册
    from routes_system import create_router as system_router
    app.include_router(system_router(state, check_accessibility, check_screen_capture,
                                     request_accessibility_permission, request_screen_capture_permission))

    from routes_profile import create_router as profile_router
    app.include_router(profile_router(state, _pm))

    from routes_mic import create_router as mic_router
    app.include_router(mic_router(state, request_mic_permission))

    from routes_audio import create_router as audio_router
    app.include_router(audio_router(state, _is_frozen))

    from routes_volume import create_router as volume_router
    app.include_router(volume_router(state))

    from routes_window import create_router as window_router
    app.include_router(window_router(state))

    from routes_thumbnail import create_router as thumbnail_router
    app.include_router(thumbnail_router(state))

    from routes_dock import create_router as dock_router
    app.include_router(dock_router(state))

    from routes_menu import create_router as menu_router
    app.include_router(menu_router(state))

    from routes_layout import create_router as layout_router
    app.include_router(layout_router(state))

    from routes_app_icon import create_router as app_icon_router
    app.include_router(app_icon_router(state))

    # 3. 启动
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="warning")
```

## 7. setup.py 变更

```python
"includes": [
    "connection_manager", "input_engine", "profile_manager",
    "window_watcher", "editor_app", "ax_bridge",
    "system_control", "balance_poller", "widget_extension",
    "typing_extensions", "six",
    "PyObjCTools.MachSignals", "PyObjCTools.AppHelper",
    "logging", "json", "uuid", "asyncio", "threading", "webbrowser",
    # NEW — route refactoring modules:
    "state",
    "routes_profile", "routes_volume", "routes_mic",
    "routes_audio", "routes_window", "routes_thumbnail",
    "routes_dock", "routes_menu", "routes_layout",
    "routes_app_icon", "routes_system",
],
```

## 8. 实施步骤

### Phase 1: 基础设施

1. **创建 `state.py`** — ServerState 类
2. `git commit`: `chore: add ServerState class for route refactoring`

### Phase 2: 逐模块迁移（每模块一个 commit）

每模块的流程:
1. 创建 `routes_<name>.py`，从 `tray_app.py` 提取对应路由/函数
2. 修改 `run_server()`: 移除旧路由定义，加 `app.include_router(create_router(...))`
3. 启动服务 → curl 验证涉及的路由
4. `git commit`

顺序（按依赖最少到最多）:

| 步 | 模块 | 状态依赖 | 注入依赖 |
|----|------|---------|---------|
| 1 | `routes_system.py` | 无 | 4 个 tray_app 函数 |
| 2 | `routes_app_icon.py` | 无 | 无 |
| 3 | `routes_menu.py` | 无 | 无 |
| 4 | `routes_dock.py` | 无 | 无 |
| 5 | `routes_layout.py` | 无 | 无 |
| 6 | `routes_window.py` | 无 | 无 |
| 7 | `routes_thumbnail.py` | `state.thumb_cache` | 无 |
| 8 | `routes_audio.py` | 无 | `_is_frozen` |
| 9 | `routes_profile.py` | `state.current_profile` | `profile_manager` |
| 10 | `routes_volume.py` | `state.output_muted` | 无 |
| 11 | `routes_mic.py` | 最多状态 | `request_mic_permission` |

### Phase 3: 清理 + 打包验证

1. 清理 `run_server()` 中残留的未使用 import
2. 更新 `setup.py` includes
3. `python setup.py py2app` 验证打包
4. 部署到 `/Applications/`，iPad 实机验证 Dashboard + Editor

## 9. 验证策略

### 9.1 每模块迁移后 — curl 冒烟测试

```bash
# routes_system 迁移后
curl -s http://localhost:8082/api/system/accessibility | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'granted' in d; print('OK accessibility')"
curl -s http://localhost:8082/api/system/screen-capture | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'granted' in d; print('OK screen-capture')"
curl -s http://localhost:8082/api/system/current-app | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'OK current-app: {d}')"

# routes_profile 迁移后
curl -s http://localhost:8082/api/active-profile | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'profile' in d; print('OK active-profile')"
curl -s http://localhost:8082/api/test-ws-override | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('ws_override'); print('OK ws-override')"

# routes_volume 迁移后
curl -s http://localhost:8082/api/system/volume | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'OK volume: {d}')"

# routes_mic 迁移后
curl -s http://localhost:8082/api/system/mic-permission | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'OK mic-permission: {d}')"
curl -s http://localhost:8082/api/system/mic-monitor | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'OK mic-monitor: {d}')"
curl -s http://localhost:8082/api/system/mic-level | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'OK mic-level: {d}')"

# routes_audio 迁移后
curl -s http://localhost:8082/api/system/audio-devices | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'OK audio-devices: {len(d)} devices')"

# routes_window 迁移后
curl -s http://localhost:8082/api/system/current-app-windows | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'OK current-app-windows: {d.get(\"count\",0)} windows')"
curl -s http://localhost:8082/api/system/all-windows | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'OK all-windows: {len(d.get(\"apps\",[]))} apps')"

# 其余路由用相同模式验证
```

### 9.2 全部迁移完成后 — 自动化回归

```bash
python3 tools/verify_routes.py   # 遍历全部 43 路由，确认 HTTP 200/非 500
```

### 9.3 py2app 打包验证

```bash
python setup.py py2app
# 启动打包后的 app，iPad Safari 打开 Dashboard + Editor，确认功能正常
```

## 10. 风险与缓解（V2 修正版）

### 🔴 CRITICAL: `__main__` vs `tray_app` 模块名问题

- **风险**: 直接运行 `python server/tray_app.py` 时模块名是 `__main__`，路由模块 `from tray_app import ...` 会 `ModuleNotFoundError`
- **修正**: 所有外部函数通过 `create_router()` 参数注入，路由模块**零** `from tray_app import`
- **验证**: `python server/tray_app.py` 启动后 curl 验证路由可用

### 🔴 CRITICAL: `_is_frozen()` 在路由模块中不可访问

- **风险**: `routes_audio.py` 的 `_ensure_switch_audio_source()` 需要 `_is_frozen()` 判断 bundle 路径
- **修正**: `_is_frozen` 作为参数注入 `create_router(state, is_frozen)`

### 🔴 HIGH: 路由注册顺序变化导致行为差异

- **风险**: FastAPI 先注册的路由优先匹配
- **现实**: 当前全部路由都是固定路径，无路径参数冲突
- **缓解**: 保持注册顺序与原一致。全部迁移后 curl 遍历验证

### 🔴 HIGH: AVAudioRecorder 线程安全

- **风险**: 后台线程更新 `state.mic_level`，主线程读取
- **现实**: Python float/bool 赋值是原子操作。与当前代码模式一致
- **缓解**: 不引入锁，保持原有线程模型

### 🔴 HIGH: py2app 打包遗漏新模块

- **风险**: 新模块不在 `setup.py` includes 中 → `ModuleNotFoundError`
- **缓解**: 12 个新模块全部加入 includes。迁移完成后立即 `py2app` 打包验证

### 🟡 MEDIUM: `main.py` 与 `tray_app.py` 重复路由

- **风险**: `/api/deepseek/balance` 在两个文件各定义一次，后注册的覆盖前者
- **缓解**: 迁移到 `routes_volume.py` 时保留 `tray_app.py` 版本。已知 bug，单独 PR 修复

### 🟡 MEDIUM: AppleScript 菜单名硬编码中文

- **风险**: 系统语言非中文时 Window Arrange 失效
- **缓解**: 已有 `ponytail:` 注释。不在此次修复

### 🟢 LOW: `except Exception: pass` 静默吞错

- **缓解**: 保留现状。统一加 error logging 是后续任务

### 🟢 LOW: `_mgr` 导入但未使用

- **缓解**: 迁移时不再导入

## 11. 回滚计划

每步独立 commit，任何一步出错:

```bash
git log --oneline -5                 # 找最后一个好的 commit
git reset --hard <good-commit>       # 回到稳定点
```

全部重来:
```bash
git reset --hard ecfba6e             # 回到重构前（当前 HEAD）
```

## 12. 不改

- ❌ 不修改任何路由的行为逻辑
- ❌ 不修改 `main.py`
- ❌ 不修改 `profile_manager.py`、`connection_manager.py`、`ax_bridge.py` 等
- ❌ 不修复现有 bug（重复路由、`except: pass`）
- ❌ 不修改 py2app 的 `site_packages: False` 策略
- ❌ 不改变客户端（iPad Dashboard / Editor）
- ❌ 不改变 WebSocket 行为

## 13. 自审清单（V2）

- [x] C1: 所有路由模块零 `from tray_app import` → 依赖注入
- [x] C2: `_is_frozen` 通过参数注入 `routes_audio`
- [x] H1: `/api/deepseek/balance` 处理策略明确标注
- [x] H2: `_PROFILE_STATE_FILE` / `_LAYOUT_DIR` 改为模块级常量
- [x] M1: 所有模块路由计数更正为精确数字
- [ ] 全部 43 路由路径与请求方法保持不变
- [ ] 所有 7 个 `nonlocal` 变量都有对应 `ServerState` 属性
- [ ] 12 个新模块全部加入 `setup.py` includes
- [ ] 每个路由模块独立可 import（无循环依赖）
- [ ] Mic sampler 线程模型不变
- [ ] AppleScript 菜单名常量完整迁移到 `routes_window`
- [ ] `routes_thumbnail` 缓存逻辑原封不动
- [ ] 回滚路径可执行: `git reset --hard ecfba6e`
