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
# Colour notes for the backgrounds drawn after the author's finish review (2026-11-14: 「背景を描いて」).
SETTING = {
    'e01-p02-k2': "The background is the inside of an English country stable: weathered brown wooden planks, posts and beams, golden hay in the rack, pale straw on the floor (not grass).",
    'e01-p03-k4': "The background is Bristol harbour on a bright morning: light blue sky with white clouds, blue-green harbour water, grey stone quay, the ship's brown wooden masts and yards with tan rigging, a red-brown warehouse roof. Paint the sky right up to the top edge of the panel (no white band at the top).",
    'e01-p06-k1': "The background is a storm just passing over the open sea: dark slate-grey storm clouds, grey rain streaks, grey-green sea.",
    'e01-p08-k4': "The background is a clear sunny morning in Lilliput: light blue sky, white clouds, distant trees and hills in soft greens with a little blue haze.",
    'e01-p11-k5': "The background is a clear sunny morning in Lilliput: light blue sky, white clouds, distant trees and hills in soft greens with a little blue haze.",
    # 通読の直し（2026-11-14）
    'e01-p07-k2': "It is night (the same night as the panel above, with the moon): a deep navy-blue night sky with small pale stars and thin grey-blue clouds, dark green grass in the moonlight; his skin and coat in cool moonlit tones. Paint the sky right up to the top edge (no white).",
    'e01-p01-k1': "The cover: a bright sunny morning on the beach of Lilliput: light blue sky, pale sand, Gulliver's blue coat with brass buttons; the tiny Lilliputians in red, green, blue and mustard-yellow coats with white wigs, wooden bows. Paint the light blue sky right up to the top edge of the panel (no white band at the top).",
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
    note = FIGURE_ONLY.get(pid) or SETTING.get(pid)
    if note: open(f'{root}/{pid}/finish-note.txt', 'w').write(note)
print(len(briefs), 'finish inputs')
