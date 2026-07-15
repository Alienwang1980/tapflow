# Smart Touch Panel — 项目全貌（CONTEXT）

> 本文档为项目领域知识 + 完整现状快照 + 待办计划。后续开发（含 AI）动代码前**必须优先阅读**。
> 最后更新：2026-07-15（窗口缩略图功能） ｜ 全部数据基于 2026-07-15 实测

---

## 1. 项目是什么

Smart Touch Panel（STP）是一个 **macOS 菜单栏应用**：在 Mac 上起一个 HTTP + WebSocket 服务（端口 **8082**），iPad 用浏览器连入后，屏幕变成可自定义的**虚拟触控控制面板**。所有触控/按键通过 macOS Quartz CoreGraphics `CGEvent` 注入系统，模拟真实键鼠输入。

- **平台**：仅 Apple Silicon（arm64），macOS 15 Sequoia
- **连接**：iPad 与 Mac 同一局域网，iPad 打开 `http://<Mac-IP>:8082`，编辑器 `/editor`
- **编辑器**：必须用 **Safari** 打开（macOS 原生颜色选择器），Chrome 不支持
- **两种运行形态**：
  1. **生产**：源码 `start.sh` / `keep_alive.sh` + cron `@reboot` 守护（本机日常使用）
  2. **分发**：py2app 打包 `.app`（`dist/`），可装到任意 arm64 Mac

**当前运行状态（2026-07-15）**：`.app` 版正在运行（pid 在 `lsof -ti:8082`），端口 8082，Mac IP `192.168.2.20`。

---

## 2. 技术栈与规模

| 层 | 技术 | 规模 |
|---|---|---|
| Web 框架 | FastAPI + Starlette | — |
| ASGI | uvicorn（**单进程、单 event loop**） | — |
| 实时通道 | WebSocket | 触控/按键低延迟下发 |
| 输入模拟 | Quartz CoreGraphics `CGEvent` | `input_engine.py` 251 行 |
| 系统集成 | PyObjC (AppKit/Quartz/Foundation)、osascript | `ax_bridge.py` 816 行 |
| 菜单栏 | pystray (`LSUIElement=True`，无 Dock 图标) | `tray_app.py` 950 行 |
| 服务发现 | zeroconf (mDNS) | — |
| 打包 | py2app (arm64, adhoc 签名) | `setup.py` |
| 运行时 | Python 3.12（`.venv`） | — |

**代码量**：

| 文件 | 行数 | 职责 |
|------|------|------|
| `client/index.html` | 387 | iPad 主面板（单文件，压缩长行，canvas 渲染） |
| `client/editor.html` | 1,333 | 面板编辑器（拖拽布局、控件属性、按键绑定） |
| `server/tray_app.py` | 950 | ★ 入口：菜单栏 app + 端口解析 + `/api/system/*` 路由 |
| `server/ax_bridge.py` | 816 | 窗口/tab/菜单枚举（CGWindowList + osascript） |
| `server/main.py` | 479 | FastAPI app、WebSocket 主循环、静态文件 |
| `server/input_engine.py` | 251 | CGEvent 键鼠模拟 |
| `server/profile_manager.py` | 179 | Profile 读写、迁移、窗口规则匹配 |
| `server/window_watcher.py` | 119 | 前台 app 切换监听（NSWorkspace 通知） |
| `server/system_control.py` | 108 | 音量/麦克风/音频设备 |
| `server/balance_poller.py` | 62 | DeepSeek 余额轮询 |
| `server/connection_manager.py` | 47 | WebSocket 连接池 |
| `server/widget_extension.py` | 40 | 额外 API 端点 |
| `server/editor_app.py` | 16 | 打开编辑器（Safari） |
| **总计** | **~4,800** | |

---

## 3. 目录结构

