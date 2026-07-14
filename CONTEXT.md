# Smart Touch Panel — 项目现状与改进计划（CONTEXT）

> 本文档为项目领域知识 + 现状快照 + 待办计划，供后续开发（含 AI）在动代码前**优先阅读**。
> 生成时间：2026-07-14 ｜ 对应 commit：`c372273` ｜ 全部内容基于源码实测，非推测。

---

## 1. 项目是什么

Smart Touch Panel（STP）是一个 **macOS 菜单栏应用**：在 Mac 上起一个 HTTP + WebSocket 服务（默认端口 **8082**），iPad / 平板用浏览器连入后，屏幕即变成一块可自定义的**虚拟触控控制面板**——触控板、自定义按键、宏、方形摇杆、窗口切换器、Dock、音量/麦克风、应用菜单等。所有触控/按键最终通过 macOS Quartz CGEvent 注入系统，模拟真实输入。

- 平台：仅 Apple Silicon（arm64）。
- 连接：Mac 与 iPad 同一局域网，iPad 打开 `http://<Mac-IP>:8082`，编辑器在 `/editor`。
- 两种形态：
  1. **生产运行 = 从源码跑**（`start.sh` / `keep_alive.sh` + cron @reboot 守护）——这是本机日常使用的形态。
  2. **可分发 .app = py2app 打包产物**（`dist/` 内，另导出为桌面 zip），用于装到任意 arm64 Mac。

---

## 2. 技术栈

| 层 | 技术 |
|---|---|
| Web 框架 | FastAPI + Starlette |
| ASGI 服务器 | uvicorn（**单进程、单 event loop**——本文档最关键的架构约束） |
| 实时通道 | WebSocket（触控/按键低延迟下发） |
| 输入模拟 | Quartz CoreGraphics `CGEvent`（键盘/鼠标事件注入） |
| 系统集成 | PyObjC（AppKit / Quartz / Foundation）、`osascript`（AppleScript，取浏览器 tab、菜单、窗口平铺） |
| 菜单栏 GUI | pystray（`LSUIElement=True`，无 Dock 图标） |
| 服务发现 | zeroconf（mDNS 广播） |
| 打包 | py2app（arm64、adhoc 签名） |
| 运行时 | Python 3.12 |

---

## 3. 目录结构与模块职责

```
smart-touch-panel/
├── server/                    # 后端（Python，共 ~3072 行）
│   ├── main.py         (484)  # FastAPI app、路由、WebSocket 主循环、生命周期
│   ├── tray_app.py     (950)  # ★ 入口。菜单栏 app + 端口解析 + 绝大多数 /api/system/* 路由
│   ├── ax_bridge.py    (816)  # 窗口/浏览器 tab/菜单枚举（CGWindowList + osascript）
│   ├── input_engine.py (251)  # CGEvent 键鼠模拟（move/scroll/click/按键/组合键）
│   ├── profile_manager.py(179)# 面板配置（profile）读写、迁移、窗口规则匹配
│   ├── window_watcher.py(119) # 前台 app 切换监听（NSWorkspace 通知）
│   ├── system_control.py(108) # 音量/麦克风/音频设备（osascript + SwitchAudioSource）
│   ├── balance_poller.py (62) # DeepSeek 余额轮询（30s）→ WebSocket 广播
│   ├── connection_manager.py(47)# WebSocket 客户端连接池、send_to/broadcast
│   ├── widget_extension.py(40)# 额外 API（active-profile、balance）
│   ├── editor_app.py     (16) # 打开编辑器页
│   └── profiles/              # 面板配置 JSON（*.json 被 gitignore，仅 _default_template.json 入库）
├── client/                    # 前端（浏览器端，纯静态）
│   ├── index.html     (386)   # ★ iPad 主面板。单文件，高度压缩（minified 长行），canvas 渲染所有控件
│   ├── editor.html   (1304)   # 面板编辑器（拖拽布局、控件属性、按键绑定）
│   ├── *.svg                  # 音量/麦克风图标
│   └── fonts/                 # 字体
├── setup.py                   # py2app 打包配置（依赖闭包、plist、data_files）
├── start.sh                   # 手动启动（GUI，前台）
├── keep_alive.sh              # 守护：10s 轮询端口，死了重启（cron @reboot）
├── docs/                      # 历史需求/规划文档（plan-*、round-*、需求/实施计划）
├── tools/                     # ⚠️ build.py 是地雷，见 §7
├── build/ dist/               # py2app 产物（dist/ 入库，2000+ 文件）
└── logs/                      # keep_alive.log / server.log / stp.pid
```

---

## 4. 运行与部署

