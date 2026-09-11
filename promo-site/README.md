# Tapflow 宣传站(promo-site)

单页滚动宣传站:纯静态 HTML/CSS/JS,零框架零构建,中英双语切换,深色主题(与产品一致)。

## 本地预览

```bash
cd promo-site && python3 -m http.server 8090
# 打开 http://localhost:8090
```

语言:`?lang=en` 参数 / 顶栏切换按钮,记忆在 localStorage。

## 目录

| 文件 | 说明 |
|------|------|
| `index.html` | 页面骨架,中文文案作 fallback,`data-i18n` 标记 |
| `styles.css` | 全部样式(CSS 变量深色主题 + 响应式) |
| `i18n.js` | 英文字典(取自 README_EN.md)+ 切换逻辑 |
| `main.js` | 语言按钮、滚动渐入、顶栏、GIF 懒加载、复制链接 |
| `assets/` | 自包含素材(图片/字体/图标库),拷贝整个目录即可独立部署 |

## 素材同步

- `assets/img/*.jpg`、`*.gif` ← `docs/images/`(更新图片时从此目录复制,**不要**直接用 `../docs/images/` 相对引用,保证目录可独立部署)
- `assets/img/logo.png` ← `icons/Tapflow_icon_1024.png`
- `assets/img/thumbs/*.png` ← `client/thumbnails/`
- `assets/fonts/*.woff2` ← `client/fonts/`
- `assets/icons.js` ← `client/icons.js`(Solar 图标库)

**禁止**引用 `promo/zfrontier-upload/` 高清原图(单张最大 1.9MB,且被 gitignore,部署即失效)。

## 约定

- 全站不写具体版本号(README badge 1.0.4 与 setup.py 1.0.9 不一致),统一 `v1 · early access` 措辞;下载链接指向 `/releases` 不写死文件名。
- 延迟表述用「毫秒级」「延迟低到你感觉不到」,不公开内部实测数字。
- 修改文案只动 `index.html`(中文)与 `i18n.js`(英文)。

## Hero 背景视频

- 路径:`assets/video/bg-loop.mp4`(可加 `.webm` 双格式);hero 已预置 `<video autoplay muted loop playsinline>` 占位,文件缺失时自动降级为 CSS 点阵背景
- 生成提示词与处理流程见 `VIDEO-PROMPT.md`(Lovart 生成 → ffmpeg 截循环段 + 首尾交叉淡化 → 压缩 ≤800KB)