```
smart-touch-panel/
├── server/                          # 后端 Python（13 文件，~3,067 行）
│   ├── tray_app.py                  # ★ 主入口。菜单栏 GUI + 系统路由
│   ├── main.py                      # FastAPI app、WebSocket、HTTP 路由
│   ├── input_engine.py              # CGEvent 键鼠注入（见 §9.1 关键修复）
│   ├── ax_bridge.py                 # macOS 辅助功能桥接（窗口/菜单/AppleScript）
│   ├── profile_manager.py           # Profile JSON 读写 + 窗口规则匹配
│   ├── window_watcher.py            # NSWorkspace 前台 app 切换通知
│   ├── system_control.py            # 音量/麦克风/音频设备控制
│   ├── balance_poller.py            # DeepSeek 余额 30s 轮询
│   ├── connection_manager.py        # WebSocket 客户端连接池
│   ├── widget_extension.py          # 额外 HTTP API
│   ├── editor_app.py                # Safari 打开编辑器
│   └── profiles/                    # 预置模板（`_default_template.json` 入库；其他 .json gitignore）
├── client/                          # 前端纯静态
│   ├── index.html                   # ★ iPad 主面板
│   ├── editor.html                  # ★ 面板编辑器
│   ├── *.svg                        # 音量/麦克风图标
│   └── fonts/                       # PressStart2P, VT323, RussoOne
├── setup.py                         # py2app 打包
├── start.sh                         # 手动前台启动
├── keep_alive.sh                    # 守护脚本（cron @reboot）
├── docs/                            # 历史文档
├── tools/                           # ⚠️ build.py 是地雷（见 §7）
├── build/ dist/                     # py2app 产物（dist/ 入库）
└── logs/                            # keep_alive.log, stp.pid
```

**用户数据目录**：`~/Library/Application Support/Smart Touch Panel/`

```
├── config.json                      # {"port": 8082}
└── profiles/
    ├── Default.json                 # "Keyboard" profile（68 keys, 5 windowRules, 1 page）
    ├── Apple.json                   # "vibe" profile（22 keys, 1 page）
    └── New Profile.json             # "test" profile（80 keys, 5 windowRules, 1 page）
```

---

## 4. Editor 架构（`client/editor.html` 1,333 行）

### 4.1 布局结构

```
┌──────────────────────────────────────────────────────────┐
│  左侧面板 (#lp-panel)    │    画布 (#carea)              │
│                          │                                │
│  Profiles                │    ┌─────────────────────┐    │
│  ├─ profile 列表         │    │                     │    │
│                          │    │  按钮网格 (canvas)   │    │
│  {name} Properties       │    │                     │    │
│  ├─ Pat 图案选择         │    │                     │    │
│  ├─ BG 背景色            │    │                     │    │
│                          │    └─────────────────────┘    │
│  显示比例                │                                │
│  ├─ 当前比例信息         │    ┌──────────────────────┐   │
│  ├─ 预设按钮             │    │  右侧属性面板 (#rp)   │   │
│  ├─ 自定义像素 / 横竖屏  │    │  选中 key 的属性编辑  │   │
│                          │    └──────────────────────┘   │
│  默认声音                │                                │
│                          │                                │
│  Groups                  │                                │
│  Clipboard               │                                │
│                          │                                │
│  Button Library (拖拽)   │                                │
└──────────────────────────────────────────────────────────┘
```

### 4.2 左侧面板初始化流程

1. HTML 中所有 `.rp-section` 初始在 `#rp-profile` 内，CSS `opacity:0` 隐藏
2. `setTimeout(200ms)` 后将它们移到 `#lp-panel` 并设 `opacity:1`
3. 跳过 `#pl`（profile 列表模板，始终 `display:none`）

### 4.3 编辑器关键变量

```javascript
let profile=null         // 当前加载的 profile 对象
let profiles=[]          // 所有 profile 摘要列表 [{filename, profileName}, ...]
let activeProfile=""     // 当前 active profile 文件名
let activePage=""        // 当前选中的 page id
let selKey=null          // 单选 key id
let selKeys=new Set()    // 多选 key id 集合
let panX=0, panY=0       // 画布平移偏移
let panning=false        // 右键拖拽平移中
let panShiftLock=null    // Shift 锁定方向 ('x'/'y'/null)
let dirty=false          // 未保存标记
```

### 4.4 编辑器关键渲染函数

| 函数 | 作用 |
|------|------|
| `rr()` | 渲染画布（canvas 绘制所有 key） |
| `rpl()` | 渲染 profile 列表 + 工具栏下拉 |
| `rpgl()` | 更新动态标题 `{name} Properties` + 同步 Pat/BG 控件 |
| `rpr()` | 渲染右侧属性面板（根据选中 key 类型动态生成 HTML） |
| `rgrp()` | 渲染 Groups 列表 |
| `renderAll()` | 调用上述全部 + `updateRatioInfo()` |

