# Plan A — Widget UI 规格

## 分类

| 分类 | Widget | 交互模式 |
|------|--------|---------|
| 🎵 音频 | Volume, Mute, Mic-Mute, Audio Out, Audio In | 点击/拖动 → API → 状态刷新 |
| 🖥 窗口 | Win Shortcuts, Win Tile, Layout Preset | 点击按钮 → API → 即时反馈 |
| 📱 系统 | Active App, Dock, App Menu | 自动轮询 → 流式更新 |

## 通用规则

- 所有 widget 使用 Canvas 2D 渲染，`kw-8 × kh-8` 区域
- 背景：`rgba(0,0,0,0.3)` 半透明黑底
- 加载中：灰色文字居中 "Loading..."
- 错误：红色文字居中 "Error"，3 秒后重试
- 触摸反馈：无需额外效果（系统 `:active` 已处理）

---

## Volume Slider

```
┌──────────────────────────┐
│ 🔊                 75%  │  ← 图标 + 百分比
│ ═══════════════●═══════ │  ← 滑块轨道 + 手柄
│                          │
└──────────────────────────┘
```

- **轨道**：`rgba(255,255,255,0.1)`，圆角 4px，高度 25%
- **填充**：绿→深绿渐变 `#4ade80 → #22c55e`
- **手柄**：白色圆形，半径 = 轨道高度 × 0.6
- **拖动**：`touchstart` + `touchmove` → 计算百分比 → POST `/api/system/volume`
- **静音时**：填充变红 `#ef4444`，文字显示 `MUTED`，手柄位置归零
- **初始**：GET `/api/system/volume` → 渲染实际值

---

## Mute Toggle

```
┌──────┐          ┌──────┐
│  M   │  未静音   │  M   │  已静音（红底）
│  ○   │  灰色底   │  ●   │  红色底
└──────┘          └──────┘
```

- **未静音**：`rgba(255,255,255,0.08)` 底，灰色圆，`"M"` 文字
- **已静音**：`rgba(239,68,68,0.3)` 底，红色圆，`"M"` 文字
- **交互**：`touchstart` → POST `/api/system/mute` → 刷新状态
- **初始**：GET `/api/system/volume` → `output_muted`

---

## Mic Mute

同 Mute Toggle，API 用 `/api/system/mic-mute`。

---

## Active App

```
┌──────────────────────────┐
│ Mac:  Safari 浏览器       │  ← 左标签 + 右应用名
└──────────────────────────┘
```

- 灰色 `"Mac:"` + 白色应用名
- 5 秒自动轮询 `/api/system/current-app`

---

## Win Shortcuts

```
┌──────────┬──────────┐
│   Full   │   Min    │
├──────────┼──────────┤
│    MC    │ Desktop  │
└──────────┴──────────┘
```

- 2×2 按钮网格
- 每个按钮：`rgba(255,255,255,0.1)` 底，白色文字居中
- 点击 → POST 对应 API

---

## Dock Panel

```
● Safari    ● Chrome   ● Finder
○ Mail      ● VS Code  ○ 信息
● 终端      ○ 计算器   ○ 音乐
...
```

- 网格布局，每行 3-5 个（取决于宽度）
- 每个应用：名称 + 状态圆点（● 绿=运行，○ 灰=关闭）
- 点击 → POST `/api/system/launch-app` → 应用启动或切换到前台
- 10 秒自动刷新
- **暂不显示图标**（需要后端图标提取 + 缓存，下一阶段）

---

## App Menu

```
文件
  新建窗口         [cmd+n]
  打开...          [cmd+o]
  关闭窗口         [cmd+w]
编辑
  撤销             [cmd+z]
  重做             [cmd+shift+z]
...
```

- 菜单名用橙色 `#f59e0b`
- 菜单项：淡色底 `rgba(255,255,255,0.05)`，白色文字
- 快捷键：右对齐灰色 `#888`
- 点击有快捷键的菜单项 → POST `/api/system/execute-shortcut`
- 5 秒自动刷新（跟随前台应用切换）

---

## Layout Preset

```
┌──────────────────────────┐
│ 工作模式            Apply│
│ 写作布局            Apply│
│ 全屏分屏            Apply│
└──────────────────────────┘
```

- 每行：预设名 + 绿色 `"Apply"` 按钮
- 点击 Apply → POST `/api/system/layouts/apply`
- 编辑器内通过属性面板创建/删除预设

---

## Audio Output / Input

```
┌──────────────────────────┐
│ Mi TV                [>] │
│ AKG C44-USB Mic      [>] │
│ Mac mini扬声器       [>] │
└──────────────────────────┘
```

- 当前设备显示绿色 √ 标记
- 点击设备名 → POST `/api/system/audio-output` 或 `audio-input` → 切换
- 初始：GET `/api/system/audio-devices`

---

## 验证标准

每个 widget 必须通过：
- [ ] 编辑器拖放到画布后显示预览标签
- [ ] iPad 上 widget 渲染正确（Playwright 截图对比）
- [ ] 触摸/拖动交互触发 API 调用
- [ ] API 返回后 widget 状态更新
- [ ] 错误状态显示 "Error"（断网测试）
- [ ] widget 不触发键盘音效