### 4.1 生产（本机日常）
- `keep_alive.sh` 每 10s 用 `lsof -ti:8082` 检测端口；端口无进程 → `nohup python3 server/tray_app.py` 拉起，PID 写 `logs/stp.pid`。
- 由 cron `@reboot` 开机自启。端口互斥保证**最多一个实例**（不会多开）。
- 手动启动：`./start.sh`（前台，带菜单栏图标）。

### 4.2 端口配置（3 种方式，优先级从高到低）
`tray_app.py` `_resolve_port()`（约 43–60 行）：
1. 环境变量 `STP_PORT`（1–65535）。
2. 配置文件 `~/Library/Application Support/Smart Touch Panel/config.json` 的 `"port"`。
3. 默认 `8082`。
- 菜单栏「⚙️ Port … — Edit Config」直接打开 config.json。改后**重启服务生效**。

### 4.3 独立 .app 分发
- 打包：`server/venv/bin/python3 setup.py py2app`（arm64，约 109M）。
- 签名：adhoc（`codesign --force --deep --sign -`），`--verify --deep --strict` 通过。
- 分发 zip：`ditto -c -k --sequesterRsrc --keepParent "dist/Smart Touch Panel.app" <zip>`（约 35M）。
- 目标机首次运行需：`xattr -dr com.apple.quarantine <app>` 解隔离；授辅助功能 / 屏幕录制 / 麦克风三项权限。
- 安装说明模板见 `~/Desktop/SmartTouchPanel-安装说明.txt`（分发时随包附带）。

---

## 5. WebSocket 协议（前端 → 后端）

`main.py` WebSocket 主循环（约 412 行起）。消息 `type`：

| type | 动作 | 说明 |
|---|---|---|
| `touchpad` | `move` / `scroll` / `click` / `mousedown` / `mouseup` | 触控板；`move` 带 `dx/dy/drag`。每次回 `ack` |
| `key` | 单键或 `keys[]` 序列 | 按键/宏，回 `results` |
| `profile_saved` | 广播 profile 更新给所有客户端 | 编辑器保存后 |
| `ping` | 回 `pong` | 心跳 |

> **注意**：连接建立后默认下发 `Default.json`（`main.py:406`）。曾有「控件不显示」问题实为 profile 不匹配（控件在 A profile，iPad 加载了 Default），**非代码 bug**。

---

## 6. 前端控件类型（`index.html:336` 渲染分支）

`volume`、`mic-mute`、`active-app`（窗口切换器）、`win-shortcuts`、`win-gesture`（**方形摇杆**：整块触控板，左/右/上/下滑=贴左/右/顶/底，轻点=铺满⇄恢复，长按=全屏）、`dock`、`app-menu`、`layout-preset`、`audio-out`、`audio-in`、`visualizer`、`balance`、`switch-profile`，以及基础 `touchpad` / 按键。

**周期性轮询控件**（各自 `setInterval`）：
- `mic-mute`（showLevel）：**50ms** 拉电平
- `active-app`：**5000ms** → `/api/system/all-windows`
- `app-menu`：**5000ms** → `/api/system/current-menus`
- `audio-out` / `audio-in`：**5000ms** → `/api/system/audio-devices`
- `balance`：30000ms → DeepSeek 余额

---

## 7. 已知问题 / 技术债

### 🔴 P0：使用时每 5 秒卡顿（触控数据不连续）— 已定位，待修
**根因**：前端每 5s 的窗口/菜单轮询，打到会**阻塞 event loop** 的后端端点。

实测证据（分析用户实际使用时的 `/tmp/stp_ws.log`，7411 条 / 652s）：
| 观测 | 数据 |
|---|---|
| 触控管道本身 | `touchpad` 相邻间隔中位 **9ms（~117 条/秒）**，连续段流畅 |
| 前端轮询 | `index.html:336` 两个 `5000ms` interval（窗口切换器、菜单） |
| 阻塞端点 | `tray_app.py` `/api/system/all-windows`(533)、`/api/system/current-menus`(696)、`/api/system/current-app-windows`(514) 均为 **`async def` + 同步 `subprocess.run(osascript, timeout=3)`** |

**机制**：uvicorn 单进程单 event loop，WebSocket 触控与 HTTP 路由共用一个 loop。`async def` 路由里的同步 osascript 会把整个 loop 堵住最多 3s，其间 117 条/秒的触控全部积压 → 光标停顿、数据不连续，**恰好每 5s 一次**。修复方案见 §8。

### 🟠 P1：调试日志残留（性能 + 隐私）
`main.py:415-419`：**每一条** WebSocket 消息（含每次触控 move）都同步 `open/write/close` + `json.dumps` 写 `/tmp/stp_ws.log`。已堆 961K / 7411 行，含全部触控/按键明文。属上个会话调试残留，应删除。

