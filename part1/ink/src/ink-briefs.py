#!/usr/bin/env python3
"""Adds the line-art (fiction-manga 線画) inputs to the rough briefs. EPISODE=N (default 1) picks the episode's panels.

usage: ink-briefs.py BRIEFS_ROOT ROUGH_DIR
BRIEFS_ROOT: rough-briefs.py output (each panel's layout.png, refs.txt, frame.json; briefs.json).
ROUGH_DIR: part1/rough (the accepted rough: panels/<panel>.jpg and prompts/<panel>.txt).
Writes BRIEFS_ROOT/<panel>/rough.png (the accepted rough padded to the same generation canvas as layout.png)
and BRIEFS_ROOT/<panel>/ink-brief.txt (the rough's panel brief, with the author's rough corrections, plus ink notes).
"""
import json, os, re, sys
from PIL import Image

root, rough = sys.argv[1:3]
EP = int(os.environ.get('EPISODE', '1'))
briefs = json.load(open(f'{root}/briefs.json'))

# Notes from the author's rough review (2026-11-14) that the line art must fix.
INK_NOTES = {
    'e01-p12-k5': "The author found this face cut unnaturally (one huge eye cut off by the frame, a sliver of grass). Here do NOT follow the rough's crop: follow the SECOND image. The camera looks straight down on Gulliver's face; the face sits in the middle of the wide strip (about the middle 45% of the width) with his hair and the grass on both sides. Show BOTH eyes (heavy, half-closed, drowsy from the drugged wine), both eyebrows and the bridge of the nose, the head upright in the frame (forehead toward the top). The top and bottom frame edges cross the forehead and the nose, which is the intended extreme close-up; the left and right edges of the face, the ears and the hair must be inside the frame.",
    # 通読の直し（2026-11-14、作者が提案どおりと判断）
    'e01-p12-k3': "Read-through correction (RV-e01-04): the dancing Lilliputians were drawn far too big, almost the size of Gulliver's face. Keep the composition (Gulliver lying with his face at the left-middle, the barrel thrown up, the dancers celebrating on his chest), but draw every Lilliputian at its TRUE size, 1/12 of Gulliver: a whole Lilliputian standing beside his head is no taller than his face from chin to forehead, and no Lilliputian head is bigger than his eye. One or two nearer dancers may be bigger in the foreground at the frame edge, cut off by the frame, but not covering his face. Draw many small dancers on his chest and around his head, arms raised, hats waving.",
    'e01-p15-k2': "Read-through correction (RV-e01-07): only Gulliver's LEFT leg is chained (the text: 91 chains fixed to his left leg with 36 padlocks), as in the panel before. Draw the chain and the shackle ONLY on his left ankle (the leg toward frame right), running to the ring in the temple wall; his right ankle (toward frame left) is free: no shackle, no chain, no ring line to it.",
    'e01-p15-k1': "Gulliver's LEFT leg is still chained: draw the chain from his left ankle back to the temple behind him (the rough missed it). Do not draw any grey padding line at the frame edge.",
    # 第2話：作者のラフの確認（2026-11-15「上着を脱いだままでいい」）
    'e02-p12-k2': "The author confirmed: in the city Gulliver has his long coat OFF and wears only the short waistcoat over his shirt (as in the rough); he holds the waistcoat close and steps sideways with great care. Do not draw a long coat or coat skirts.",
    # 第2話の通読の直し（2026-11-15、作者「これと提案の6件を直してください」）
    'e02-p03-k1': "Read-through correction (RV-e02-01): the rough drew the dancing thread as a thick stone coping on top of a wall, so it does not read as a thread. Keep Flimnap's leap and the low camera looking up at him against the sky, but draw what the text says: a single FINE THREAD (thin as a hair, one thin line) stretched between two slim wooden posts, only 12 inches above the grass of the court; Flimnap springs high above that thin thread, his feet far above it. No wall, no stone ledge under him: grass and the posts below, sky and clouds behind, the temple far off.",
    'e02-p11-k1': "Read-through correction (RV-e02-04): the houses of the city were drawn bigger than Gulliver although they are farther away. Here Gulliver stands just outside the city wall, near the camera's side; the city wall (2.5 feet) comes only to about his knee, and the roofs of the three-storey houses behind it reach no higher than the middle of his thigh. The whole city (500 feet square, with the palace in the middle) spreads out like a model town at his feet, its roofs far below his waist. Keep the hill-top view, the grass in front and the great street running to the palace.",
    'e02-p11-k2': "Read-through correction (RV-e02-05): the guard on the wall was drawn far too big (up to Gulliver's knee). A Lilliputian is 1/12 of Gulliver: a whole man is about as tall as Gulliver's shoe is long, no higher than his ankle-bone. Draw the guard that small on top of the city wall, pointing; the wall (2.5 feet high) comes to about the middle of Gulliver's shin-to-knee, so Gulliver steps beside it like a man beside a garden wall. Keep Gulliver's pose (short waistcoat, no coat) and the rest of the composition.",
    'e02-p16-k2': "Read-through correction (RV-e02-06): the palace window beside Gulliver's head was drawn bigger than his head. The windows of the royal apartments are tiny: 4 by 6 inches, about the size of Gulliver's EYE with the brow; the whole building is only about as tall as Gulliver kneeling. Draw Gulliver lying face down in the narrow inner court in the sunset, his chin on his hands, his face right at one tiny lit window, much bigger than it; the building's eaves come just above his head. Keep the sunset sky and the other palace buildings behind.",
    # 第3話：線画の見直し（2026-11-17、作者の決まり「顔を切らない」、LN-e02-02）
    'e03-p03-k1': "The rough cut Gulliver's face at the top edge, leaving only a sliver of his chin, which the author's rule forbids (never show only part of a face). Follow the SECOND image here: Gulliver's head is entirely ABOVE the frame. The top frame edge crosses his neckcloth (cravat) below the chin, so NO chin, mouth or any part of his face shows, only his neckcloth, coat front and buttons, his forearms and his open right palm. Keep Reldresal standing on the palm, back to the camera, one arm raised, and the door and grass behind.",
}

for pid, b in briefs.items():
    if not pid.startswith(f'e{EP:02d}-'): continue
    d = f'{root}/{pid}'
    cw, ch = b['frame']['canvas']; ox, oy, pw, ph = b['frame']['panel']
    im = Image.new('RGB', (cw, ch), (128, 128, 128))
    im.paste(Image.open(f'{rough}/panels/{pid}.jpg').convert('RGB').resize((pw, ph), Image.LANCZOS), (ox, oy))
    im.save(f'{d}/rough.png')
    prompt = open(f'{rough}/prompts/{pid}.txt').read()
    m = re.search(r'^(Panel e\d\d-.*?)\n\nAfter generating', prompt, re.S | re.M)
    brief = m.group(1)
    brief = brief.replace('The FIRST image is the 3D layout render', 'The SECOND image is the 3D layout render')
    brief = brief.replace('edges of the FIRST image are padding', 'edges of the FIRST and SECOND images are padding')
    brief = brief.replace('(keep these places, facings and poses;', '(as placed in the rough and the 3D layout: keep these places, facings and poses;')
    if pid in INK_NOTES:
        brief += '\nLine-art correction after the author\'s rough review: ' + INK_NOTES[pid]
    open(f'{d}/ink-brief.txt', 'w').write(brief)
print(sum(1 for p in briefs if p.startswith(f'e{EP:02d}-')), 'ink briefs')
