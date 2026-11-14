#!/usr/bin/env python3
"""Adds the ep1 line-art (fiction-manga 線画) inputs to the rough briefs.

usage: ink-briefs.py BRIEFS_ROOT ROUGH_DIR
BRIEFS_ROOT: rough-briefs.py output (each panel's layout.png, refs.txt, frame.json; briefs.json).
ROUGH_DIR: part1/rough (the accepted rough: panels/<panel>.jpg and prompts/<panel>.txt).
Writes BRIEFS_ROOT/<panel>/rough.png (the accepted rough padded to the same generation canvas as layout.png)
and BRIEFS_ROOT/<panel>/ink-brief.txt (the rough's panel brief, with the author's rough corrections, plus ink notes).
"""
import json, os, re, sys
from PIL import Image

root, rough = sys.argv[1:3]
briefs = json.load(open(f'{root}/briefs.json'))

# Notes from the author's rough review (2026-11-14) that the line art must fix.
INK_NOTES = {
    'e01-p12-k5': "The author found this face cut unnaturally (one huge eye cut off by the frame, a sliver of grass). Here do NOT follow the rough's crop: follow the SECOND image. The camera looks straight down on Gulliver's face; the face sits in the middle of the wide strip (about the middle 45% of the width) with his hair and the grass on both sides. Show BOTH eyes (heavy, half-closed, drowsy from the drugged wine), both eyebrows and the bridge of the nose, the head upright in the frame (forehead toward the top). The top and bottom frame edges cross the forehead and the nose, which is the intended extreme close-up; the left and right edges of the face, the ears and the hair must be inside the frame.",
    # 通読の直し（2026-11-14、作者が提案どおりと判断）
    'e01-p12-k3': "Read-through correction (RV-e01-04): the dancing Lilliputians were drawn far too big, almost the size of Gulliver's face. Keep the composition (Gulliver lying with his face at the left-middle, the barrel thrown up, the dancers celebrating on his chest), but draw every Lilliputian at its TRUE size, 1/12 of Gulliver: a whole Lilliputian standing beside his head is no taller than his face from chin to forehead, and no Lilliputian head is bigger than his eye. One or two nearer dancers may be bigger in the foreground at the frame edge, cut off by the frame, but not covering his face. Draw many small dancers on his chest and around his head, arms raised, hats waving.",
    'e01-p15-k2': "Read-through correction (RV-e01-07): only Gulliver's LEFT leg is chained (the text: 91 chains fixed to his left leg with 36 padlocks), as in the panel before. Draw the chain and the shackle ONLY on his left ankle (the leg toward frame right), running to the ring in the temple wall; his right ankle (toward frame left) is free: no shackle, no chain, no ring line to it.",
    'e01-p15-k1': "Gulliver's LEFT leg is still chained: draw the chain from his left ankle back to the temple behind him (the rough missed it). Do not draw any grey padding line at the frame edge.",
}

for pid, b in briefs.items():
    d = f'{root}/{pid}'
    cw, ch = b['frame']['canvas']; ox, oy, pw, ph = b['frame']['panel']
    im = Image.new('RGB', (cw, ch), (128, 128, 128))
    im.paste(Image.open(f'{rough}/panels/{pid}.jpg').convert('RGB').resize((pw, ph), Image.LANCZOS), (ox, oy))
    im.save(f'{d}/rough.png')
    prompt = open(f'{rough}/prompts/{pid}.txt').read()
    m = re.search(r'^(Panel e01-.*?)\n\nAfter generating', prompt, re.S | re.M)
    brief = m.group(1)
    brief = brief.replace('The FIRST image is the 3D layout render', 'The SECOND image is the 3D layout render')
    brief = brief.replace('edges of the FIRST image are padding', 'edges of the FIRST and SECOND images are padding')
    brief = brief.replace('(keep these places, facings and poses;', '(as placed in the rough and the 3D layout: keep these places, facings and poses;')
    if pid in INK_NOTES:
        brief += '\nLine-art correction after the author\'s rough review: ' + INK_NOTES[pid]
    open(f'{d}/ink-brief.txt', 'w').write(brief)
print(len(briefs), 'ink briefs')