### 🟠 P1：keep_alive 端口与配置漂移
`keep_alive.sh:6` **硬编码 `PORT=8082`**，用 `lsof -ti:8082` 判活。但 `tray_app.py` 支持 config.json / `STP_PORT` 改端口。**一旦用户改了端口**：守护脚本仍查 8082 → 永远查不到 → 每 10s 误判「服务已死」并重复拉起 → 端口冲突/进程抖动。修复：keep_alive 应从同一 config.json / STP_PORT 解析端口。

### 🟡 P2：`tools/build.py` 是地雷（勿运行）
它会用 `client/ipad/*.js`、`client/editor/*.js` 等**已废弃的旧模块**重新生成 `client/*.html`，覆盖当前权威源（`client/index.html` / `editor.html`）。重打包一律用 `setup.py py2app`。（详见记忆 `stp-build-py-landmine`）

### 🟡 P2：分发限制
arm64-only（Intel 不可运行）；adhoc 未公证 → 目标机需手动解隔离 + 授权 TCC（辅助功能/屏幕录制/麦克风）。

---

## 8. 性能改进计划（P0 卡顿修复 + 减负）

> 状态：**已定位、已评审、待用户批准后实施**。分三条，第 1 条治本、第 2 条清理、第 3 条减负。

### 第 1 条 · 治本：阻塞路由 `async def` → `def`
把这些「体内无 `await`、却跑同步 osascript」的 GET 路由改为普通 `def`——FastAPI 会自动把 `def` 路由丢到线程池执行，**不再阻塞 event loop**，触控立即恢复流畅。行为完全等价，只换执行线程。

涉及 `tray_app.py`：
- `_sys_all_wins`（533，`/api/system/all-windows`）
- `_sys_menus`（696，`/api/system/current-menus`）
- `_sys_cur_wins`（514，`/api/system/current-app-windows`）
- `_sys_cur_app`（504，一致性顺带）

> 不动带 `await req.json()` / `body: dict` 的 POST 路由（用户偶发点击，非轮询，非卡顿源）。

### 第 2 条 · 清理：删调试日志
删除 `main.py:415-419` 的写盘块。（性能 + 隐私，见 §7 P1）

### 第 3 条 · 减负：掐掉无谓前端轮询
即便 loop 不再被阻塞，也不该让线程池每 5s 空跑一堆 osascript（耗 CPU、反复唤醒浏览器 AppleScript）。三个子项，纯前端小改：
- **A. 不看的页不轮询**：每个轮询函数开头加 `if(canvas.offsetParent===null)return;`。多页面板下，非当前页（`.active` 切页 → 非 active 页 `display:none` → `offsetParent` 为 null）的控件完全停轮询。
  - 前提：非 active 页确为 `display:none`（切页用 `.active` class，`index.html:262-265`）。实施前先核对该 CSS；若用的是 opacity/transform，则改判 `canvas.closest('.page.active')`。
- **B. 后台不轮询**：守卫加 `|| document.hidden`，iPad 锁屏/切 app 时停。
- **C. 降频**：窗口/菜单/音频三处 `5000` → `10000`。
- **不做 D（后端缓存）**：解阻塞后单次慢已不影响触控，YAGNI。

### 验收标准
- 用 iPad 连续滑动 60s，重新采集触控时间戳：**无 ≥0.5s 停顿**（此前 5s 一次）。
- 采集方法（临时，验证后移除）：在 WS 循环记录消息时间戳，用相邻间隔中位/最大值量化；对照 §7 的 9ms 基线。

### 实施后的收尾
1. 重启本机源码服务（keep_alive 端口互斥，不会多开）。
2. 重编译 .app + 重签 + 重打包桌面 zip。
3. commit（`fix: 解除 osascript 阻塞 event loop 致触控卡顿` 等）+ push NAS。

---

## 9. 关键约束（动代码前必读）

- **单 event loop**：任何在 `async def` 路由 / WebSocket 循环里的**同步阻塞调用**（osascript、subprocess、CGWindowList、file I/O）都会卡住全局触控。同步重活一律放 `def` 路由或 `run_in_executor`。
- **权威前端源**是 `client/index.html` / `editor.html`，**不是** `tools/build.py` 的输入模块。
- **profiles**：`server/profiles/*.json` 被 gitignore（仅模板入库）；控件「不显示」先查 profile 匹配，别急着改代码。
- **分发签名**：任何 rebuild 都是新 cdhash → 目标机 TCC 授权需重做；打包后务必 `codesign --verify --deep --strict` 复验。
- **端口**：改端口需同时考虑 `keep_alive.sh`（见 §7 P1），否则守护脚本失灵。
