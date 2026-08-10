# Client Architecture Refactoring Plan v3

> **状态更新 (2026-08-11)**：V3 仍是最新计划。自 V3 编写以来，`d89135f` 引入了窗口枚举重构和 Dashboard 重设计，但这些改动在后端（`ax_bridge.py`、`tray_app.py`），不影响前端的模块拆分方案。D1-D6 / E1-E5 补丁清单仍然准确。
>
> **实施前必须确认**：自 `d89135f` 后 `index.html` 和 `editor.html` 若有新增改动，需更新补丁清单和符号检查列表。

## 审核历史

| 版本 | 发现问题 | 处置 |
|------|---------|------|
| V1 | 9 个问题（字节 diff 不可行、模态定位、基准版本等） | 全部在 V2 解决 |
| V2 | 6 个问题（基准与当前差异模糊、Playwright 太重等） | V3 解决：列出完整差异清单，Playwright 改为可选 |

## V3 核心改进

**基准 + 补丁模型**：不再说"手动应用改动"。所有模块从 `71a58f7` 提取，然后一个确定的补丁清单逐个应用到对应模块。每个补丁对应一个文件、一处改动，不可跳过。

## 基准 → 当前差异清单

### iPad：`71a58f7` → 当前版本的 6 处改动

| # | 改动内容 | 应到模块 | 说明 |
|---|---------|---------|------|
| D1 | `let ws=null,...` → `let ws=null,...,profileLoaded=false` | `00-vars.js` | 新增变量 |
| D2 | 空 → `function _drawSpectrum(){...}` `function _fetchBalanceCanvas(){...}` `function _drawBalance(){...}` | `25-widgets.js` | 三个 widget 函数 |
| D3 | `if(m.type==="profile"||m.type==="profile_update")` → `if((m.type==="profile"&&!profileLoaded)||m.type==="profile_update")` | `40-network.js` | WS guard |
| D4 | `el.textContent=k.label;canvas.appendChild(el);` → 新增 `if(k.action==="visualizer"){...}else if(k.action==="balance"){...}else{el.textContent=k.label}canvas.appendChild(el);` | `60-render.js` | Widget 渲染分支 |
| D5 | `el.className="key-btn"+(k.action==="touchpad"?" touchpad":"")` → 新增 `k.action==="visualizer"?" visualizer":k.action==="balance"?" balance":""` | `60-render.js` | Widget CSS class |
| D6 | `fetch("/api/profiles/Default.json")` → `fetch("/api/active-profile")` + 新增 `profileLoaded=true` | `70-main.js` | load() 改用 active-profile |

### Editor：`71a58f7` → 当前版本的 5 处改动

| # | 改动内容 | 应到模块 | 说明 |
|---|---------|---------|------|
| E1 | `let selKey=null,selKeys=new Set(),selGroup=null,dirty=false` → 新增 `,profileLoaded=false` | `00-vars.js` | 新增变量 |
| E2 | `if(m.type==="profile"||m.type==="profile_update")` → `if((m.type==="profile"&&!profileLoaded)||m.type==="profile_update")` | `95-network.js` | WS guard |
| E3 | WIDGET_TYPES 新增 `visualizer:{...},balance:{...}` | `00-vars.js` | Widget 类型注册 |
| E4 | `lp(...)` 函数体新增 `localStorage.setItem("stp_active",fn)` + `profileLoaded=true` | `40-profile.js` | 持久化 + guard |
| E5 | `lpl();lp("Default.json")` → `lpl();lp(localStorage.getItem("stp_active")||"Default.json")` | `99-main.js` | 初始化读 localStorage |

### 不变的 HTML body 部分

- iPad: `<div id="tl">`, `<div id="wrap">`, `<div id="canvas">`, `<div id="info">`
- Editor: 所有 modal (`keyTypeModal`, `profileManagerModal`, `macroModal`), Button Library (`lib-item`, `data-widget`), Canvas (`carea`, `cwrap`), 面板 (`lp-panel`, `rp-profile`)

## 模块拆分方案（最终）

### iPad — 9 模块

```
client/ipad/
├── 00-vars.js         # 从 71a58f7 提取 + D1 补丁
├── 10-patterns.js     # 从 71a58f7 提取（无改动）
├── 20-sound-defs.js   # 从 71a58f7 提取（无改动）
├── 25-widgets.js      # D2 补丁：三个 widget 函数（当前版本有，基准无）
├── 28-psnd.js         # 从 71a58f7 提取（无改动）
├── 40-network.js      # 从 71a58f7 提取 + D3 补丁
├── 50-touch.js        # 从 71a58f7 提取（无改动）
├── 60-render.js       # 从 71a58f7 提取 + D4 + D5 补丁
└── 70-main.js         # 从 71a58f7 提取 + D6 补丁
```

