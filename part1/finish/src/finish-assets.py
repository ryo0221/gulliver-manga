#!/usr/bin/env python3
"""Turns the Codex colour references into the ep1 finish layers (fiction-manga 仕上げ), under the accepted line art.

usage: finish-assets.py BRIEFS_ROOT INK_DIR GM_COMMIT OUT_DIR
BRIEFS_ROOT: finish-briefs.py output with each panel's color-raw.png, color-prompt.txt and color-codex.log (gen-finish.sh).
INK_DIR: part1/ink (the accepted line layers LY-04 / LY-07 / LY-08, which stay as they are).
GM_COMMIT: the gulliver-manga commit that holds the references passed to Codex.

Codex colours a copy of the line art; its picture is a colour reference only. The fills are made on the accepted lines:
1. the areas between the lines (connected regions of the panel without line ink) are found;
2. each pixel takes the reference's colour; inside a region, pixels clearly darker than the region's lit colour are the
   cel shadow: they go to LY-06 (a translucent shadow tone) and the fill there is lifted back to the lit colour;
3. a region is a figure's (LY-05) when most of the lines around it are figure lines (LY-07), else background (LY-03);
   line pixels take the fill of the nearest region, so no white shows along the lines.
Writes OUT_DIR/layers/<panel>-LY-03/05/06.webp (lossy WebP with alpha, at the line art's size), a composite with the
lines for review (OUT_DIR/panels/<panel>.jpg), OUT_DIR/prompts/<panel>.txt and OUT_DIR/ep01-finish.json.
"""
import hashlib, json, os, re, sys
import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

root, ink, commit, out = sys.argv[1:5]
GM = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
briefs = json.load(open(f'{root}/briefs.json'))
inkdata = json.load(open(f'{ink}/ep01-ink.json'))
for sub in ('layers', 'lines', 'panels', 'prompts'): os.makedirs(f'{out}/{sub}', exist_ok=True)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
SHADOW_RATIO = 0.84      # darker than this share of the lit level → cel shadow
SHADOW_TONE = (58, 48, 112)
MIN_REGION = 30
BINS = 8


def lum(a): return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def split(ref, lines):
    H, W = lines['LY-07'].shape
    ink_all = np.maximum.reduce([lines[k] for k in lines])
    linemask = ndi.binary_dilation(ink_all > 70, iterations=1)
    labels, n = ndi.label(~linemask)
    Y = lum(ref)
    fill = ref.copy()
    shadow = np.zeros((H, W), np.float32)
    sizes = ndi.sum(np.ones_like(labels), labels, index=np.arange(1, n + 1))
    # Figure or background, by the lines around each region.
    fig_near = ndi.binary_dilation(lines['LY-07'] > 70, iterations=3)
    bg_near = ndi.binary_dilation(lines['LY-04'] > 70, iterations=3)
    ring = ~linemask & ndi.binary_dilation(linemask, iterations=2)
    fig_votes = ndi.sum(ring & fig_near, labels, index=np.arange(1, n + 1))
    bg_votes = ndi.sum(ring & bg_near, labels, index=np.arange(1, n + 1))
    is_fig = np.zeros(n + 1, bool)
    objs = ndi.find_objects(labels)
    for i in range(n):
        lab = i + 1
        is_fig[lab] = fig_votes[i] > bg_votes[i] * 1.2
        if sizes[i] < MIN_REGION or objs[i] is None: continue
        sl = objs[i]
        m = labels[sl] == lab
        y = Y[sl]
        # Compare each pixel with the lit level of its own hue in this region (chromaticity bins), so a dark-coloured
        # thing (a mast against the sea, in a region the lines do not close) is not taken for a shadow.
        c = ref[sl]; tot = c.sum(-1) + 1
        hue = (np.clip(c[..., 0] / tot * BINS * 2.2, 0, BINS - 1)).astype(int) * BINS + (np.clip(c[..., 1] / tot * BINS * 2.2, 0, BINS - 1)).astype(int)
        dark = np.zeros_like(m)
        ratio = np.ones(m.shape, np.float32)
        for h in np.unique(hue[m]):
            hm = m & (hue == h)
            if hm.sum() < 20: continue
            lit = np.percentile(y[hm], 80)
            if lit < 8: continue
            dk = hm & (y < lit * SHADOW_RATIO) & (y > lit * 0.3)
            dark |= dk
            ratio[dk] = np.clip(y[dk] / lit, 0.3, 1.0)
        if dark.sum() < 12: continue
        # Lift the shadow pixels back to the lit colour in the fill; record the darkening as the shadow's strength.
        f = fill[sl]
        f[dark] = np.clip(f[dark] / ratio[dark][:, None], 0, 255)
        fill[sl] = f
        sh = shadow[sl]
        # Over a light fill, a dark tone at strength a darkens by about a / 1.3.
        sh[dark] = np.clip((1 - ratio[dark]) * 1.3, 0.18, 0.75)
        shadow[sl] = sh
    # Line pixels take the colour and the figure/background side of the nearest pixel between the lines.
    # (Small regions keep their own colour: masts, buttons and hatching make many of them.)
    _, (iy, ix) = ndi.distance_transform_edt(labels == 0, return_indices=True)
    lab_full = labels[iy, ix]
    fill = fill[iy, ix]
    figmask = is_fig[lab_full]
    # Cel shadow: one flat strength per connected shadow patch (smooth the per-pixel noise).
    smask = shadow > 0
    sl_lab, sn = ndi.label(smask)
    if sn:
        mean = ndi.mean(shadow, sl_lab, index=np.arange(1, sn + 1))
        shadow = np.where(smask, np.r_[0, mean][sl_lab], 0)
    return fill.astype(np.uint8), figmask, shadow


