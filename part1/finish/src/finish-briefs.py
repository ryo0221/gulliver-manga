#!/usr/bin/env python3
"""Adds the ep1 finish (fiction-manga 仕上げ) inputs to the ink briefs.

usage: finish-briefs.py BRIEFS_ROOT INK_DIR
BRIEFS_ROOT: rough-briefs.py + ink-briefs.py output (frame.json, refs.txt, ink-brief.txt per panel; briefs.json).
INK_DIR: part1/ink (the accepted line art: layers/<panel>-LY-04/07/08.png).
Writes BRIEFS_ROOT/<panel>/lines.png: the accepted line art (all three line layers in black on white) padded with
white to the generation canvas, the same frame as the rough and the ink.
"""
import json, sys
from PIL import Image

root, ink = sys.argv[1:3]

# Panels the image tool refused (2026-11-14: e01-p08-k1, the pegged hair, was refused twice as a false self-harm flag,
# also with the scene's context): only the figure lines (LY-07) go to Codex, with a plain note; the background fill
# comes from the reference's plain grass, and the line art keeps all its lines.
FIGURE_ONLY = {
    'e01-p08-k1': "Only the man's lines are given (the grass is left out on purpose): colour the man's face, hair, ears and collar, and fill everything around him with a plain grass green. He is lying calmly on his back on a meadow, seen from straight above, his head toward the bottom of the frame; it is a sunny morning and he has just woken up.",
}
briefs = json.load(open(f'{root}/briefs.json'))
for pid, b in briefs.items():
    cw, ch = b['frame']['canvas']; ox, oy, pw, ph = b['frame']['panel']
    page = Image.new('RGBA', (pw, ph), (255, 255, 255, 255))
    for ly in (('LY-07',) if pid in FIGURE_ONLY else ('LY-04', 'LY-07', 'LY-08')):
        page.alpha_composite(Image.open(f'{ink}/layers/{pid}-{ly}.png').convert('RGBA').resize((pw, ph), Image.LANCZOS))
    im = Image.new('RGB', (cw, ch), (255, 255, 255))
    im.paste(page.convert('RGB'), (ox, oy))
    im.save(f'{root}/{pid}/lines.png')
    if pid in FIGURE_ONLY: open(f'{root}/{pid}/finish-note.txt', 'w').write(FIGURE_ONLY[pid])
print(len(briefs), 'finish inputs')
