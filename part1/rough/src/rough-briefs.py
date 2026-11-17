#!/usr/bin/env python3
"""Writes one Codex brief per panel for the ep1 rough (fiction-manga ラフ), from the ネーム panel table and the 3D stage.

usage: rough-briefs.py NAME_PANELS_JSON STAGE_JSON UNDERLAY_DIR OUT_DIR
Writes OUT_DIR/<panel>/{brief.txt,layout.png,refs.txt,frame.json} and OUT_DIR/briefs.json.
layout.png is the panel's 3D camera picture padded with grey to the generation canvas (1536x1024, 1024x1536 or 1024x1024);
frame.json says where the panel sits in that canvas, so the generated image can be cut back to the panel.
"""
import json, math, os, sys
from PIL import Image

panels_path, stage_path, ul_dir, out = sys.argv[1:5]
# 通読の直し（RV-e01-03、2026-11-14）：扉のカメラを、胸の上の小人の後ろの少し上へ引いた（stage の ep01-stage.json の revised）。
# ネームのカメラの覚え書きはこの直しの前のまま。
REVISED_CAMERA = {
    'e01-p01-k1': {'nm.eye': '胸の上の小人たちの後ろの少し上', 'nm.mm': 545, 'nm.look': '胸の上に並ぶ小人たちの背中と弓の向こうに、横たわるガリヴァーの顎と顔'},
}
# 第2話の通読の直し（RV-e02-02・RV-e02-09、2026-11-15、作者「これと提案の6件を直してください」）：7-4 は引いて頭まで入れ、
# 16-1 は部屋の中からではなく窓の外の脇から（stage の ep02-stage.json の revised）。
REVISED_CAMERA.update({
    'e02-p07-k4': {'nm.look': '座るガリヴァーの頭から足まで全身と、その前に立つボルゴラムの一行'},
    'e02-p16-k1': {'nm.eye': '宮殿の外、窓の脇の壁ぎわ', 'nm.mm': 350, 'nm.stand': '', 'nm.look': '窓から差し出された皇后の小さな手と、そこへ唇を寄せるガリヴァーの横顔の全体'},
})
REVISED_NOTE = {
    'e01-p01-k1': "Correction after the read-through (the cover): the Lilliputians standing on Gulliver's chest must be clearly SEEN, as the cover's subject: in the foreground several tiny archers and men seen from behind, full figures from head to feet, bows drawn and quivers on their backs, standing on the blue coat with its brass buttons; beyond them, up the slope of his chest, Gulliver's chin and face (eyes open, looking down along his body in astonishment), his hair tied to the sand. The Lilliputians are 1/12 of his size: a whole man is about as tall as Gulliver's face. Beach sand and the sky beyond.",
}
REVISED_NOTE.update({
    'e02-p07-k4': "Correction after the read-through (RV-e02-02): Gulliver's head was cut off by the top of the frame. This is a wide shot: draw seated Gulliver WHOLE, from the top of his head to his shoes, with sky above his head, inside the frame; his face (looking down at Bolgolam) must be fully visible. Bolgolam and his party stand small on the grass in front of him, reading the long parchment; the temple wall and its door behind Gulliver.",
    'e02-p16-k1': "Correction after the read-through (RV-e02-09, the author: his face showing only as a nose in the window looked creepy): the camera is now OUTSIDE the palace, low beside the wall. The 3D layout is only a rough guide here (its stand-in puts his raised hands at the bottom left and his head just below the frame): move the camera back a little so his whole head is IN the frame. Show Gulliver's WHOLE face in profile (forehead, eye, nose, lips and chin, his hair tied back), lying on the ground of the court with his chin low; the palace wall with its tiny window (about as big as his eye) is beside his face. From that small window the Empress leans out and holds out her tiny hand; Gulliver brings his lips very gently to her hand. Her whole hand is about the size of his fingernail; she is seen from the waist up in the window frame, her crown and her smile. Gentle evening light.",
})
rows = {r['id']: r['values'] for r in json.load(open(panels_path))['draft']['content']['rows']}
stage = json.load(open(stage_path))
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
REFS = {
    'CH-01': ('part1/codex/ch01-gulliver-front/ch01-gulliver-front-raw.png', 'the approved design of Gulliver (CH-01)'),
    'CH-30': ('part1/codex/lilliputian-front/lilliputian-front-raw.png', 'the approved design of a Lilliputian (CH-30, the tiny people)'),
    'EX-L': ('part1/codex/lilliputian-front/lilliputian-front-raw.png', 'the approved design of a Lilliputian (tiny people)'),
    'CH-02': ('part1/codex/ch02-emperor/ch02-emperor-raw.png', 'the approved design of the Emperor of Lilliput (CH-02)'),
    'CH-03': ('part1/codex/ch03-empress/ch03-empress-raw.png', 'the approved design of the Empress of Lilliput (CH-03)'),
    'CH-04': ('part1/codex/ch04-flimnap/ch04-flimnap-raw.png', 'the approved design of Flimnap, the Treasurer (CH-04)'),
    'CH-05': ('part1/codex/ch05-reldresal/ch05-reldresal-raw.png', 'the approved design of Reldresal, Principal Secretary of private affairs (CH-05)'),
    'CH-06': ('part1/codex/ch06-bolgolam/ch06-bolgolam-raw.png', 'the approved design of Skyresh Bolgolam, the High Admiral (CH-06)'),
    'LO-03': ('part1/codex/lo03-temple/lo03-temple-raw.png', 'the approved setting art of the old temple (LO-03), where Gulliver is chained'),
    'LO-04': ('part1/codex/lo04-mildendo/lo04-mildendo-raw.png', 'the approved setting art of the capital Mildendo (LO-04)'),
}
POSE = {
    'stand': 'standing', 'walk': 'walking', 'wave-hat': 'waving his hat', 'hands-together': 'standing with hands clasped in front',
    'turn-away': 'turning her face away', 'carry-bag': 'carrying a sea bag on his shoulder', 'lie': 'lying flat on his back',
    'lie-look': 'lying on his back, eyes looking down along his body', 'lie-arm-free': 'lying on his back, left arm pulled free and raised',
    'lie-eat': 'lying on his back, left hand bringing food to his mouth', 'lie-drink': 'lying on his back, tipping a tiny barrel into his mouth with the left hand',
    'lie-hand-hover': 'lying on his back, left hand hovering above his chest', 'swim': 'swimming', 'tread': 'treading water, head above water',
    'sit': 'sitting', 'sit-palm': 'sitting on the ground, one open palm held out low with tiny people performing on it',
    'sit-reach': 'sitting on the ground, reaching out a hand', 'sit-look-down': 'sitting on the ground, looking down at the tiny people',
    'prone-look': 'lying face down, propped on his elbows, head raised, looking ahead', 'oath': 'standing on his left foot, holding his right foot in his left hand, the middle finger of his right hand on the crown of his head and the thumb on the tip of his right ear (the Lilliputian oath)',
    'step-over': 'stepping over with one long stride', 'jump': 'leaping high', 'hold-stick': 'holding a stick level in both hands',
    'arms-crossed': 'standing with arms crossed, sullen', 'read': 'reading aloud from a long parchment', 'archer': 'drawing a bow', 'sword-up': 'raising a sword', 'point': 'pointing', 'orate': 'giving a speech with one arm out',
    'fall': 'tumbling and falling', 'dance': 'dancing / hopping', 'carry-up': 'lifting a basket', 'crouch': 'crouching',
    # 第3話のポーズ
    'prone-palm': 'lying face down, propped up on his elbows with his chin raised, his right palm open on the ground in front of his face',
    'telescope': 'standing, looking through a pocket telescope held to his eye with both hands', 'wade': 'wading through the sea, arms out for balance',
    'tow': 'wading back through the sea, leaning forward, towing the bundle of cables held in his right hand behind him',
    'kneel': 'kneeling on one knee, head bowed', 'bow': 'bowing deeply from the waist', 'cheer': 'standing with both arms raised high, shouting',
    'hands-face': 'raising both hands to the face', 'limp': 'limping, one heel higher than the other', 'glare': 'glaring with arms crossed',
    'tie': 'bending over, tying knots with both hands', 'stand-in-water': 'standing in the sea, arms low',
}
WHO = {
    'CH-01': 'Gulliver (CH-01): 1,750 mm, plain blue coat with brass buttons and NO gold trim, tan breeches, white stockings, black shoes, brown hair tied back',
    'CH-10': 'Mary, Gulliver\'s wife (CH-10): plain dark early-18th-century house dress, white apron and cap, practical',
    'CH-30': 'a Lilliputian (CH-30): 146 mm tall, 1/12 of Gulliver',
    'CH-02': 'the Emperor of Lilliput (CH-02): a Lilliputian, taller than his courtiers by about the breadth of Gulliver\'s fingernail',
    'CH-03': 'the Empress of Lilliput (CH-03): a Lilliputian, 1/12 of Gulliver',
    'CH-04': 'Flimnap, the Treasurer (CH-04): a lean, tall Lilliputian, 1/12 of Gulliver',
    'CH-05': 'Reldresal, Principal Secretary of private affairs (CH-05): a Lilliputian, 1/12 of Gulliver, narrow eyes, calm and kind',
    'CH-06': 'Skyresh Bolgolam, the High Admiral (CH-06): a stout, sour-faced Lilliputian, 1/12 of Gulliver',
    'EX': 'an extra',
    'horse': 'a young horse',
}

