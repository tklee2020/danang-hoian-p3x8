"""harness 의 tall 조각(name-1.png, name-2.png …)을 옆으로 이어 붙여 한눈에 본다 (한 장에 4조각).
사용: python sheet.py out/w-360-light-plan-full   → out/w-360-light-plan-full-sheet.png (5조각부터 -sheet2.png)
"""
import glob
import sys
from PIL import Image

pre = sys.argv[1]
files = sorted(glob.glob(pre + '-[0-9].png'))
per = 4
for n in range(0, len(files), per):
    grp = [Image.open(f).convert('RGB') for f in files[n:n + per]]
    W, H = grp[0].size
    sheet = Image.new('RGB', (W * len(grp) + 16 * (len(grp) - 1), H), (255, 0, 255))
    for i, p in enumerate(grp):
        sheet.paste(p, (i * (W + 16), 0))
    scale = min(1.0, 1900 / sheet.size[0])
    if scale < 1:
        sheet = sheet.resize((int(sheet.size[0] * scale), int(sheet.size[1] * scale)), Image.LANCZOS)
    out = pre + '-sheet' + (str(n // per + 1) if n else '') + '.png'
    sheet.save(out)
    print(out, sheet.size)
