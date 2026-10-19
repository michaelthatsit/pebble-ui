"""Lay screenshots out on one labelled contact sheet.

    python3 tools/sheet.py out.png shot1.png shot2.png ...
"""
import os
import sys
from PIL import Image, ImageDraw

out, files = sys.argv[1], sys.argv[2:]
ims = [(os.path.basename(f)[:-4], Image.open(f).convert("RGB")) for f in files]
w = max(i.width for _, i in ims)
h = max(i.height for _, i in ims)
cols = min(6, len(ims))
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (w + 8), rows * (h + 22)), "#888")
draw = ImageDraw.Draw(sheet)
for k, (name, im) in enumerate(ims):
    x, y = (k % cols) * (w + 8), (k // cols) * (h + 22)
    sheet.paste(im, (x + 4, y + 18))
    draw.text((x + 4, y + 3), name, fill="white")
sheet.save(out)
print(out, sheet.size, len(ims), "frames")