def register(ref, lines):
    """Codex redraws the lines a little: warp the reference onto the accepted lines (dense optical flow between the line
    art and the reference's own lines, smoothed), so each colour sits inside its own lines."""
    L = np.maximum.reduce([lines[k] for k in lines])
    H, W = L.shape
    a = np.clip(255 - L, 0, 255).astype(np.uint8)
    g = cv2.cvtColor(ref.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    bg = cv2.GaussianBlur(g, (0, 0), 6)
    lr = np.clip(255 - (bg.astype(np.int16) - g.astype(np.int16)) * 3, 0, 255).astype(np.uint8)
    flow = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM).calc(cv2.GaussianBlur(a, (0, 0), 1.5), cv2.GaussianBlur(lr, (0, 0), 1.5), None)
    flow = cv2.GaussianBlur(flow, (0, 0), 8)
    gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    return cv2.remap(ref.astype(np.float32), gx + flow[..., 0], gy + flow[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


# 通読の直し（RV-e01-05、2026-11-14）：8-1 は人物の線だけで塗らせたので（FIGURE_ONLY）、髪を留める杭まで草の緑になった。
# 杭の中心（線画の座標、長い辺 900 px）の近くの、線に囲まれた小さな領域だけを木の茶色に塗り直す。
REGION_FIX = {
    'e01-p08-k1': {'what': '髪を留める4本の杭を木の茶色に', 'rgb': (150, 105, 60),
                   'at': [(143, 257), (737, 257), (143, 430), (707, 443)], 'near': (16, 24), 'maxArea': 700},
}


def region_fix(pid, fill, lines):
    fx = REGION_FIX[pid]
    ink_all = np.maximum.reduce([lines[k] for k in lines])
    labels, n = ndi.label(~ndi.binary_dilation(ink_all > 70, iterations=1))
    sizes = ndi.sum(np.ones_like(labels), labels, index=np.arange(n + 1))
    centres = ndi.center_of_mass(np.ones_like(labels), labels, index=np.arange(n + 1))
    nx, ny = fx['near']
    sel = np.zeros(n + 1, bool)
    for x, y in fx['at']:
        for lab in np.unique(labels[max(0, y - 30):y + 30, max(0, x - 30):x + 30]):
            if lab and sizes[lab] < fx['maxArea'] and abs(centres[lab][1] - x) < nx and abs(centres[lab][0] - y) < ny: sel[lab] = True
    mask = sel[labels]
    fill[mask] = fx['rgb']
    return int(mask.sum())

def rgba(rgb, alpha):
    return Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)]), 'RGBA')


