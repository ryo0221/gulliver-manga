#!/usr/bin/env python3
"""Turns the Codex rough runs into an episode's rough assets (fiction-manga ラフ). EPISODE=N (default 1).

usage: rough-assets.py BRIEFS_ROOT GM_COMMIT OUT_DIR
BRIEFS_ROOT: rough-briefs.py output with each panel's raw.png, prompt.txt and codex.log (gen-rough.sh).
GM_COMMIT: the gulliver-manga commit that holds the reference images passed to Codex (their fixed version).
Writes OUT_DIR/panels/<panel>.jpg (the raw cut back to the panel frame, the underlay's aspect, at most 900 px, grey),
OUT_DIR/prompts/<panel>.txt and OUT_DIR/epNN-rough.json (only that episode's panels).
"""
import hashlib, json, os, re, sys
from PIL import Image, ImageFilter, ImageOps

root, commit, out = sys.argv[1:4]
EP = int(os.environ.get('EPISODE', '1'))
# 通読の直しで描き直したコマ（第2話、2026-11-15）：前の生の出力の sha256 を残す。
REVISED = {'e02-p07-k4': 'RV-e02-02', 'e02-p16-k1': 'RV-e02-09',
           'e03-p02-k2': 'RV-e03-01', 'e03-p06-k1': 'RV-e03-02', 'e03-p04-k4': 'RV-e03-03', 'e03-p12-k1': 'RV-e03-04',
           'e04-p04-k2': 'RV-e04-03', 'e04-p05-k1': 'RV-e04-02', 'e04-p15-k3': 'RV-e04-06', 'e04-p12-k1': 'RV-e04-04', 'e04-p16-k1': 'RV-e04-07'}
# 第4話の通読の直し（RV-e04-05、2026-11-20）：12-2 のナレーションが奥のガリヴァーの靴と脛を隠した。文字を置かない所として足す。
AVOID_EXTRA = {'e04-p12-k2': [('RV-e04-05 ガリヴァーの靴', 0.60, 0.44, 0.10), ('RV-e04-05 ガリヴァーの脛', 0.60, 0.18, 0.10)]}
GM = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
briefs = json.load(open(f'{root}/briefs.json'))
os.makedirs(f'{out}/panels', exist_ok=True); os.makedirs(f'{out}/prompts', exist_ok=True)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
COLS = 24


def occupancy_grid(grey, figures):
    """Where the lettering should not go, 0..1 per cell (row-major): the rough's ink density above the panel's
    background level, and the heads of the figures in frame (from the 3D camera) at 1."""
    W, H = grey.size; rows = max(4, round(COLS * H / W))
    small = grey.filter(ImageFilter.GaussianBlur(2)).resize((COLS, rows), Image.BOX)
    dark = [1 - v / 255 for v in small.getdata()]
    srt = sorted(dark); lo, hi = srt[int(len(srt) * 0.3)], srt[int(len(srt) * 0.95)]
    cells = [max(0.0, min(1.0, (v - lo) / (hi - lo))) if hi > lo else 0.0 for v in dark]
    heads = []
    for f in figures:
        if not f.get('inFrame') or not f.get('head') or not f.get('headR'): continue
        hx, hy = f['head']; r = max(f['headR'], 0.04)
        heads.append({'fg': f['fg'], 'x': hx, 'y': hy, 'r': r})
        for j in range(rows):
            for i in range(COLS):
                # distance in frame-height units
                dx = ((i + 0.5) / COLS - hx) * W / H; dy = (j + 0.5) / rows - hy
                if dx * dx + dy * dy <= (r * 1.15) ** 2: cells[j * COLS + i] = 1.0
    return {'cols': COLS, 'rows': rows, 'cells': [round(c, 2) for c in cells], 'heads': heads}


