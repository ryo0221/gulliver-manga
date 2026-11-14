#!/usr/bin/env python3
"""Turns the Codex rough runs into the ep1 rough assets (fiction-manga ラフ).

usage: rough-assets.py BRIEFS_ROOT GM_COMMIT OUT_DIR
BRIEFS_ROOT: rough-briefs.py output with each panel's raw.png, prompt.txt and codex.log (gen-rough.sh).
GM_COMMIT: the gulliver-manga commit that holds the reference images passed to Codex (their fixed version).
Writes OUT_DIR/panels/<panel>.jpg (the raw cut back to the panel frame, the underlay's aspect, at most 900 px, grey),
OUT_DIR/prompts/<panel>.txt and OUT_DIR/ep01-rough.json.
"""
import hashlib, json, os, re, sys
from PIL import Image, ImageFilter, ImageOps

root, commit, out = sys.argv[1:4]
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
for pid, b in briefs.items():
    d = f'{root}/{pid}'
    if not os.path.exists(f'{d}/raw.png'):
        continue
    raw = Image.open(f'{d}/raw.png').convert('RGB')
    cw, ch = b['frame']['canvas']; ox, oy, pw, ph = b['frame']['panel']; W, H = b['frame']['underlay']
    sx, sy = raw.width / cw, raw.height / ch
    cut = raw.crop((round(ox * sx), round(oy * sy), round((ox + pw) * sx), round((oy + ph) * sy))).resize((W, H), Image.LANCZOS)
    # Keep the Design draft under the Playground's 16 MB import limit (draft + version both hold the images).
    k = min(1, 900 / max(W, H))
    ImageOps.grayscale(cut).resize((round(W * k), round(H * k)), Image.LANCZOS).save(f'{out}/panels/{pid}.jpg', quality=72, optimize=True)
    occupancy = occupancy_grid(ImageOps.grayscale(cut), b['figures'])
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
json.dump({'schemaVersion': 1, 'episode': 1, 'generatedAt': '2026-11-14', 'panels': panels}, open(f'{out}/ep01-rough.json', 'w'), ensure_ascii=False, indent=1)
print(len(panels), 'panels')
