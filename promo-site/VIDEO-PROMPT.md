# Hero 循环背景视频 — Lovart 生成说明

目标:hero 区的动态循环背景,主题「点流」——深蓝背景上发光粒子缓慢流动,呼应产品名。

参考文件(本地参考,已 gitignore,勿用于站内素材):
- `ref/floral_a.mp4` — OpenAI Codex 页 hero 背景视频原文件(HEVC,2560×2560 方形,30fps,6 秒,2.8MB,静音循环播放)

## 生成提示词(直接复制到 Lovart)

**中文版:**

```
极简抽象氛围背景动画:深蓝黑色空间(#1a1a2e),柔和的发光粒子流像溪流一样从画面左侧缓缓流向右侧,
细小的翡翠绿(#4ade80)和白色光点沿着流动方向漂移,背景中偶尔有极淡的网格线隐入黑暗。
缓慢、平静、连续的运动。无镜头切换、无镜头运动、无物体进入或离开画面、无文字、无 logo。
完美无缝循环,首帧与末帧一致。电影级柔和光晕,细腻颗粒感,高级简约。
```

**英文版**(英文提示词对部分模型效果更好,如 LTX):

```
Minimalist abstract ambient background: a deep dark navy space (#1a1a2e) with soft glowing
streams of light particles flowing slowly from left to right like a gentle current, tiny emerald
green (#4ade80) and white dots of light drifting along the flow, faint grid lines occasionally
dissolving into darkness. Slow, calm, continuous motion. No camera cuts, no camera movement,
no objects entering or leaving the frame, no text, no logos. Perfect seamless loop, first frame
matches last frame. Cinematic soft glow, subtle grain, elegant, premium.
```

## 规格要求

- **时长**:5 秒即可(越短循环越干净);可选 10 秒则选 10 秒
- **画幅**:16:9 横向,1080p 或更高
- **运动**:慢速、连续、单向流动,避免:物体进出画面、镜头推拉/切换、快速闪烁
- **主体选择**:粒子/流体/光点类最容易循环;避免人物、动物、物理下落等不可逆运动

## 生成后的处理(由我完成)

1. 你把生成的 mp4 放到 `promo-site/assets/video/bg-loop.mp4`(或任意路径发我)
2. 我用 ffmpeg:截循环段 + 首尾 3-5 帧交叉淡化(xfade)消除接缝 → 压 720p/CRF 28-32 至 ≤800KB → 转 webm 双格式
3. 接入 hero(已预置占位):`<video autoplay muted loop playsinline>` + 静态兜底 + prefers-reduced-motion 降级

## 备选(不花钱)

若生成效果不满意,我可以手写 canvas 粒子「点流」动画兜底(~10KB,绝对无缝,品牌色一致)。
