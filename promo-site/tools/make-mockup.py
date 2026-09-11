#!/usr/bin/env python3
"""把 Tapflow 面板截图套进免费 iPad 设备框,输出深色场景样张。

用法:
  python3 make-mockup.py <截图.png> <设备框.png> <输出.png>

设备框:webmobilefirst.com 免费透明 PNG(如 ipad-pro-11-frame.png),
        屏幕挖空区域透明,截图贴到挖空下方即可,无需手动裁剪。
许可:个人+商用允许,无署名要求(仅禁止转卖文件本身)。
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

BG_TOP = (26, 26, 46)      # #1a1a2e
BG_BOTTOM = (18, 18, 31)   # #12121f
SHADOW_BLUR = 46
SHADOW_OFFSET = (0, 26)
SHADOW_ALPHA = 150


def find_screen_hole(alpha: np.ndarray, min_frac: float = 0.55):
    """在设备框的 alpha 通道里找屏幕挖空矩形:透明行长龙定位。"""
    h, w = alpha.shape
    rows = []
    for y in range(h):
        row = alpha[y] == 0
        best = run = 0
        for v in row:
            run = run + 1 if v else 0
            best = max(best, run)
        if best > w * min_frac:
            rows.append(y)
    cols = []
    for x in range(w):
        col = alpha[:, x] == 0
        best = run = 0
        for v in col:
            run = run + 1 if v else 0
            best = max(best, run)
        if best > h * min_frac:
            cols.append(x)
    if not rows or not cols:
        raise SystemExit("找不到屏幕挖空区域,检查设备框 PNG 是否透明挖空")
    inset = 2
    return (cols[0] + inset, rows[0] + inset, cols[-1] - inset, rows[-1] - inset)


def gradient_bg(w: int, h: int) -> Image.Image:
    """深色渐变背景 + 一点中心提亮,呼应产品深色风。"""
    top, bottom = np.array(BG_TOP, float), np.array(BG_BOTTOM, float)
    rows = np.linspace(0, 1, h)[:, None, None]
    bg = (top[None, None, :] * (1 - rows) + bottom[None, None, :] * rows)
    bg = np.repeat(bg, w, axis=1).astype(np.uint8)
    # 中心轻微绿色光晕
    y, x = np.ogrid[:h, :w]
    d = np.sqrt((x - w / 2) ** 2 + (y - h / 2.35) ** 2)
    glow = np.clip(1 - d / (h * 0.75), 0, 1) ** 2 * 0.10
    img = bg.astype(np.float64)
    img[:, :, 1] += glow * 90   # 绿色通道
    img[:, :, 0] += glow * 20
    img[:, :, 2] += glow * 20
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")


def main():
    if len(sys.argv) != 4:
        print(__doc__)
        raise SystemExit(1)
    shot_path, frame_path, out_path = sys.argv[1:4]

    shot = Image.open(shot_path).convert("RGB")
    frame = Image.open(frame_path).convert("RGBA")

    hole = find_screen_hole(np.array(frame)[:, :, 3])
    hole_w, hole_h = hole[2] - hole[0], hole[3] - hole[1]

    # 截图等比缩放填满挖空
    scale = max(hole_w / shot.width, hole_h / shot.height)
    new_size = (max(1, round(shot.width * scale)), max(1, round(shot.height * scale)))
    shot = shot.resize(new_size, Image.LANCZOS)
    # 居中裁掉多余部分(截图与挖空长宽比不一致时)
    left = (shot.width - hole_w) // 2
    top = (shot.height - hole_h) // 2
    shot = shot.crop((left, top, left + hole_w, top + hole_h))

    # 画布:设备框四周留边,底部留出阴影空间
    pad_x, pad_top, pad_bottom = 240, 180, 260
    canvas_w = frame.width + pad_x * 2
    canvas_h = frame.height + pad_top + pad_bottom
    canvas = gradient_bg(canvas_w, canvas_h).convert("RGBA")

    # 阴影:设备轮廓高斯模糊
    sil = Image.new("L", frame.size, 0)
    sil.paste(255, mask=frame.split()[3])
    sil = sil.filter(ImageFilter.GaussianBlur(SHADOW_BLUR))
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow.paste((0, 0, 0, SHADOW_ALPHA), (pad_x + SHADOW_OFFSET[0], pad_top + SHADOW_OFFSET[1]), sil)
    canvas.alpha_composite(shadow)

    # 截图 → 挖空位置;设备框盖在上面
    canvas.paste(shot, (pad_x + hole[0], pad_top + hole[1]))
    canvas.alpha_composite(frame, (pad_x, pad_top))

    canvas.convert("RGB").save(out_path, quality=92)
    print(f"已输出 {out_path} ({canvas.width}x{canvas.height})")


if __name__ == "__main__":
    main()
