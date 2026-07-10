# Plan A — Widget UI 规格 v2

## 分类

按交互模式分为 5 类，每类有统一的行为规范，同类 widget 复用相同渲染框架。

| # | 类别 | Widget | 数量 | 核心技术 |
|---|------|--------|------|---------|
| 1 | 滑块 | Volume | 1 | 拖动计算值，实时 POST |
| 2 | 按钮 | Mute, Mic-Mute | 2 | 单击 toggle，状态色切换 |
| 3 | 固定网格 | Win Shortcuts | 1 | 4 按钮 2×2，点击 POST |
| 4 | 动态集合 | Dock, Audio Out, Audio In, Layout Preset | 4 | 2-20 项，画布内滚动，每项可点 |
| 5 | 流式列表 | App Menu | 1 | 50-200 项，前台切换内容全换，需独立 Profile |

---

## 一、滑块类

### Volume Slider（2×1）

```
┌──────────────────────────┐
│ 🔊 VOL            75%   │  ← 图标 + 标签 + 百分比
│ ═══════════════●════════│  ← 轨道 + 填充 + 手柄
└──────────────────────────┘
```

**视觉**：
- 轨道：`rgba(255,255,255,0.1)`，圆角 4px，高度 = canvas 高度的 25%
- 填充：`#4ade80 → #22c55e` 渐变，静音时 `#ef4444`
- 手柄：白色圆，半径 = 轨道高 × 0.6
- 标签行：左 "🔊 VOL"，右 "75%"

**交互**：
- `touchstart` → 记录起始位置
- `touchmove` → 计算 `(touchX - margin) / trackWidth * 100` → 更新填充 + 手柄位置 + 百分比
- `touchend` → POST `/api/system/volume` body: `{value: 75}`
- 不触发 keyboard sound（widget 已排除）

**状态**：
- 正常：绿色填充，手柄在值的位置，显示百分比
- 静音：红色填充，手柄在 0，显示 "MUTED"
- 加载中：灰色文字 "Loading..."
- 错误：红色 "Error"

**尺寸适配**：
- 轨道宽度 = `canvas.width * 0.84`（左右各 8% 边距）
- 轨道高度 = `canvas.height * 0.25`，最小 8px
- 字体 = `canvas.height * 0.3`，最小 10px

---

## 二、按钮类

### Mute Toggle（1×1）

```
┌──────┐       ┌──────┐
│      │       │ ████ │
│  M   │   →   │  M   │
│  ○   │       │  ●   │
└──────┘       └──────┘
未静音          已静音
灰底+灰圆       红底+红圆
```

**视觉**：
- 背景：未静音 `rgba(255,255,255,0.08)`，已静音 `rgba(239,68,68,0.3)`
- 中心圆：未静音 `#888`，已静音 `#ef4444`，半径 = `min(w,h) * 0.35`
- 文字：白色 "M"，居中，字体 = `min(w,h) * 0.4`

**交互**：
- `touchstart` → POST `/api/system/mute` → `.then()` 更新 _drawMuteBtn
- 即时视觉反馈（不等 API 返回也可先 toggle 本地状态）

**状态**：
- 未静音：灰底灰圆，"M"
- 已静音：红底红圆，"M"
- 未知：POST 发出去但未收到回复前，显示上一次状态

### Mic Mute（1×1）

同 Mute Toggle，文字用 "🎤"，API 用 `/api/system/mic-mute`。

---

## 三、固定网格类

### Win Shortcuts（4×2）

```
┌──────────┬──────────┐
│   Full   │   Min    │
├──────────┼──────────┤
│    MC    │ Desktop  │
└──────────┴──────────┘
```

**视觉**：
- 2×2 均分网格，间距 4px
- 每个格子：`rgba(255,255,255,0.1)` 底，白色文字居中
- 字体 = `min(cellW, cellH) * 0.2`

**交互**：
- `touchstart` → 计算 `(x, y)` → 确定哪个格子被点 → POST 对应 API
- 无视觉反馈（系统 `:active` 已处理）

**API 映射**：
| 格子 | 标签 | API |
|------|------|-----|
| (0,0) | Full | `/api/system/window/fullscreen` |
| (1,0) | Min | `/api/system/window/minimize` |
| (0,1) | MC | `/api/system/window/mission-control` |
| (1,1) | Desktop | `/api/system/window/show-desktop` |

---

## 四、动态集合类

**通用行为**：
- 项数不固定（2-20 项）
- 画布内垂直滚动（touchmove 改变 scroll offset）
- 每行一项，可点击
- 首次加载 GET API，定时刷新
- 空状态显示 "No items"

