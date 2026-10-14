"""홈 화면 아이콘 4종 (192·512·maskable 512·apple-touch 180) 생성 — 호이안 등불 하나 + 물결.
사용: python tools/make_icons.py [출력 폴더, 기본: 저장소 루트]
필요: pip install pillow
"""
import os
import sys
from PIL import Image, ImageDraw

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
S = 2048  # 크게 그린 뒤 줄여서 계단 현상 없애기
BG = (14, 124, 134)        # 페이지 포인트 색(바다색)
WAVE = (10, 98, 108)
LAN = (255, 196, 64)       # 등불
LAN_D = (240, 150, 40)
CAP = (140, 62, 30)
GLOW = (255, 236, 170)


def make(size, pad, name):
    """pad = 가장자리 여백 비율. maskable 은 안드로이드가 원·물방울로 잘라도 등불이 남게 크게(0.3)."""
    im = Image.new('RGB', (S, S), BG)
    d = ImageDraw.Draw(im)
    cx, sc = S / 2, 1 - pad
    cy = S * 0.46
    # 물결 두 줄
    for k, y in enumerate((0.80, 0.90)):
        yy = S * (0.5 + (y - 0.5) * sc)
        r = S * 0.11 * sc
        x = cx - S * 0.55 * sc - (r if k else 0)
        while x < cx + S * 0.55 * sc:
            d.pieslice([x, yy - r * 0.55, x + 2 * r, yy + r * 0.55], 180, 360, fill=WAVE)
            x += 2 * r
        d.rectangle([0, yy, S, S], fill=WAVE if k else BG)
    d.rectangle([0, S * (0.5 + 0.4 * sc), S, S], fill=WAVE)
    # 줄 + 등불
    w, h = S * 0.27 * sc, S * 0.25 * sc
    d.line([cx, cy - h - S * 0.19 * sc, cx, cy - h], fill=CAP, width=int(S * 0.014 * sc))
    d.ellipse([cx - w * 1.25, cy - h * 1.25, cx + w * 1.25, cy + h * 1.25], fill=(34, 140, 148))   # 은은한 빛
    d.ellipse([cx - w, cy - h, cx + w, cy + h], fill=LAN)
    for f in (0.62, 0.22):   # 세로 살
        d.arc([cx - w * f, cy - h, cx + w * f, cy + h], 0, 360, fill=LAN_D, width=int(S * 0.012 * sc))
    d.ellipse([cx - w * 0.2, cy - h * 0.55, cx + w * 0.2, cy + h * 0.1], fill=GLOW)
    cw, ch = w * 0.5, S * 0.035 * sc
    d.rounded_rectangle([cx - cw, cy - h - ch * 0.6, cx + cw, cy - h + ch * 0.6], radius=int(ch * 0.4), fill=CAP)
    d.rounded_rectangle([cx - cw, cy + h - ch * 0.6, cx + cw, cy + h + ch * 0.6], radius=int(ch * 0.4), fill=CAP)
    # 술
    d.line([cx, cy + h + ch * 0.6, cx, cy + h + S * 0.1 * sc], fill=CAP, width=int(S * 0.014 * sc))
    tw = S * 0.028 * sc
    d.rounded_rectangle([cx - tw, cy + h + S * 0.09 * sc, cx + tw, cy + h + S * 0.2 * sc], radius=int(tw * 0.6), fill=(214, 72, 52))
    im.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name))


make(192, 0.1, 'icon-192.png')
make(512, 0.1, 'icon-512.png')
make(512, 0.3, 'icon-maskable-512.png')
make(180, 0.12, 'apple-touch-icon.png')
print('icons ->', os.path.abspath(OUT))