# FINISH_ONLY=<panel>,... recolours those panels only and keeps the rest of ep01-finish.json.
ONLY = os.environ.get('FINISH_ONLY', '').split(',') if os.environ.get('FINISH_ONLY') else None
REVISED = {'e01-p01-k1': 'RV-e01-03', 'e01-p12-k3': 'RV-e01-04', 'e01-p08-k1': 'RV-e01-05', 'e01-p15-k2': 'RV-e01-07', 'e01-p07-k2': 'RV-e01-09'}
before = json.load(open(f'{out}/ep01-finish.json'))['panels'] if ONLY else {}
panels = dict(before)
for pid, b in briefs.items():
    if ONLY and pid not in ONLY: continue
    d = f'{root}/{pid}'
    if not os.path.exists(f'{d}/color-raw.png'): continue
    ip = inkdata['panels'][pid]
    lines = {k: np.array(Image.open(f"{ink}/{v['image']}").getchannel('A'), np.float32) for k, v in ip['layers'].items()}
    H, W = lines['LY-07'].shape
    raw = Image.open(f'{d}/color-raw.png').convert('RGB')
    cw, ch = b['frame']['canvas']; ox, oy, pw, ph = b['frame']['panel']
    sx, sy = raw.width / cw, raw.height / ch
    ref = np.array(raw.crop((round(ox * sx), round(oy * sy), round((ox + pw) * sx), round((oy + ph) * sy))).resize((W, H), Image.LANCZOS), np.float32)
    ref = register(ref, lines)
    fill, figmask, shadow = split(ref, lines)
    fixed = region_fix(pid, fill, lines) if pid in REGION_FIX else None
    files = {}
    for ly, img in (('LY-03', rgba(fill, (~figmask).astype(np.float32))), ('LY-05', rgba(fill, figmask.astype(np.float32))),
                    ('LY-06', rgba(np.broadcast_to(np.array(SHADOW_TONE, np.uint8), (H, W, 3)), shadow))):
        path = f'{out}/layers/{pid}-{ly}.webp'
        img.save(path, 'WEBP', quality=78, method=6)
        files[ly] = {'image': f'layers/{pid}-{ly}.webp', 'bytes': os.path.getsize(path)}
    # The accepted line layers, re-encoded as lossless WebP (same pixels) so the episode's Design stays under the
    # Playground's 16 MB import limit.
    lines_out = {}
    for ly in ('LY-04', 'LY-07', 'LY-08'):
        path = f'{out}/lines/{pid}-{ly}.webp'
        Image.open(f"{ink}/{ip['layers'][ly]['image']}").save(path, 'WEBP', lossless=True, method=6)
        lines_out[ly] = {'image': f'lines/{pid}-{ly}.webp', 'from': f"part1/ink/{ip['layers'][ly]['image']}", 'bytes': os.path.getsize(path)}
    files['LY-05']['share'] = round(float(figmask.mean()), 3)
    files['LY-06']['share'] = round(float((shadow > 0).mean()), 3)
    comp = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    for ly in ('LY-03', 'LY-05', 'LY-06'): comp.alpha_composite(Image.open(f"{out}/{files[ly]['image']}").convert('RGBA'))
    for ly in ('LY-04', 'LY-07', 'LY-08'): comp.alpha_composite(Image.open(f"{ink}/{ip['layers'][ly]['image']}").convert('RGBA'))
    comp.convert('RGB').save(f'{out}/panels/{pid}.jpg', quality=82)
    open(f'{out}/prompts/{pid}.txt', 'w').write(open(f'{d}/color-prompt.txt').read())
    log = open(f'{d}/color-codex.log', errors='replace').read()
    model = re.search(r'^model: (.+)$', log, re.M); ver = re.search(r'OpenAI Codex v([\d.]+)', log); session = re.search(r'^session id: (.+)$', log, re.M)
    refs = [{'path': f"part1/ink/{ip['layers'][ly]['image']}", 'commit': commit, 'sha256': sha(f"{ink}/{ip['layers'][ly]['image']}")} for ly in ('LY-04', 'LY-07', 'LY-08')]
    refs += [{'path': os.path.relpath(p, GM), 'commit': commit, 'sha256': sha(p)} for p in b['refs']]
    panels[pid] = {
        'layers': files, 'lines': lines_out, 'review': f'panels/{pid}.jpg', 'prompt': f'prompts/{pid}.txt',
        'tool': f"Codex CLI {ver.group(1) if ver else '?'} (codex exec), built-in image generation tool, ChatGPT sign-in",
        'codexModel': model.group(1) if model else None, 'imageModel': 'not exposed by the Codex image tool',
        'codexSession': session.group(1) if session else None, 'rawSha256': sha(f'{d}/color-raw.png'), 'rawSize': [raw.width, raw.height],
        'refs': refs,
    }
    if pid in before and REVISED.get(pid):
        panels[pid]['revision'] = {'finding': REVISED[pid], 'date': '2026-11-14', 'previousRawSha256': before[pid]['rawSha256']}
    if fixed is not None: panels[pid]['regionFix'] = {'what': REGION_FIX[pid]['what'], 'rgb': list(REGION_FIX[pid]['rgb']), 'pixels': fixed, 'finding': 'RV-e01-05'}
    print(pid, files['LY-05']['share'], files['LY-06']['share'], sum(v['bytes'] for v in files.values()) // 1024, 'KB')
json.dump({'schemaVersion': 1, 'episode': 1, 'generatedAt': '2026-11-14', 'panels': panels}, open(f'{out}/ep01-finish.json', 'w'), ensure_ascii=False, indent=1)
print(len(panels), 'panels')
