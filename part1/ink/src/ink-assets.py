#!/usr/bin/env python3
"""Turns the Codex line-art runs into an episode's line-art layers (fiction-manga 線画). EPISODE=N (default 1).

usage: ink-assets.py BRIEFS_ROOT GM_COMMIT OUT_DIR
BRIEFS_ROOT: rough-briefs.py + ink-briefs.py output with each panel's ink-raw.png, ink-prompt.txt and ink-codex.log.
GM_COMMIT: the gulliver-manga commit that holds the references passed to Codex (rough, setting art: their fixed version).
The raw image is inked in three colours that mark the layers (gen-ink.sh): black = figures (LY-07), blue = background (LY-04),
red = effect lines (LY-08). It is cut back to the panel frame and split by hue into three black-line PNGs with transparent
background, at most MAX px on the long side (OUT_DIR/layers/<panel>-LY-0n.png), with a composite for review
(OUT_DIR/panels/<panel>.jpg). Writes OUT_DIR/prompts/<panel>.txt and OUT_DIR/epNN-ink.json (only that episode's panels).
"""
import hashlib, json, os, re, sys
from PIL import Image, ImageOps

root, commit, out = sys.argv[1:4]
EP = int(os.environ.get('EPISODE', '1'))
JSON = f'{out}/ep{EP:02d}-ink.json'
MAX = int(os.environ.get('INK_MAX', '900'))
GM = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
briefs = json.load(open(f'{root}/briefs.json'))
for sub in ('layers', 'panels', 'prompts'): os.makedirs(f'{out}/{sub}', exist_ok=True)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
LAYER = {'fig': 'LY-07', 'bg': 'LY-04', 'fx': 'LY-08'}


def split(rgb):
    """Per pixel: ink amount (0..255) and which layer it belongs to, from the hue of the ink."""
    W, H = rgb.size
    px = rgb.load()
    alpha = {k: Image.new('L', (W, H), 0) for k in LAYER}
    ap = {k: a.load() for k, a in alpha.items()}
    count = {k: 0 for k in LAYER}
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            ink = 255 - min(r, g, b)
            if ink < 24: continue
            if b - max(r, g) > 40: k = 'bg'
            elif r - max(g, b) > 50: k = 'fx'
            else: k = 'fig'
            # Antialiased grey edges of black lines are ink too; a coloured line's ink is how far it is from white.
            ap[k][x, y] = ink; count[k] += 1
    return alpha, count


def to_png(a, path):
    # Black line with the ink as alpha, quantised to 4 levels so the PNG stays small (the episode's Design must stay
    # under the Playground's 16 MB import limit).
    q = a.point(lambda v: 0 if v < 40 else 85 if v < 110 else 170 if v < 180 else 255)
    im = Image.new('LA', a.size, 0); im.putalpha(q)
    im.save(path, optimize=True)
    return os.path.getsize(path)


# INK_ONLY=<panel>,... redraws those panels only and keeps the rest of epNN-ink.json (e.g. the read-through fixes).
ONLY = os.environ.get('INK_ONLY', '').split(',') if os.environ.get('INK_ONLY') else None
REVISED = {'e01-p12-k3': 'RV-e01-04', 'e01-p15-k2': 'RV-e01-07', 'e01-p01-k1': 'RV-e01-03',
           'e02-p03-k1': 'RV-e02-01', 'e02-p07-k4': 'RV-e02-02', 'e02-p11-k1': 'RV-e02-04', 'e02-p11-k2': 'RV-e02-05',
           'e02-p16-k2': 'RV-e02-06', 'e02-p16-k1': 'RV-e02-09',
           'e03-p02-k2': 'RV-e03-01', 'e03-p06-k1': 'RV-e03-02', 'e03-p04-k4': 'RV-e03-03', 'e03-p12-k1': 'RV-e03-04',
           'e03-p11-k1': 'RV-e03-08', 'e03-p16-k1': 'RV-e03-06', 'e03-p16-k2': 'RV-e03-06'}