### 4.5 编辑器交互

- **左键拖拽空白**：框选 keys
- **右键拖拽空白**：平移画布（+ **Shift 锁定方向**：3px 阈值后锁到主方向）
- **拖拽 key**：移动位置（带 resize 手柄 `.rh`）
- **拖拽 Library item**：从 Button Library 拖到画布创建新 key
- **右键点 key**：删除
- **Ctrl+Z / Ctrl+Shift+Z**：undo / redo

---

## 5. iPad 面板架构（`client/index.html` 387 行）

单文件 WebSocket 客户端，连接 `ws://host:8082/ws`。全部控件通过 canvas 渲染，触控事件通过 WebSocket 下发。

### 5.1 Profile 页面切换

- Profile 可含多个 page，当前只有 1 个
- `window_watcher.py` 检测前台 app 切换 → WebSocket 推送 `page_switch` → 自动切到匹配的 page
- windowRules 匹配逻辑在 `profile_manager.py`

### 5.2 WebSocket 消息类型

| type | 方向 | 字段 | 说明 |
|------|------|------|------|
| `touchpad` | C→S | `action, dx, dy, drag` | 触控板操作 |
| `key` | C→S | `key` 或 `keys[]` | 按键/宏 |
| `profile_saved` | C→S | profile JSON | 编辑器保存后广播 |
| `profile` | S→C | 完整 profile | 首次连接下发 |
| `profile_update` | S→C | 完整 profile | 其他客户端保存后推送 |
| `page_switch` | S→C | `page_id` | 前台 app 切换触发 |
| `ping/pong` | 双向 | — | 心跳 |

---

## 6. 控件类型总览

`index.html` 渲染分支支持的控件 `action`：

| action | 说明 | 特殊 UI |
|--------|------|---------|
| `touchpad` | 触控板区域 | 手势识别 |
| `turbo` | 普通按键 | 字体/颜色/圆角可配 |
| `macro` | 组合键宏 | `LCONTROL+LSHIFT+A` 格式 |
| `volume` | 音量滑块 | 横向/纵向，tap=mute |
| `mic-mute` | 麦克风静音 + 电平显示 | 50ms 高频轮询 |
| `active-app` | 窗口切换器（**窗口缩略图** + 底部标题条） | 10s 轮询；缩略图懒加载 + 每轮补截 2 张 |
| `win-shortcuts` | 窗口管理快捷按钮 | 置顶/铺满/左半/右半 |
| `win-gesture` | **方形摇杆** | 滑动=贴边，轻点=铺满⇄恢复，长按=全屏 |
| `dock` | 系统 Dock | 固定布局 |
| `app-menu` | 当前 app 菜单栏 | 5s 轮询 |
| `layout-preset` | 布局预设 | 窗口排列模板 |
| `audio-out` | 输出设备切换 | 5s 轮询 |
| `audio-in` | 输入设备切换 | 5s 轮询 |
| `visualizer` | 音频可视化 | 4×2 频谱 |
| `balance` | DeepSeek 余额 | 30s 轮询 |
| `switch-profile` | 切换 profile | tap=切 profile, long press=另一个 |

**轮询频率汇总**：

| 控件 | 间隔 | 端点 |
|------|------|------|
| `mic-mute` (showLevel) | **50ms** | `/api/system/mic-level` |
| `active-app` | 10,000ms | `/api/system/all-windows` + `/api/system/window-thumbnail` |
| `app-menu` | 10,000ms | `/api/system/current-menus` |
| `audio-out` / `audio-in` | 10,000ms | `/api/system/audio-devices` |
| `balance` | 30,000ms | `/api/deepseek/balance` |

---

## 7. 当前 Profile 清单（2026-07-15 实测）

| 文件 | profileName | 尺寸 | 按键数 | Pages | WindowRules |
|------|-------------|------|--------|-------|-------------|
| `Default.json` | Keyboard | 1210×834 横屏 | 68 | 1 | 5 |
| `Apple.json` | vibe | 1210×834 横屏 | 22 | 1 | 0 |
| `New Profile.json` | test | 1210×834 横屏 | 80 | 1 | 5 |

