# Smart Touch Panel — 项目现状与改进计划（CONTEXT）

> 本文档为项目领域知识 + 现状快照 + 待办计划，供后续开发（含 AI）在动代码前**优先阅读**。
> 生成时间：2026-07-15 ｜ 对应 commit：`5343d8c` ｜ 全部内容基于源码实测，非推测。

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

### ✅ P0（已修复 2026-07-14，commit `258bbee`）：使用时每 5 秒卡顿（触控数据不连续）
**根因**：前端每 5s 的窗口/菜单轮询，打到会**阻塞 event loop** 的后端端点。
**修复**：见 §8 三条已全部实施。服务端验证——4 线程持续轰炸慢 osascript 端点(current-menus/all-windows)期间，快端点(active-profile)延迟仅 2–7ms(此前会排队等 osascript)→ event loop 不再被阻塞。iPad 实机 60s 滑动验收待用户确认。

实测证据（分析用户实际使用时的 `/tmp/stp_ws.log`，7411 条 / 652s）：
| 观测 | 数据 |
|---|---|
| 触控管道本身 | `touchpad` 相邻间隔中位 **9ms（~117 条/秒）**，连续段流畅 |
| 前端轮询 | `index.html:336` 两个 `5000ms` interval（窗口切换器、菜单） |
| 阻塞端点 | `tray_app.py` `/api/system/all-windows`(533)、`/api/system/current-menus`(696)、`/api/system/current-app-windows`(514) 均为 **`async def` + 同步 `subprocess.run(osascript, timeout=3)`** |

**机制**：uvicorn 单进程单 event loop，WebSocket 触控与 HTTP 路由共用一个 loop。`async def` 路由里的同步 osascript 会把整个 loop 堵住最多 3s，其间 117 条/秒的触控全部积压 → 光标停顿、数据不连续，**恰好每 5s 一次**。修复方案见 §8。

### ✅ P1（已删除 2026-07-14）：调试日志残留（性能 + 隐私）
~~`main.py:415-419`：**每一条** WebSocket 消息（含每次触控 move）都同步 `open/write/close` + `json.dumps` 写 `/tmp/stp_ws.log`~~。已随 P0 第 2 条删除（commit `258bbee`）。

### 🟠 P1：keep_alive 端口与配置漂移
`keep_alive.sh:6` **硬编码 `PORT=8082`**，用 `lsof -ti:8082` 判活。但 `tray_app.py` 支持 config.json / `STP_PORT` 改端口。**一旦用户改了端口**：守护脚本仍查 8082 → 永远查不到 → 每 10s 误判「服务已死」并重复拉起 → 端口冲突/进程抖动。修复：keep_alive 应从同一 config.json / STP_PORT 解析端口。

### 🟡 P2：`tools/build.py` 是地雷（勿运行）
它会用 `client/ipad/*.js`、`client/editor/*.js` 等**已废弃的旧模块**重新生成 `client/*.html`，覆盖当前权威源（`client/index.html` / `editor.html`）。重打包一律用 `setup.py py2app`。（详见记忆 `stp-build-py-landmine`）

### 🟡 P2：分发限制
arm64-only（Intel 不可运行）；adhoc 未公证 → 目标机需手动解隔离 + 授权 TCC（辅助功能/屏幕录制/麦克风）。

---

## 8. 性能改进计划（P0 卡顿修复 + 减负）

> 状态：**✅ 已实施并验证（2026-07-14，commit `258bbee`）**。分三条，第 1 条治本、第 2 条清理、第 3 条减负。

### 第 1 条 · 治本：阻塞路由 `async def` → `def`
把这些「体内无 `await`、却跑同步 osascript」的 GET 路由改为普通 `def`——FastAPI 会自动把 `def` 路由丢到线程池执行，**不再阻塞 event loop**，触控立即恢复流畅。行为完全等价，只换执行线程。