EPISODE_NOTES = os.path.join(os.path.dirname(__file__), 'episode-notes.py')
_notes = {}
if os.path.exists(EPISODE_NOTES): exec(open(EPISODE_NOTES).read(), _notes)
def episode_notes(pid, v, p):
    f = _notes.get('notes')
    return f(pid, v, p) if f else []

def sub(a, b): return [a[i] - b[i] for i in range(3)]
def dot(a, b): return sum(a[i] * b[i] for i in range(3))
def cross(a, b): return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
def norm(a):
    l = math.sqrt(dot(a, a)); return [x / l for x in a]

def project(p, cam, f, r, u, th, tv):
    d = sub(p, cam); z = dot(d, f)
    if z <= 1: return None
    return ((dot(d, r) / z / th + 1) / 2, (1 - dot(d, u) / z / tv) / 2)

def where(s):
    if s is None: return 'behind the camera (not drawn)'
    x, y = s
    if not (-0.15 <= x <= 1.15 and -0.15 <= y <= 1.15): return 'outside the frame'
    h = 'left' if x < 0.33 else 'right' if x > 0.67 else 'centre'
    v = 'top' if y < 0.33 else 'bottom' if y > 0.67 else 'middle'
    return f'{v}-{h} of the frame (x {round(x*100)}%, y {round(y*100)}%)'

