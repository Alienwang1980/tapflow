# Tapflow 宣传站(promo-site)

单页滚动宣传站:纯静态 HTML/CSS/JS,零框架零构建,中英双语切换,深色主题(与产品一致)。

## 线上地址

- 🌐 **https://tapflow.work**(主域,`www.tapflow.work` 亦可用)
- 托管:Cloudflare Pages(项目名 `tapflow`,pages.dev 域名 `tapflow-10c.pages.dev`)
- 图床仍走 `img.tapflow.work`(R2),与站点互不影响

## 重新部署

```bash
# 1. 准备干净的部署目录(排除 gitignore 的素材源文件 + mckp 死文件)
rm -rf /tmp/tapflow-pages && mkdir -p /tmp/tapflow-pages
cp index.html styles.css main.js i18n.js /tmp/tapflow-pages/
rsync -a assets/ /tmp/tapflow-pages/assets/ \
  --exclude 'mckp/cdn/90d00c1d-*.glb' --exclude 'mckp/cdn/35470b74-*.png' --exclude 'mckp/cdn/10c2e94d-*.jpg' \
  --exclude 'mckp/cdn/bf799c47-*.webp' --exclude 'mckp/cdn/2b3dab0b-*.jpg' --exclude 'mckp/cdn/f6abb00f-*.jpg' \
  --exclude 'mckp/cdn/4b8f28f0-*.webp' --exclude 'mckp/cdn/314f997c-*.webp' \
  --exclude 'mckp/cdn/267b6dd7-*.jpg' --exclude 'mckp/cdn/32d13334-*.jpg' --exclude 'mckp/cdn/7e98c8fa-*.jpg' \
  --exclude 'mckp/cdn/c1aa5706-*.jpg' --exclude 'mckp/cdn/514054fe-*.jpg' --exclude 'mckp/cdn/494e6278-*.jpg' \
  --exclude 'mckp/cdn/f6dd5d6c-*.jpg' \
  --exclude 'mckp/embed.js' --exclude 'mckp/embed.CUFsinC6.js' --exclude 'mckp/embed.CUFsinC6.js.orig' \
  --exclude 'mckp/backend/mockups/client/df09709b-*'

# 2. 上传(需 CLOUDFLARE_API_TOKEN,见 ~/.wrangler/.env)
source ~/.wrangler/.env && npx wrangler pages deploy /tmp/tapflow-pages --project-name=tapflow
```

> ⚠️ `assets/mckp/` 虽在 .gitignore 里,但是**运行时必需**(`index.html` 引用的 mockup 查看器 embed)——部署必须带上,不能像本地 git 那样排除。排除清单里的文件是 2026-09-12 用网络面板实测从未被拉取的死文件(旧 glb、未挂载场景、未接线的 CUFsinC6 新 bundle)。
> 首次部署记录(2026-09-12):Pages 项目经 API 创建;挂载 `tapflow.work` 前需先从 R2 bucket 解绑根域自定义域(R2 生成的 CNAME 受保护,不能直接改 DNS);解绑后 Pages 仍不自动写 DNS,需手动建两条 CNAME(`tapflow.work`/`www` → `tapflow-10c.pages.dev`,proxied),随后域名验证通过。

## 3D 素材体积优化(2026-09-12)

- 场景截图(mckp `sceneAssets`)jpg → webp q70,并同步改 `assets/mckp/backend/mockups/client/*` 场景 JSON 里的 `filename_disk` 引用:总 1.8MB → 308KB。**若从 mckp.live 重新抓取场景,需重做此转换。**
- **屏幕截图降采样(2026-09-13)**:3 张场景截图原为 2866×2002/2002×2866 近 3K 超采样(设备屏幕在页面上只占几百像素),cwebp `-resize 1440 0` 降到 1440px——GPU 纹理内存 23MB→5MB/张,加速首帧;原尺寸 webp 备份在 `/tmp/mckp-webp-orig/`。
- PBR 贴图 webp q70 重压,省约 5%。
- 加载指示:`main.js` 的 `wire()` 向 player.mountPoint 注入 CSS,把 mckp 自带「Loading scene」进度条从角落居中到画面中心(closed shadow DOM,只能经 mountPoint 挂 `<style>`)。
- **poster 永不隐藏(2026-09-13 根治黑屏/闪烁)**:mckp 的 WebGL canvas 是 `alpha:true`——首帧前透明 → poster 透出,首帧画上后场景背景不透明自然盖住。早期方案以「canvas 创建/进度条卸载」为信号隐藏 poster,与真实首帧间有长空窗 → loading 完黑屏 + 闪烁,已弃;渲染失败时 poster 垫底还能兜底显示静态图。
- **黑底 shade 防穿帮(2026-09-13)**:hero 场景背景透明(只有设备),首帧后 poster 会从设备周围透出成「背景」穿帮(duo 场景背景不透明,无此问题)→ `wire()` 在 poster 与 canvas 之间插黑底,首帧检测后渐显盖住 poster。首帧检测:hook `gl.drawElements/drawArrays`,绘制后 readPixels 采样 7 点 alpha 非 0 即首帧;hook 装晚时派发 resize 触发重绘补偿;进度条卸载后 8s 强制渐显兜底。实测:hero poster 显隐画面差异 5.19% → 0.00%,duo 画面不受影响。
- **duo 预激活(2026-09-13)**:mckp 默认懒激活(IntersectionObserver threshold:0,滚到才拉 ~2.5MB 素材 → 到底部干等)。`activate()` 公开且幂等(mounted 短路),`main.js` 在「duo 距视口 1500px」或「load 后 8s」提前调用,后台预载,滚动到底即出画面(离屏不渲染,不抢 GPU)。实测冷加载:duo 素材 9.3s 开始下载、~11s 全部就绪,滚动瞬间 canvas+首帧+黑底全就绪。注意:hero 素材 ~5s 内完成,duo 9.3s 才开始 → 错峰不抢带宽。duo 的 glb(a2886c96)已是 KHR_draco 压缩(1.38MB,含 2 动画),无需再压;hero PBR(be9179c3/6daf45b4 2048²)在 4K canvas 下不能降采样(曾降到 1024 又回滚)。

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
- `assets/img/hero-hand.webp` ← `Psds/Promo_pics/Hand_012.png`(ls.graphics 手持 iPad mockup,Photopea 导出;Psds/ 已 gitignore,源文件本地保留)
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