涉及 `tray_app.py`（★ 全部被前端周期轮询的慢端点，缺一即残留卡顿）：
- `_sys_all_wins`（`/api/system/all-windows`，0.47s，active-app 5s 轮询）
- `_sys_menus`（`/api/system/current-menus`，app-menu 5s 轮询）
- `_sys_cur_wins`（`/api/system/current-app-windows`）
- `_sys_cur_app`（一致性顺带）
- `_sys_adev`（`/api/system/audio-devices`，0.175s，**audio-in + audio-out 各 5s = 每 5s 打 2 次**）
- `_sys_vol`（`/api/system/volume`，0.35s）
- `_get_balance`（`/api/deepseek/balance`，同步 `urllib.urlopen` **最长阻塞 10s**，balance 30s 轮询）
- `_sys_sc_status`（`/api/system/screen-capture`，`CGWindowListCopyWindowInfo`）
- `_sys_icon`（`/api/system/app-icon`，文件 IO / 生成图标）

> ⚠️ **教训（2026-07-14）**：首轮只改前 4 个（凭 §7 的手工列表），漏掉 audio-devices/volume/balance —— vibe 面板恰有 audio-in/out，卡顿依旧。**别信手工列表，用脚本系统排查所有 `async def` GET + 体内跑同步 subprocess/osascript/CGWindowList/urlopen 且无 `await`的路由，全部转 `def`**。`_sys_mic_level`（50ms 高频）是纯内存读，极快，无需改。

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
- **本机自证法（无需 iPad，推荐）**：Python `websocket-client` 连 `ws://127.0.0.1:8082/ws` 持续发 `touchpad move`（~117/s 节奏），同时后台线程 HTTP 并发轰所有慢轮询端点（audio-devices/volume/all-windows），量测相邻 ack 间隔中位/最大。脚本 `/tmp/ws_lag_test.py`。
  - **实证（2026-07-14）**：修复前中位 **361ms** / 12s 仅 34 条 / 34 次 >200ms；修复后中位 **10.8ms** / 1028 条 / 0 停顿。对照 §7 的 9ms 健康基线。
  - ⚠️ 反面教材：只单发一个慢端点测「快端点延迟」是**伪验证**——当端点恰好快（如 current-menus 14ms）时测不出阻塞。必须并发压测 + 走真实 WS 触控路径。

### 实施后的收尾
1. 重启本机源码服务（keep_alive 端口互斥，不会多开）。
2. 重编译 .app + 重签 + 重打包桌面 zip。
3. commit（`fix: 解除 osascript 阻塞 event loop 致触控卡顿` 等）+ push NAS。

---

## 9. 最近更新（2026-07-14 ~ 2026-07-15）

### 9.1 E 键触发 emoji 面板（已修复 · commit `9f0ae14`）

**现象**：iPad 端按 E 键，Mac 弹出 emoji 选择器 (Ctrl+Cmd+Space)。

**根因**：`input_engine.py:_post_key_event()` 的 `if flags:` 守卫跳过了 key-up 时的 `CGEventSetFlags(event, 0)`，导致前一次按键的修饰键 flag 残留。E 的虚拟键码 `0x0E` 恰好是 Ctrl+Cmd+Space 的触发键码。

**修复**（仅改一行，`input_engine.py:67`）：
```python
# Before
if flags: CGEventSetFlags(event, flags)
# After  
if flags or not down: CGEventSetFlags(event, flags)
```
Key-up 时永远调 CGEventSetFlags 清零残留；key-down 时仅 flags≠0 时调用（保留默认系统行为）。

### 9.2 Editor UI 改进（commits `33b83dd` ~ `62508c5`）

| 改动 | 说明 |
|------|------|
| 移除 Label 行 | Page 不再需要手动命名，自动 `"Page N"` |
| 显示比例始终展开 | 去掉折叠 toggle，`ratioBox` 常显 |
| 默认横屏 | `deviceWidth:1210, deviceHeight:834`，预设点击也用 `Math.max/min` 强制横屏 |
| "Pages" → "Profile Properties" | 板块重命名，去掉 "+ New Page" 按钮 |
| 动态标题 | `<h3 id="pp-heading">` 随 profile 名变化，如 `"Keyboard Properties"` |
| 去除重复 page 名 | 删 `#pgl`（标题下不再有重复的页面列表行） |

### 9.3 Shift 锁定画布平移方向（commit `5343d8c`）

右键拖动画布时按住 Shift → 移动超过 3px 后锁定到主方向（水平/垂直）。松 Shift 平滑解锁无跳动。

实现：`editor.html` mousemove 改用 per-frame delta 累积；解锁时重置冻结轴基线避免位置跳变。

