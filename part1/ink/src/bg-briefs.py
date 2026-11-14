#!/usr/bin/env python3
"""Inputs for drawing the background into ep1 panels whose line art left it white (author's finish review, 2026-11-14:
「背景を描いて」 for 2-2, 3-4, 6-1, 8-4, 11-5).

usage: bg-briefs.py BRIEFS_ROOT INK_DIR
BRIEFS_ROOT: rough-briefs.py + ink-briefs.py output (frame.json, layout.png per panel; briefs.json).
INK_DIR: part1/ink (the line layers LY-04 / LY-07 / LY-08).
Writes BRIEFS_ROOT/<panel>/bg-lines.png (the line art in its three layer colours, padded with white to the generation
canvas) and BRIEFS_ROOT/<panel>/bg-brief.txt (the setting to draw), for the panels in BG_NOTES only.
"""
import json, os, sys
from PIL import Image

root, ink = sys.argv[1:3]

# What each panel's background shows (the scene's stage in docs/part1-ep01-name.md and the script).
BG_NOTES = {
    # 通読の直し（RV-e01-09、2026-11-14）
    'e01-p07-k2': "Night on the grass where Gulliver fell asleep (scene SC-003, the same night as the panel above with the moon). The camera is down at the roots of the short soft grass by his cheek, looking up past his face: behind and above his face draw the night sky with scattered small stars (tiny star crosses and dots) and thin long clouds as light outlines, and short soft grass blades rising in the foreground along the bottom and at the right edge behind his hair. Leave his face, collar, coat and hair as they are.",
    'e01-p02-k2': "Inside an English country stable, a quiet morning (scene SC-001, the same stable as the panels before and after). Behind the horse's head and the man: the stable's vertical wooden plank wall, a thick upright post and a beam, a wooden hay rack with hay, and the floor covered with loose straw (the floor is straw on packed earth, not a meadow: redraw the old ground hatching as straw). This is INDOORS: no sky and no clouds anywhere; above the plank wall draw the roof's sloping rafters and the boards of the roof's underside, in shade (fine hatching).",
    'e01-p03-k4': "The quay of Bristol harbour, a bright morning, the day Gulliver sails (scene SC-002). Behind Gulliver: the stone edge of the quay, the calm harbour sea with its horizon low behind his shoulders, the masts, yards and rigging of the three-masted merchant ship moored at the quay rising behind him, a warehouse roof at one side, and a sky with a few clouds (clouds as light outlines only).",
    'e01-p06-k1': "The open sea just after the shipwreck in a storm (scene SC-003). Above the waves: a heavy storm sky with low dark rolling clouds (outlines and line hatching), slanting rain streaks, and high swells toward the far horizon. No ship, no boat, no land.",
    'e01-p08-k4': "Lilliput: a grassy meadow near the beach, a clear sunny morning (scene SC-004). The camera is at a tiny man's eye height beside the giant's leg. Above and behind the giant's leg: the sky with a few soft cumulus clouds, and on the far horizon a low line of distant trees and gentle hills, small because they are far away.",
    'e01-p11-k5': "Lilliput: a grassy meadow near the beach, a clear sunny morning (scene SC-004). The camera is at a tiny man's eye height below the ladder on the giant's chest. Behind the ladder, the carriers and the giant's chest: the sky with a few soft cumulus clouds, and low on the far horizon at the frame's sides a line of distant trees and gentle hills, small because they are far away.",
}
TINT = {'LY-04': (0, 0, 255), 'LY-07': (0, 0, 0), 'LY-08': (255, 0, 0)}

if __name__ == '__main__':
    briefs = json.load(open(f'{root}/briefs.json'))
    only = os.environ.get('BG_ONLY', '').split(',') if os.environ.get('BG_ONLY') else None  # redo some panels only
    for pid, note in BG_NOTES.items():
        if only and pid not in only: continue
        b = briefs[pid]
        cw, ch = b['frame']['canvas']; ox, oy, pw, ph = b['frame']['panel']
        page = Image.new('RGB', (pw, ph), (255, 255, 255))
        for ly, rgb in TINT.items():
            a = Image.open(f'{ink}/layers/{pid}-{ly}.png').getchannel('A').resize((pw, ph), Image.LANCZOS)
            page.paste(Image.new('RGB', (pw, ph), rgb), (0, 0), a)
        im = Image.new('RGB', (cw, ch), (255, 255, 255))
        im.paste(page, (ox, oy))
        im.save(f'{root}/{pid}/bg-lines.png')
        open(f'{root}/{pid}/bg-brief.txt', 'w').write(note)
    print(len(BG_NOTES), 'background briefs')