所有 profile 均为横屏 1210×834（iPad 11" landscape），device 字段为 `"iPad 11\" (landscape)"`。

Active profile 由客户端 `localStorage.getItem("stp_active")` 决定，非服务端配置。

---

## 8. 已知问题 / 技术债

### ✅ P0（已修复 · `258bbee`）：Event loop 阻塞致每 5s 卡顿

**根因**：`async def` 路由体内的同步 `subprocess.run(osascript, timeout=3)` 阻塞 uvicorn 单 event loop。

**修复**：9 个阻塞 GET 路由 `async def` → `def`（FastAPI 自动丢线程池）。详见下文 §9。

### ✅ P1（已修复 · `258bbee`）：调试日志残留

`main.py` 每条 WebSocket 消息写 `/tmp/stp_ws.log`。已删除。

### ✅ 已修复 · `9f0ae14`：E 键触发 emoji 面板

`CGEventSetFlags` 在 key-up 时不调用导致修饰键残留。修复见 §10.1。

### 🟠 P1：`keep_alive.sh` 端口硬编码

`keep_alive.sh:6` 硬编码 `PORT=8082`。改端口后守护脚本不停误判重启。应改为读 config.json / `STP_PORT`。

### 🟡 P2：`tools/build.py` 是地雷

用废弃的 `client/ipad/*.js` / `client/editor/*.js` 覆盖权威源。**禁止运行**。重打包用 `setup.py py2app`。

### 🟡 P2：`_winIcons` favicon 缓存按 `global_index` 键控（不稳定）

`index.html` `_loadWinIcons` 用 `global_index` 做缓存 key,窗口增减后索引整体位移 → favicon 可能张冠李戴。缩略图缓存 `_winThumbs` 已用稳定 key(`pid:window_index:tab_index:title`),favicon 待迁移到同方案。

### 🟡 P2：分发限制

arm64 only、adhoc 未公证、需手动 TCC 授权（辅助功能/屏幕录制/麦克风）。

---

## 9. P0 性能修复详情（已实施）

> 三条全部实施（commit `258bbee`）并服务端验证。iPad 实机 60s 滑动验收待用户确认。

### 第 1 条 · 治本：9 个阻塞路由 `async def` → `def`

涉及 `tray_app.py` 全部被前端周期轮询的慢端点：

| 路由 | 耗时 | 轮询者 |
|------|------|--------|
| `/api/system/all-windows` | ~0.47s | active-app (5s) |
| `/api/system/current-menus` | 变化大 | app-menu (5s) |
| `/api/system/current-app-windows` | — | — |
| `/api/system/current-app` | — | — |
| `/api/system/audio-devices` | ~0.18s | audio-in + audio-out (各 5s) |
| `/api/system/volume` | ~0.35s | — |
| `/api/deepseek/balance` | 最多 10s | balance (30s) |
| `/api/system/screen-capture` | — | — |
| `/api/system/app-icon` | — | — |

**教训**：首轮只改前 4 个（凭手工列表），漏掉 audio-devices/volume/balance。**必须用脚本系统排查所有 `async def` GET 路由**。

### 第 2 条 · 清理：删调试日志

### 第 3 条 · 减负（纯前端，待实施）

- A. 非当前页不轮询（`canvas.offsetParent===null` 守卫）
- B. 后台不轮询（`document.hidden` 守卫）
- C. 降频 `5000` → `10000`

**验证**：并发压测脚本 `/tmp/ws_lag_test.py`。修复前中位 361ms，修复后中位 10.8ms。

---

## 10. 最近更新（2026-07-14 ~ 2026-07-15）

### 10.1 E 键 emoji 面板修复（`9f0ae14`）

**现象**：iPad 按 E → Mac 弹出 emoji 选择器 (Ctrl+Cmd+Space)。

**根因**：`input_engine.py:67` `_post_key_event()`：
```python
# Before（bug）
if flags: CGEventSetFlags(event, flags)
# → key-up 时 flags=0，不调用 CGEventSetFlags → 上一个按键的修饰键 flag 残留
# E 的虚拟键码 0x0E 恰好 = 系统快捷键 Ctrl+Cmd+Space 的触发键

# After（修复）
if flags or not down: CGEventSetFlags(event, flags)
# → key-up 时永远调用 CGEventSetFlags(event, 0) 清零残留
# → key-down flags=0 时不调用（保留系统默认行为，修饰键可正常工作）
```

**这是本项目最关键的 CGEvent 约束**：修改 `_post_key_event` 必须保证 key-up 时清零 flags，key-down 时仅在 flags≠0 时设置。

### 10.2 Editor UI 改进（`33b83dd` ~ `62508c5`）

| commit | 改动 |
|--------|------|
| `adf440b` | 移除 Label 行（Page 自动命名 `"Page N"`）；显示比例始终展开；默认横屏 1210×834 |
| `3883428` | "Pages" → "Profile Properties"；去掉 "+ New Page" 按钮 |
| `33b83dd` | Page 标签同步 profile 名；`saveAs()` / `pmRename()` 联动刷新 |
| `6b844b1` | 标题动态 `"{name} Properties"`；删除 `#pgl`（重复的页面列表行） |
| `62508c5` | 显示比例预设点击强制横屏（`Math.max(w,h)` 当宽、`Math.min(w,h)` 当高） |

### 10.3 Shift 锁定画布平移方向（`5343d8c`）

右键拖动画布 + 按住 Shift → 移动 > 3px 后锁定到主方向（水平/垂直）。

实现要点：
- mousemove 改用 **per-frame delta 累积**（而非从 mousedown 算总量）
- `panShiftLock` 状态机：`null` → `'x'` / `'y'` → `null`
- 解锁时重置冻结轴基线，**避免位置跳变**
- mouseup 时 `_snap4()` snaps 到 0.25 格对齐

### 10.4 Sticky 修饰键（已回退至 `9f0ae14`）

尝试 tap 修饰键保持激活 → macOS 不认为修饰键被单独按下。完全回退。

### 10.5 窗口切换器缩略图（2026-07-15）

窗口切换器文字块替换为**窗口实时缩略图**（底部保留一行半透明标题条,圆角,块间距 10px,无分组分割线）。

**后端**：
- `ax_bridge.capture_window_thumbnail(pid, title, max_w=256)`：pid+title 现场解析 CG window_id（精确→子串→frontmost 兜底）→ `CGWindowListCreateImage` → NSImage 缩放 → JPEG bytes
- `GET /api/system/window-thumbnail?pid=N&title=...&refresh=0|1`（**`def` 路由**）：服务端缓存 `{(pid,title): (bytes,ts)}`,TTL 60s,`refresh=1` 强制重拍,过期条目 10min 修剪,拍失败时兜底返回 stale 缓存
- **跨 Space 窗口截不了**（实测 `CGWindowListCreateImage` 返回 None）→ 404,前端文字降级

**前端**（`index.html`）：
- 缓存 `canvas._winThumbs`,key = `pid:window_index:tab_index:title`（title 变化自动失效重拍）;`_thumbFail` 失败冷却 60s;每轮按当前列表修剪
- **首轮全量拉取**（`_thumbsWarm` 标记,页面刷新后缩略图秒回,靠服务端缓存）,之后每轮只拉聚焦项(`refresh=1`) + 补截 2 张
- 点击切换窗口/tab 成功后 **500ms 延迟重拍**（等目标渲染完成）
- `_source==="cg"`（跨 Space）条目跳过,不请求
- 圆角绘制:`_rrPath/_rrFill/_rrStroke` 辅助,圆角=btnSize 的 8%（最小 3px）,缩略图走 clip

**TCC 教训（重要,见 §13.9/§13.10）**：屏幕录制权限排障两小时的根因有三层:
1. 改 bundle 任何文件 → 签名 seal 失效 → TCC 静默吊销;重签后 cdhash 变 → 旧授权条目 csreq 不匹配 → **设置界面显示已开启但实际无效**,必须 `tccutil reset <service> com.smarttouch.panel` 删旧条目再重新授权
2. **从终端启动的实例走 Terminal 的 TCC 归因**（responsible process）,Terminal 被拒 → app 自己的授权根本不被查询;必须用 cron/launchd 归因启动（临时 cron 行拉起）
3. 桌面残留的旧版 .app 抢授权/抢端口（已删）

### 10.6 launchd 自托管 + Profile 导入/导出（2026-07-15 深夜）

- 自托管改造见 §12.1/§12.2(cron/keep_alive 退役,SMAppService 两次实测失败后改经典 LaunchAgent)
- **Profile 导入/导出**(跨 Mac 迁移):
  - 导出:编辑器 Manage Profiles 每行 ⬇ 按钮 → 前端 fetch 现有 `GET /api/profiles/{fn}` → Blob 下载 `<profileName>.json`(零新后端代码)
  - 导入:底部 Import 按钮 → `POST /api/profiles/import`(校验 dict+`pages` list)→ `ProfileManager.import_profile()`:名字消毒(`/`→`_`,剥首部 `.`)+ **大小写不敏感**查重(文件名 + 所有 profileName,二者可因 PATCH 改名脱钩)→ 冲突自动 `Name (2)`/`(3)`…,绝不覆盖
  - 路由注册在 `{filename:path}` 参数路由之前;测试:import_profile 9 断言单测 + 实机 curl 四用例 + CDP UI 闭环

---

## 11. `input_engine.py` 关键约束（CRITICAL）

### 11.1 CGEventSetFlags 规则

```python
def _post_key_event(key_code: int, down: bool, flags: int = 0):
    event = CGEventCreateKeyboardEvent(None, key_code, down)
    if flags or not down:          # ← 这行不能简化为 if flags:
        CGEventSetFlags(event, flags)
    CGEventPost(kCGHIDEventTap, event)
```

| 场景 | down | flags | 行为 | 原因 |
|------|------|-------|------|------|
| 按普通键 | True | 0 | **不调** CGEventSetFlags | 保留系统默认 |
| 抬普通键 | False | 0 | **调用** CGEventSetFlags(event, 0) | 清零残留 |
| 按组合键 | True | ≠0 | 调用 CGEventSetFlags | 设置修饰键 |
| 抬组合键 | False | ≠0 | 调用 CGEventSetFlags | 清零 |

### 11.2 修饰键注入限制

CGEvent 单独按下修饰键（如只按 LSHIFT）→ macOS **可能不识别为修饰键按下**。这是 CGEvent API 的已知限制，非 STP 的 bug。用户如需纯修饰键功能（如 LCtrl+LCmd 切换输入法），需用 AppleScript 或系统其他方式实现。

---

## 12. 运行与部署

### 12.1 运行模型（2026-07-15 起:launchd 自托管）

- **运行时标准位置:`/Applications/Smart Touch Panel.app`**(内置盘)。`dist/` 只是构建产物。
  - ⚠️ launchd 拉起的进程读 WD_BLACK(外置卷)会永久挂死在 opendir(实测,sample 实锤)
- 开机自启 + 崩溃自愈:app 启动时 `register_launch_agent()` 自安装
  `~/Library/LaunchAgents/com.smarttouch.panel.plist`(KeepAlive SuccessfulExit=false,ThrottleInterval 10)
  - 正常启动只写 plist 不 bootout(避免杀自己);`STP_REGISTER_ONLY=1` 模式才 bootout+bootstrap
- keep_alive.sh / cron @reboot 已退役(c77e1c0);SMAppService 不可用(macOS 26 + adhoc:LWCR 0x3 / BundleProgram 0x6f)

```bash
# 查看
lsof -ti:8082                                  # pid
launchctl print gui/501/com.smarttouch.panel   # job 状态
tail -f /tmp/stp_agent.log                     # 日志

# 手动重启(kill -9 会被 launchd 自动拉起;干净退出/kickstart -k 见下)
launchctl kickstart -k gui/501/com.smarttouch.panel
```

### 12.2 更新部署流程(重打包后)

```bash
launchctl bootout gui/501/com.smarttouch.panel
rm -rf "/Applications/Smart Touch Panel.app"
ditto "dist/Smart Touch Panel.app" "/Applications/Smart Touch Panel.app"
STP_REGISTER_ONLY=1 "/Applications/Smart Touch Panel.app/Contents/MacOS/Smart Touch Panel"
# ⚠️ 验证监听的是新实例(curl /openapi.json 查新路由):遗留老实例占着 8082 时,
#    新实例端口守卫重试 15s 后干净退出 → kill 老实例 + launchctl kickstart
```

### 12.3 打包分发

```bash
server/venv/bin/python3 setup.py py2app      # ⚠️ 必须 server/venv(.venv 缺 AVFoundation 等 pyobjc 框架,打出的包麦克风功能是坏的)
codesign --force --deep --sign - "dist/Smart Touch Panel.app"
codesign --verify --deep --strict "dist/Smart Touch Panel.app"
ditto -c -k --sequesterRsrc --keepParent "dist/Smart Touch Panel.app" ~/Desktop/STP.zip
```

**rebuild 后 TCC 重授权流程**（每次重打包必做,见 §13.9）：
```bash
for s in ScreenCapture Accessibility Microphone; do tccutil reset $s com.smarttouch.panel; done
# cron/launchd 归因启动 app → 触发一次截屏/录音尝试 → 系统设置里重新授权三项
```

### 12.4 开发注意

- 改 `client/*.html` → 源码即权威，无需 build
- 运行中更新 `.app`：直接 cp 到 bundle，重启进程即可
- 编辑器用 Safari 测（`open -a Safari http://localhost:8082/editor`）
- Chrome 只用于快速 DOM/逻辑初筛

---

## 13. 关键约束（动代码前必读）

1. **单 event loop**：同步阻塞（osascript、subprocess、CGWindowList、file I/O）放 `def` 路由或 `run_in_executor`，严禁放 `async def`。
2. **权威前端源**：`client/index.html` / `editor.html`——**不是** `tools/build.py` 的输入。
3. **CGEventSetFlags**：修改 `_post_key_event` 必须遵守 §11.1 的规则表。
4. **Profiles**：`server/profiles/*.json` gitignore（仅模板入库）；控件不显示先查 profile 匹配。
5. **签名**：rebuild → 新 cdhash → TCC 需重授权。
6. **端口**：8082 硬编码于 plist 端口守卫逻辑与前端,改端口需全局搜。
7. **Git remote**：`nas`（不是 `origin`）= `Claude@192.168.2.62:/volume1/Git_Station/smart-touch-panel.git`。
8. **编辑器浏览器**：必须 Safari（原生颜色选择器）。
9. **TCC 重授权必须先 `tccutil reset`**：重签后旧条目 csreq 不匹配,设置界面开关显示开启但实际无效,直接切开关救不回来;必须 reset 删条目 → 触发一次真实访问重新登记 → 再授权（屏幕录制/辅助功能/麦克风三项同理）。
10. **开发期启动归因**：从终端（含 Claude 会话）`nohup` 启动的实例,屏幕捕获走 **Terminal 的 TCC 归因**;Terminal 无屏幕录制授权则截图必失败。验证截图/权限相关功能必须用 cron 拉起（临时 cron 行,起来后删）。生产 cron @reboot 天然正确。
11. **打包用 `server/venv`**：`.venv` 的 pyobjc 不全（缺 AVFoundation）,用它打包麦克风电平功能静默失效（import 错误被 except 吞掉,只表现为"权限挂不上"）。
12. **`setup.py` 必须 `site_packages: False`**：True 会把构建机 venv 绝对路径(/Volumes/WD_BLACK/…)烧进 `__boot__.py`,launchd 拉起时 addsitedir→opendir 外置卷永久挂死(faulthandler 实锤)。改回 True 等于把 app 重新拴回外置盘。

---

## 14. 前端验证方法

- **快速 DOM 检查**：`curl -s http://localhost:8082/editor | grep <id>`
- **Chrome headless DOM dump**：`google-chrome --headless=new --dump-dom http://127.0.0.1:8082/editor`
- **Chrome CDP 交互 + console**：`--remote-debugging-port=9333` + websocket-client
- **Safari 测交互/CSS**：safaridriver（`sudo safaridriver --enable` 后 W3C WebDriver）
- **iPad 面板测触控延迟**：`/tmp/ws_lag_test.py`（并发 WS + HTTP 压测）

> ⚠️ Chrome headless 测不出 Safari 专属 bug（实测：pointer-events 行为不同、原生 select 下拉不同）。editor 交互/CSS 必须用 Safari 验证。