### 9.4 Sticky 修饰键方案（已回退）

曾尝试实现 sticky modifier keys（tap 修饰键保持激活），但 CGEvent 的修饰键注入不符合预期——macOS 不认为修饰键被单独按下（需要与普通键组合才生效）。已完全回退至 `9f0ae14`。

---

## 10. 关键约束（动代码前必读）

- **单 event loop**：任何在 `async def` 路由 / WebSocket 循环里的**同步阻塞调用**（osascript、subprocess、CGWindowList、file I/O）都会卡住全局触控。同步重活一律放 `def` 路由或 `run_in_executor`。
- **权威前端源**是 `client/index.html` / `editor.html`，**不是** `tools/build.py` 的输入模块。
- **profiles**：`server/profiles/*.json` 被 gitignore（仅模板入库）；控件「不显示」先查 profile 匹配，别急着改代码。
- **分发签名**：任何 rebuild 都是新 cdhash → 目标机 TCC 授权需重做；打包后务必 `codesign --verify --deep --strict` 复验。
- **端口**：改端口需同时考虑 `keep_alive.sh`（见 §7 P1），否则守护脚本失灵。

---

## 11. 前端可实测（不要只静态读代码）

> STP 的 iPad 面板 / editor 都是**浏览器端**页面 → 本机可用 headless Chrome 亲自跑，别停在读代码或让用户贴 console。（用户明确指令 2026-07-14）

> **⚠️ 引擎要对**：**editor 用 Safari 打开**（`server/editor_app.py` = `webbrowser.get('safari')`，为原生取色器），iPad 面板才是任意浏览器。**Chrome headless 测不出 Safari 专属 bug**。测 editor 的交互/CSS 必须用 **safaridriver**（W3C WebDriver，需先 `sudo safaridriver --enable` + Safari 设置勾「Allow Remote Automation」；Python 用 urllib 直发 `POST /session`→`/url`→`/execute/sync`→`DELETE /session`，不必装 selenium）。Chrome 只作 DOM/逻辑初筛。
> - **实证（2026-07-14）**：`.ftb{pointer-events:none}`+`.ftb>*{pointer-events:auto}` 在 Chrome 原生 `<select>` 可点，**Safari 里子级 auto 不生效 → 下拉点不开**（需求3「点击没反应」真凶）。工具条实心带背景无需穿透，`.ftb`/`.btb` 一律 `pointer-events:auto`。`position:fixed` 元素 `offsetParent` 恒 null，别用它判可见性，用 `getComputedStyle`+`getBoundingClientRect`。


- **快看 DOM 解析**（真 HTML5 树构建）：
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --dump-dom http://127.0.0.1:8082/editor`
- **交互 + 抓 console/异常 + 截图**（DevTools Protocol）：Chrome 加 `--remote-debugging-port=9333 --remote-allow-origins=* --user-data-dir=<tmp>`；Python `import websocket`（websocket-client 已装）连 `http://127.0.0.1:9333/json` 拿 page 的 `webSocketDebuggerUrl`；发 `Runtime.enable`/`Log.enable`/`Page.enable`→`Page.navigate`→`Runtime.evaluate`(returnByValue+awaitPromise) 模拟操作；监听 `Runtime.consoleAPICalled`/`Runtime.exceptionThrown`/`Log.entryAdded`；`Page.captureScreenshot` 截图。
- **运行的是桌面 app**（`/Users/mini/Desktop/Smart Touch Panel.app`，非 dist/）；静态文件挂 `/static`→CLIENT_DIR。放临时诊断页要放进该 app 的 `Contents/Resources/client/`，用完即删。
- **实测记录（2026-07-14，需求1「管理界面打不开」）**：真实 Chrome + 真实 profile 下，选 Profile 下拉 `Manage...` → `#profileManagerModal` **确实 display=flex 打开**。控制台捕获真 bug：`lp()`（`editor.html:434`）`openProfileManager();this.value=activeProfile` 里 `this` 为 undefined → `TypeError: Cannot set properties of undefined`，但抛错在 openProfileManager() **之后**，不阻止模态框打开。→ 该行是待清理的冗余（onchange 处已 reset），非「打不开」根因；「打不开」在干净浏览器无法复现。
