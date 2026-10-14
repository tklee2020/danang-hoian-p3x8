"""제목 글꼴 Jua 를 줄여서 fonts/Jua-ko.woff2 로 (오프라인용 — 서비스워커가 설치 때 저장).
원본: https://github.com/google/fonts/tree/main/ofl/jua (SIL OFL 1.1 → fonts/LICENSE-Jua.txt)
남기는 글자: KS X 1001 한글 2,350자 + 영문·숫자·문장부호 + index.html 에 실제로 쓴 글자 전부.
페이지에 새 글자를 넣었는데 그 글자만 다른 글꼴로 보이면 이걸 다시 돌린다.
사용: pip install fonttools brotli
      python tools/make_font.py <Jua-Regular.ttf>
"""
import os
import sys

from fontTools import subset

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
src = sys.argv[1]
chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set('·–—…‘’“”→←↑↓★☆●○※〈〉「」『』°%₫')
for hi in range(0xB0, 0xC9):   # KS X 1001 한글 영역 (EUC-KR 0xB0A1~0xC8FE)
    for lo in range(0xA1, 0xFF):
        try:
            chars.add(bytes([hi, lo]).decode('euc-kr'))
        except UnicodeDecodeError:
            pass
with open(os.path.join(root, 'index.html'), encoding='utf-8') as f:
    chars |= set(ch for ch in f.read() if ord(ch) > 0x7F)
text = ''.join(sorted(chars))
out = os.path.join(root, 'fonts', 'Jua-ko.woff2')
opts = subset.Options()
opts.flavor = 'woff2'
opts.layout_features = ['*']
opts.name_IDs = ['*']
opts.notdef_outline = True
font = subset.load_font(src, opts)
sub = subset.Subsetter(opts)
sub.populate(text=text)
sub.subset(font)
subset.save_font(font, out, opts)
print(out, os.path.getsize(out), 'bytes,', len(text), 'chars requested')