### Editor — 14 模块

```
client/editor/
├── 00-vars.js          # 从 71a58f7 提取 + E1 + E3 补丁
├── 10-texture.js       # 从 71a58f7 提取（无改动）
├── 20-utils.js         # 从 71a58f7 提取（无改动）
├── 30-sound.js         # 从 71a58f7 提取（无改动）
├── 40-profile.js       # 从 71a58f7 提取 + E4 补丁
├── 50-canvas.js        # 从 71a58f7 提取（无改动）
├── 60-keys.js          # 从 71a58f7 提取（无改动）
├── 70-widgets.js       # 从 71a58f7 提取（无改动）
├── 72-props.js         # rpr() 单独模块（从 71a58f7 提取）
├── 80-groups.js        # 从 71a58f7 提取（无改动）
├── 90-macro.js         # 从 71a58f7 提取（无改动）
├── 95-network.js       # 从 71a58f7 提取 + E2 补丁
├── 97-dragdrop.js      # 从 71a58f7 提取（无改动）
└── 99-main.js          # 从 71a58f7 提取 + E5 补丁
```

## 构建脚本 `tools/build.py`（最终版）

```python
#!/usr/bin/env python3
"""Build iPad/editor HTML from modules. Usage: python tools/build.py [ipad|editor]"""
import sys, os, re, subprocess, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist/Smart Touch Panel.app/Contents/Resources/client"

IPAD_CHECKS = [
    '"use strict"', 'let profile=null', 'let ws=null', 'profileLoaded',
    'const PATTERNS=', 'function _patCSS(', 'function _patIMG(',
    'const SND=', 'let ctx=null', 'function psnd(',
    'function _drawSpectrum(', 'function _fetchBalanceCanvas(', 'function _drawBalance(',
    '_drawSpectrum(_cv', '_drawBalance(_cv', '_fetchBalanceCanvas(_cv',
    'function conn(', 'ws.onmessage', 'ws.onopen', 'ws.onclose',
    'function render(', 'function load(', 'load();',
    'touchstart', 'touchend',
]

EDITOR_CHECKS = [
    '"use strict"', 'const PATTERNS=', 'WIDGET_TYPES', 'DEVS',
    'function _patCSS(', 'function _patIMG(',
    'function hesc(', 'function _snap4(', 'function _collides(',
    'const SND=', 'function testSnd(',
    'function lp(', 'function lpl(', 'function saveProfile(', 'function apg(',
    'function rr(', 'function renderAll(', 'function rpl(', 'function rpgl(',
    'function fitAll(', 'function cws(', 'function addKeyOfType(', 'function rpr(',
    'function undo(', 'function redo(',
    'localStorage',
]

def build(target):
    """Build one target ('ipad' or 'editor'). Raises SystemExit on failure."""
    mod_dir = ROOT / "client" / target
    modules = sorted(f for f in os.listdir(mod_dir) if f.endswith('.js'))
    
    # 1. Concatenate
    js = "\n".join((mod_dir / m).read_text().strip() for m in modules)
    
    # 2. Template
    html = (ROOT / "client" / f"{target}.html").read_text()
    html = html.replace('<script id="bundle"></script>', f"<script>\n{js}\n</script>")
    
    # 3. Symbol check
    checks = IPAD_CHECKS if target == 'ipad' else EDITOR_CHECKS
    missing = [c for c in checks if c not in html]
    if missing:
        raise SystemExit(f"SYMBOL CHECK FAILED: {len(missing)} missing\n{missing}")
    
    # 4. JS syntax
    m = re.search(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
    r = subprocess.run(['node', '--check'], input=m.group(1),
                       capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"JS SYNTAX ERROR:\n{r.stderr}")
    
    # 5. Write
    out_name = {"ipad": "index.html", "editor": "editor.html"}[target]
    out_path = ROOT / "client" / out_name
    out_path.write_text(html)
    
    # 6. Dist sync + cache clear
    dist_path = DIST / out_name
    if DIST.exists():
        shutil.copy(out_path, dist_path)
        for pycache in DIST.parent.rglob('__pycache__'):
            shutil.rmtree(pycache, ignore_errors=True)
        for pyc in DIST.parent.rglob('*.pyc'):
            pyc.unlink(missing_ok=True)
    
    print(f"  {out_path} ({len(html)} bytes)")
    print(f"  {len(checks)} symbols OK, JS syntax OK")

if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else 'ipad')
```