panels = {}
_old = f'{out}/ep{EP:02d}-rough.json'
before = json.load(open(_old))['panels'] if os.path.exists(_old) else {}
for pid, b in briefs.items():
    d = f'{root}/{pid}'
    if not pid.startswith(f'e{EP:02d}-') or not os.path.exists(f'{d}/raw.png'):
        continue
    raw = Image.open(f'{d}/raw.png').convert('RGB')
    cw, ch = b['frame']['canvas']; ox, oy, pw, ph = b['frame']['panel']; W, H = b['frame']['underlay']
    sx, sy = raw.width / cw, raw.height / ch
    cut = raw.crop((round(ox * sx), round(oy * sy), round((ox + pw) * sx), round((oy + ph) * sy))).resize((W, H), Image.LANCZOS)
    # Keep the Design draft under the Playground's 16 MB import limit (draft + version both hold the images).
    k = min(1, 900 / max(W, H))
    ImageOps.grayscale(cut).resize((round(W * k), round(H * k)), Image.LANCZOS).save(f'{out}/panels/{pid}.jpg', quality=72, optimize=True)
    occupancy = occupancy_grid(ImageOps.grayscale(cut), b['figures'])
    for name, hx, hy, r in AVOID_EXTRA.get(pid, []):
        # 人物の頭のほかに、文字で隠さない物（大きさの比べになる物など）。
        rows = occupancy['rows']; Wc, Hc = cut.size
        occupancy['heads'].append({'fg': name, 'x': hx, 'y': hy, 'r': r})
        for j in range(rows):
            for i in range(COLS):
                dx = ((i + 0.5) / COLS - hx) * Wc / Hc; dy = (j + 0.5) / rows - hy
                if dx * dx + dy * dy <= (r * 1.15) ** 2: occupancy['cells'][j * COLS + i] = 1.0
    prompt = open(f'{d}/prompt.txt').read()
    open(f'{out}/prompts/{pid}.txt', 'w').write(prompt)
    log = open(f'{d}/codex.log', errors='replace').read()
    model = re.search(r'^model: (.+)$', log, re.M)
    ver = re.search(r'OpenAI Codex v([\d.]+)', log)
    session = re.search(r'^session id: (.+)$', log, re.M)
    refs = [{'path': os.path.relpath(p, GM), 'commit': commit, 'sha256': sha(p)} for p in b['refs']]
    panels[pid] = {
        'image': f'panels/{pid}.jpg',
        'prompt': f'prompts/{pid}.txt',
        'tool': f"Codex CLI {ver.group(1) if ver else '?'} (codex exec), built-in image generation tool, ChatGPT sign-in",
        'codexModel': model.group(1) if model else None,
        'imageModel': 'not exposed by the Codex image tool',
        'codexSession': session.group(1) if session else None,
        'rawSha256': sha(f'{d}/raw.png'),
        'rawSize': [raw.width, raw.height],
        'frame': b['frame'],
        'layout': f'part1/name/stage/underlay/{pid}.jpg',
        'refs': refs,
        'figures': b['figures'],
        'occupancy': occupancy,
    }
    # A panel drawn again before the author saw it (the first try did not follow the brief): keep why and the first raw.
    if os.path.exists(f'{d}/try1/raw.png'):
        panels[pid]['retake'] = {'reason': open(f'{d}/retake.txt').read().strip() if os.path.exists(f'{d}/retake.txt') else '', 'firstRawSha256': sha(f'{d}/try1/raw.png')}
    if pid in REVISED and pid in before and before[pid]['rawSha256'] != panels[pid]['rawSha256']:
        panels[pid]['revision'] = {'finding': REVISED[pid], 'date': {'e02': '2026-11-15', 'e04': '2026-11-20'}.get(pid[:3], '2026-11-17'), 'previousRawSha256': before[pid]['rawSha256']}
    elif pid in before and before[pid].get('revision'):
        panels[pid]['revision'] = before[pid]['revision']
json.dump({'schemaVersion': 1, 'episode': EP, 'generatedAt': '2026-11-14', 'panels': panels}, open(f'{out}/ep{EP:02d}-rough.json', 'w'), ensure_ascii=False, indent=1)
print(len(panels), 'panels')
