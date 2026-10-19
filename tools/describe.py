"""Describe a screenshot in numbers, for checking a screen without looking at it.

    python3 tools/describe.py shot.png

Prints the size, the colours by share of the screen (the first is the
background), and then each horizontal band that holds something other than
the background: its rows, the columns it spans and its colours. Text shows as
bands 9 to 30 px tall whose columns start where the text starts; a menu's
highlight bar as a band the full width of the screen in the highlight colour.
Row and column numbers are what the layout code uses, so a band can be
checked against the top you gave a Label plus the font's glyph offset
(Gothic 24 Bold glyphs start 10 px under the TextLayer top, 18 Bold 7, 14
Bold 5, LECO 26 Bold 8, LECO 42 13).
"""
import sys
from collections import Counter
from PIL import Image

def runs(values):
    out = []
    for n in values:
        if out and n == out[-1][1] + 1:
            out[-1][1] = n
        else:
            out.append([n, n])
    return out

def hexname(c):
    return "#%02X%02X%02X" % c

im = Image.open(sys.argv[1]).convert("RGB")
w, h = im.size
px = im.load()
colours = Counter(px[x, y] for y in range(h) for x in range(w))
background = colours.most_common(1)[0][0]
print(f"{w}x{h}; colours by share:", ", ".join(f"{hexname(c)} {n * 100 // (w * h)}%" for c, n in colours.most_common(6)))
rows = [y for y in range(h) if any(px[x, y] != background for x in range(w))]
for y0, y1 in runs(rows):
    band = [(x, y) for y in range(y0, y1 + 1) for x in range(w) if px[x, y] != background]
    xs = sorted(set(x for x, _ in band))
    cs = Counter(px[x, y] for x, y in band).most_common(3)
    print(f"rows {y0}-{y1} ({y1 - y0 + 1} tall): columns {xs[0]}-{xs[-1]}, {len(runs(xs))} runs; " + ", ".join(hexname(c) for c, _ in cs))
