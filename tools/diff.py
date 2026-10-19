"""Compare screenshots pixel by pixel.

    python3 tools/diff.py a.png b.png [rows-to-ignore]

Prints how many pixels differ and the rows they fall in. The optional third
argument is a band of rows to ignore, such as 95-123 for a clock that shows
the current time. Zero pixels differing is the bar the library's own screens
meet against their C originals.
"""
import sys
from PIL import Image, ImageChops

def runs(values):
    out = []
    for n in values:
        if out and n == out[-1][1] + 1:
            out[-1][1] = n
        else:
            out.append([n, n])
    return out

a = Image.open(sys.argv[1]).convert("RGB")
b = Image.open(sys.argv[2]).convert("RGB")
if a.size != b.size:
    print(f"sizes differ: {a.size} vs {b.size}")
    sys.exit(1)
d = ImageChops.difference(a, b).convert("L").point(lambda v: 255 if v else 0)
if len(sys.argv) > 3:
    y0, y1 = map(int, sys.argv[3].split("-"))
    for y in range(y0, y1 + 1):
        for x in range(d.width):
            d.putpixel((x, y), 0)
count = sum(1 for v in d.getdata() if v)
rows = runs([y for y in range(d.height) if any(d.getpixel((x, y)) for x in range(d.width))])
print(f"{count} px differ, bbox {d.getbbox()}, rows {rows[:12]}")
sys.exit(0 if count == 0 else 1)