## 实施 Phase

### Phase 1: iPad

**Step 1.1** 备份
```bash
cp client/index.html client/index.html.bak
```

**Step 1.2** 从 `71a58f7` 提取基准 JS，切割为 9 模块
- 脚本实现：`git show 71a58f7:client/index.html` → 按字节位置切割
- 保存在 `client/ipad/00-vars.js` ~ `70-main.js`

**Step 1.3** 应用 D1-D6 补丁到对应模块
- D1 → `00-vars.js`：追加 `,profileLoaded=false`
- D2 → `25-widgets.js`：写入三个 widget 函数（从当前 `index.html` 提取）
- D3 → `40-network.js`：替换 WS condition
- D4 → `60-render.js`：替换 `el.textContent` 行
- D5 → `60-render.js`：替换 className 赋值
- D6 → `70-main.js`：替换 fetch URL + 追加 `profileLoaded=true`

**Step 1.4** 创建 `client/ipad.html` 模板
- 复制 `71a58f7` 的 `index.html`, 把 `<script>...</script>` 替换为 `<script id="bundle"></script>`

**Step 1.5** 构建 + 验证
```bash
python tools/build.py ipad
```

**Step 1.6** 验证清单
- [ ] 25 项符号检查全部通过
- [ ] JS 语法通过
- [ ] `diff client/index.html client/index.html.bak` 允许差异（JS 换了格式，HTML 不变）
- [ ] Playwright 功能验证（可选）：keys > 0, psnd/conn 存在

### Phase 2: Editor（同 Phase 1 流程）

E1-E5 补丁应用到对应模块，28 项符号检查。

### Phase 3: 清理

- `.gitignore` 加 `client/index.html` `client/editor.html`
- 回归验证

## 回滚

```bash
cp client/index.html.bak client/index.html
cp client/editor.html.bak client/editor.html
```

## 不改

- CSS, HTML body, 服务端, 功能逻辑

## V3 自审修正

### 修正 1: 从函数边界切割，不从字节位置

`71a58f7` 的 JS 结构（已验证）：

```
"use strict";                                                    → 00-vars.js 开头
let profile=null,activePage="",activeProfile="Default.json";     → 00-vars.js
let ws=null,timer=null,delay=1000;                               → 00-vars.js 结尾
const PATTERNS={...};                                            → 10-patterns.js 开头
function _patCSS(...){}                                          → 10-patterns.js
function _patIMG(...){}                                          → 10-patterns.js 结尾
const SND={...};                                                 → 20-sound-defs.js 开头
let ctx=null;                                                    → 20-sound-defs.js 结尾
function psnd(...){}                                             → 28-psnd.js（注意：基准无 widget 函数，psnd 紧跟 ctx）
function conn(){...}                                             → 40-network.js
// Touch events + 4 addEventListener                             → 50-touch.js
function render(){...}                                           → 60-render.js
function load(){...} + load();                                   → 70-main.js
```

**关键**：`71a58f7` 的 `psnd()` 紧跟在 `ctx` 之后（无 widget 函数夹在中间）。
补丁 D2 会新增 `25-widgets.js` 插入到 `20-sound-defs.js` 和 `28-psnd.js` 之间。

### 修正 2: Python 脚本自动提取函数

不使用手工复制。提取工具：

```python
def extract_functions(js, from_func, to_func=None):
    """Extract from function 'from_func' to just before 'to_func'."""
    start = js.find(f'function {from_func}(')
    if to_func:
        end = js.find(f'function {to_func}(')
    else:
        end = len(js)
    return js[start:end].strip()
```

## 审核结论

| 审核 | 结果 | 关键发现 |
|------|------|---------|
| V1 | 不通过 | 9 个问题：字节 diff、模态定位、基准版本等 |
| V2 | 不通过 | 6 个问题：基准差异模糊、手动步骤不够精确 |
| V3 | 通过 ★ | 修正：函数边界切割 + 自动提取 + 6+5 补丁清单 |

V3 连续自查 2 轮无新实质性发现。修改均为措辞调整和补充细节（函数边界 vs 字节位置）。

✅ V3 通过审核，等待审批后进入 Phase 1 实施。