def canvas(w, h):
    a = w / h
    return (1536, 1024) if a > 1.2 else (1024, 1536) if a < 0.83 else (1024, 1024)

briefs = {}
for p in stage['panels']:
    pid = p['panel']; v = rows[pid]; os.makedirs(f'{out}/{pid}', exist_ok=True)
    cam, look = p['cam'], p['look']
    f = norm(sub(look, cam)); r = norm(cross(f, [0, 0, 1])); u = cross(r, f)
    th, tv = math.tan(math.radians(p['hfovDeg']) / 2), math.tan(math.radians(p['vfovDeg']) / 2)
    figs = []; refs = []; vis = []
    fk = {q['fig']: q for q in p.get('points') or []}
    lilli = p['set'] not in ('stable', 'port', 'sea')
    for g in p['figures']:
        fac = math.radians(g['facingDeg']); fwd = [-math.sin(fac), math.cos(fac), 0]
        h = g['heightMm']; at = g['at']
        if g.get('fig') in fk and g['pose'].startswith(('prone', 'lie', 'swim')):
            # 第3話から：ポーズの at は腰（足ではない）。頭は stage の points（FK）から取る。
            head = fk[g['fig']]['head']
            sh, sl = project(head, cam, f, r, u, th, tv), project(at, cam, f, r, u, th, tv)
            inside = lambda q: q is not None and -0.05 <= q[0] <= 1.05 and -0.05 <= q[1] <= 1.05
            seen = (f'head at {where(sh)}' if inside(sh) else f'head outside the frame, hips at {where(sl)}' if inside(sl)
                    else 'outside the frame (at most a cut-off sliver at the frame edge)')
            orient = seen
        elif g['pose'].startswith('prone'):
            # Face down: `at` is the feet and the body lies along the facing, head raised on the elbows.
            head = [at[0] + fwd[0]*h*0.9, at[1] + fwd[1]*h*0.9, at[2] + h*0.2]
            sh, sf = project(head, cam, f, r, u, th, tv), project(at, cam, f, r, u, th, tv)
            orient = f'head at {where(sh)}, feet at {where(sf)}'
            seen = orient
        elif g['pose'].startswith('lie'):
            head = [at[0] - fwd[0]*h*0.5, at[1] - fwd[1]*h*0.5, at[2] + h*0.1]
            feet = [at[0] + fwd[0]*h*0.5, at[1] + fwd[1]*h*0.5, at[2] + h*0.05]
            sh, sf = project(head, cam, f, r, u, th, tv), project(feet, cam, f, r, u, th, tv)
            orient = f'head at {where(sh)}, feet at {where(sf)}'
            seen = orient
        else:
            # A seated figure's head is about half the standing height (第2話から：座るガリヴァーの頭を正しく写す).
            hz, bz = (0.52, 0.3) if g['pose'].startswith('sit') and pid >= 'e02' else (0.93, 0.55)
            head = fk[g['fig']]['head'] if g.get('fig') in fk else [at[0], at[1], at[2] + h*hz]
            sh = project(head, cam, f, r, u, th, tv)
            sb, sl = project([at[0], at[1], at[2] + h*bz], cam, f, r, u, th, tv), project(at, cam, f, r, u, th, tv)
            if g['ch'] == 'horse':
                # A horse's head is forward of its body: try the neck, the head and the muzzle.
                for k, zk in ((0.45, 1.0), (0.65, 1.05), (0.8, 0.85)):
                    q = project([at[0] + fwd[0]*h*k, at[1] + fwd[1]*h*k, at[2] + h*zk], cam, f, r, u, th, tv)
                    if q is not None and -0.05 <= q[0] <= 1.05 and -0.05 <= q[1] <= 1.05: sh = q; break
            to = norm([cam[0]-at[0], cam[1]-at[1], 0]) if abs(cam[0]-at[0]) + abs(cam[1]-at[1]) > 1 else [0, 0, 0]
            c = dot(fwd, to); side = dot(fwd, r)
            orient = ('facing the camera' if c > 0.7 else 'back to the camera' if c < -0.7 else
                      f'three-quarter view toward the camera, turned to frame {"right" if side > 0 else "left"}' if c > 0 else
                      f'three-quarter back view, turned to frame {"right" if side > 0 else "left"}' if c > -0.7 else 'in profile')
            if -0.35 < c < 0.35: orient = f'in profile, facing frame {"right" if side > 0 else "left"}'
            inside = lambda q: q is not None and -0.05 <= q[0] <= 1.05 and -0.05 <= q[1] <= 1.05
            if inside(sh): seen = f'head at {where(sh)}'
            elif inside(sb): seen = f'big in the foreground, head cut off by the frame edge, body at {where(sb)}'
            elif inside(sl): seen = f'only the legs/feet in frame, at {where(sl)}'
            elif sb is not None and sh is not None and sl is not None and (sh[1] < 0 < sl[1] or sl[1] < 0 < sh[1]) and -0.3 < sb[0] < 1.3:
                seen = f'very close, filling the foreground near x {round(sb[0]*100)}% (cut by the frame)'
            else: seen = 'outside the frame (at most a cut-off sliver at the frame edge)'
            orient = f'{seen}, {orient}'
        dist = math.dist(cam, head)
        hr = None
        if sh is not None and dist > 1:
            # Head (about 230 mm tall at full size) as a fraction of the frame height.
            hr = round(h * 0.13 / 2 / dist / tv / 2 * 2, 3)
        vis.append({'fg': g['fg'], 'inFrame': not seen.startswith('outside') and not ('behind the camera' in seen and 'outside' in seen), 'where': seen,
                    'head': [round(sh[0], 3), round(sh[1], 3)] if sh is not None else None, 'headR': hr})
        who = WHO['CH-30'] if g['ch'] == 'EX' and lilli else WHO.get(g['ch'], g['name'])
        if g.get('fig') == 'gj': who = 'Gulliver (CH-01): 1,750 mm, coat, shoes and stockings OFF: a sleeveless leather jerkin over his shirt, breeches, bare legs and bare feet, brown hair tied back'
        if g['ch'] == 'EX' and not lilli: who = 'an early-18th-century English sailor or townsperson (extra)'
        figs.append(f"- {g['fg']} {g['name']} — {who}; {POSE.get(g['pose'], g['pose'])}; {orient}; {round(dist)} mm from the camera.")
        key = 'EX-L' if g['ch'] == 'EX' and lilli else g['ch']
        if key in REFS and REFS[key] not in refs: refs.append(REFS[key])
    if p['set'] in ('temple', 'court'): refs.append(REFS['LO-03'])
    if p['set'] == 'city' or '都' in v['nm.art'] or '城壁' in v['nm.stand']: refs.append(REFS['LO-04'])
    W, H = Image.open(f"{ul_dir}/{pid}.jpg").size
    cw, ch = canvas(W, H)
    s = min(cw / W, ch / H); pw, ph = round(W * s), round(H * s); ox, oy = (cw - pw) // 2, (ch - ph) // 2
    im = Image.new('RGB', (cw, ch), (128, 128, 128))
    im.paste(Image.open(f"{ul_dir}/{pid}.jpg").convert('RGB').resize((pw, ph), Image.LANCZOS), (ox, oy))
    im.save(f'{out}/{pid}/layout.png')
    json.dump({'canvas': [cw, ch], 'panel': [ox, oy, pw, ph], 'underlay': [W, H]}, open(f'{out}/{pid}/frame.json', 'w'))
    noframe = '' if (ox, oy) == (0, 0) else ' The flat grey bands at the edges of the FIRST image are padding outside the panel: continue the scene into them, nothing important there.'
    text = v['nm.text'].replace(' / ', '\n  ') or '(no words)'
    if pid in REVISED_CAMERA: v = {**v, **REVISED_CAMERA[pid]}
    brief = f"""Panel {pid}, page {v['nm.page']} panel {v['nm.order']}, scene {v['nm.scene']}.
Shot: {v['nm.shot']}. Camera: {v['nm.eye']}, {v['nm.mm']} mm above the ground{' (standing on: ' + v['nm.stand'] + ')' if v['nm.stand'] else ''}; {v['nm.look']}.
What the panel shows (storyboard memo): {v['nm.art']}
Words in this panel (for the mood and the faces only, do NOT draw any text): {text}
Figures, placed by the 3D layout (keep these places, facings and poses; draw each with a readable face direction, pose and expression):
{chr(10).join(figs) if figs else '- no figures'}
The FIRST image is the 3D layout render from this camera: figures there are blocky stand-ins, ground/sea/walls are flat placeholders.{noframe}"""
    if pid in REVISED_NOTE: brief += '\n' + REVISED_NOTE[pid]
    # 第1話の学び（LN-e01-02 大きさの比べ、LN-e01-03 背景、LN-e01-04 続く状態）を、話ごとの覚え書きから足す。
    for line in episode_notes(pid, v, p): brief += '\n' + line
    if p.get('noModel'):
        brief += f"\nThis place has only a placeholder 3D model: {p['noModel']}"
    open(f'{out}/{pid}/brief.txt', 'w').write(brief)
    open(f'{out}/{pid}/refs.txt', 'w').write('\n'.join(os.path.join(ROOT, a) + '\t' + b for a, b in refs))
    briefs[pid] = {'brief': brief, 'refs': [a for a, _ in refs], 'frame': json.load(open(f'{out}/{pid}/frame.json')), 'figures': vis}
json.dump(briefs, open(f'{out}/briefs.json', 'w'), ensure_ascii=False, indent=1)
print(len(briefs), 'briefs')