REVISED_DATE = {'e01': '2026-11-14', 'e02': '2026-11-15', 'e03': '2026-11-17'}
before = json.load(open(JSON))['panels'] if ONLY else {}
panels = dict(before)
for pid, b in briefs.items():
    if not pid.startswith(f'e{EP:02d}-') or (ONLY and pid not in ONLY): continue
    d = f'{root}/{pid}'
    if not os.path.exists(f'{d}/ink-raw.png'): continue
    raw = Image.open(f'{d}/ink-raw.png').convert('RGB')
    cw, ch = b['frame']['canvas']; ox, oy, pw, ph = b['frame']['panel']; W, H = b['frame']['underlay']
    sx, sy = raw.width / cw, raw.height / ch
    k = min(1, MAX / max(W, H))
    size = (round(W * k), round(H * k))
    cut = raw.crop((round(ox * sx), round(oy * sy), round((ox + pw) * sx), round((oy + ph) * sy))).resize(size, Image.LANCZOS)
    alpha, count = split(cut)
    total = sum(count.values()) or 1
    layers = {}
    comp = Image.new('RGB', size, (255, 255, 255))
    tint = {'fig': (0, 0, 0), 'bg': (40, 80, 220), 'fx': (220, 30, 30)}
    for key, ly in LAYER.items():
        path = f'{out}/layers/{pid}-{ly}.png'
        layers[ly] = {'image': f'layers/{pid}-{ly}.png', 'share': round(count[key] / total, 3), 'bytes': to_png(alpha[key], path)}
        comp.paste(Image.new('RGB', size, tint[key]), (0, 0), alpha[key])
    comp.save(f'{out}/panels/{pid}.jpg', quality=80)
    # The hidden LY-01 (3D camera picture) and LY-02 (rough) enter the line-art Design as small grey copies (long side
    # 480 px) to keep it under the Playground's 16 MB import limit.
    os.makedirs(f'{out}/hidden', exist_ok=True)
    for ly, src in (('LY-01', f'{GM}/part1/name/stage/underlay/{pid}.jpg'), ('LY-02', f'{GM}/part1/rough/panels/{pid}.jpg')):
        hid = ImageOps.grayscale(Image.open(src)); hid.thumbnail((480, 480), Image.LANCZOS)
        hid.save(f'{out}/hidden/{pid}-{ly}.jpg', quality=70, optimize=True)
    prompt = open(f'{d}/ink-prompt.txt').read()
    open(f'{out}/prompts/{pid}.txt', 'w').write(prompt)
    log = open(f'{d}/ink-codex.log', errors='replace').read()
    model = re.search(r'^model: (.+)$', log, re.M)
    ver = re.search(r'OpenAI Codex v([\d.]+)', log)
    session = re.search(r'^session id: (.+)$', log, re.M)
    refs = [{'path': f'part1/rough/panels/{pid}.jpg', 'commit': commit, 'sha256': sha(f'{GM}/part1/rough/panels/{pid}.jpg')},
            {'path': f'part1/name/stage/underlay/{pid}.jpg', 'commit': commit, 'sha256': sha(f'{GM}/part1/name/stage/underlay/{pid}.jpg')}]
    refs += [{'path': os.path.relpath(p, GM), 'commit': commit, 'sha256': sha(p)} for p in b['refs']]
    panels[pid] = {
        'layers': layers,
        'review': f'panels/{pid}.jpg',
        'prompt': f'prompts/{pid}.txt',
        'tool': f"Codex CLI {ver.group(1) if ver else '?'} (codex exec), built-in image generation tool, ChatGPT sign-in",
        'codexModel': model.group(1) if model else None,
        'imageModel': 'not exposed by the Codex image tool',
        'codexSession': session.group(1) if session else None,
        'rawSha256': sha(f'{d}/ink-raw.png'),
        'rawSize': [raw.width, raw.height],
        'frame': b['frame'],
        'refs': refs,
    }
    if pid in before and REVISED.get(pid):
        panels[pid]['revision'] = {'finding': REVISED[pid], 'date': REVISED_DATE[pid[:3]], 'previousRawSha256': before[pid]['rawSha256']}
    print(pid, {ly: v['share'] for ly, v in layers.items()}, sum(v['bytes'] for v in layers.values()) // 1024, 'KB')
json.dump({'schemaVersion': 1, 'episode': EP, 'generatedAt': '2026-11-14' if EP == 1 else '2026-11-15', 'panels': panels}, open(JSON, 'w'), ensure_ascii=False, indent=1)
print(len(panels), 'panels')