**滚动机制**：
- `canvas._scrollOffset` 存储当前滚动位置
- `touchstart` 记录起始 Y
- `touchmove` → `scrollOffset += deltaY`，clamp 到 `[0, maxScroll]`，重绘
- `touchend` → 如果移动距离 < 5px 且持续时间 < 300ms → 判定为"点击"而非"滚动"

### Dock Panel（4×4）

```
┌──────────────────────────┐
│ ● Safari    ● Chrome     │ ← 行 1
│ ○ Mail      ● Terminal   │ ← 行 2
│ ○ 计算器    ● Finder     │ ← 行 3 (超出可视区需要滚动)
│ ...                       │
└──────────────────────────┘
```

**视觉**：
- 每行：状态圆点 + 应用名
- 圆点：绿色 `#4ade80` = 运行中，灰色 `#555` = 未运行，直径 8px
- 字体大小 = `rowHeight * 0.4`
- 行高 = `max(24, canvas.height / visibleRows)`
- 可见行数：自动计算不含滚动

**交互**：
- 点击行 → POST `/api/system/launch-app` body: `{"path": ".."}`
- 滚动 → 查看更多应用
- 10 秒自动刷新

### Audio Output / Input（3×1）

```
┌──────────────────────────┐
│ ● Mi TV                  │ ← 当前设备（绿点）
│   AKG C44-USB Microphone │
│   Mac mini扬声器         │ ← 1 行 = 1 设备
└──────────────────────────┘
```

**视觉**：
- 当前设备：绿色 `●` + 白色名称
- 其他设备：灰色缩进 + 灰色名称
- 行高同 Dock

**交互**：
- 点击非当前设备行 → POST `/api/system/audio-output` / `audio-input` → 列表刷新

### Layout Preset（4×4）

```
┌──────────────────────────┐
│ 工作模式            Apply│
│ 写作布局            Apply│
│ 全屏分屏            Apply│
└──────────────────────────┘
```

**视觉**：
- 每行：预设名（左对齐）+ 绿色 `"Apply"`（右对齐）
- 空状态：`"No presets — save one first"`

**交互**：
- 点击 Apply → POST `/api/system/layouts/apply`
- 编辑器内通过属性面板管理预设

---

## 五、流式列表类

### App Menu（4×5）

**核心问题**：50-200 个菜单项，前台切应用内容全换。固定画布装不下。

**方案：独立 Profile 展示 `app-menu` widget 时，iPad 展示一个全屏可滚动菜单页面，而不是挤在 key 里。**

```
┌──────────────────────────────┐
│ Safari 浏览器           [×] │ ← 顶部：当前应用名 + 关闭按钮
├──────────────────────────────┤
│ 文件                     [>] │ ← 一级：菜单名（橙色），点击展开
│   新建窗口          [⌘N]    │ ← 二级：菜单项（白色）+ 快捷键（灰色）
│   打开...           [⌘O]    │
│   关闭窗口          [⌘W]    │
│ 编辑                     [>] │
│   撤销              [⌘Z]    │
│   重做        [⌘⇧Z]        │
│ ...                          │
└──────────────────────────────┘
```

**全屏 Profile 行为**：
- 键盘区替换为菜单全屏视图
- 顶部标题栏：应用名 + 关闭按钮
- 菜单名默认折叠，点击展开子项
- 有快捷键的菜单项可点击 → 执行快捷键
- 应用切换时 → 自动刷新菜单内容
- 点关闭或切 Profile → 回到键盘视图

**在 key 画布上的预览（4×5 widget）**：
```
┌──────────────────────────┐
│ Safari 浏览器             │
│ 文件                  [>] │
│ 编辑                  [>] │
│ 显示                  [>] │
│ ...（最多显示可见行数）     │
└──────────────────────────┘
```
- 仅显示前 N 个菜单名（折叠状态）
- 点展开 → 切到全屏 Profile
- 不滚动（内容太多，不适合小画布）

---

## 通用规则

- Canvas 区域：`kw-8 × kh-8`，圆角 3-4px
- 背景：`rgba(0,0,0,0.3)`
- 加载中：居中灰色文字
- 错误：红色文字，3 秒后自动重试
- Widget 不触发键盘音效（已在 `50-touch.js` 排除）
- `_drawName(canvas, data)` 模式：GET 数据 → 调 `_drawXxx` 渲染
- `setInterval` 自动刷新频率：滑块 0（不需要），Dock 10s，Audio 30s，Layout 60s，Menu 5s
