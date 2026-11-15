#!/usr/bin/env python3
"""Black-and-white finish (fiction-manga 仕上げ) from episode 2 on: grey tones and shadows from the rough, no image generation.

usage: EPISODE=2 finish-mono.py GM_COMMIT [OUT_DIR]
GM_COMMIT: the gulliver-manga commit that holds the rough panels and the line layers used here.
OUT_DIR: defaults to part1/finish.

The accepted rough (part1/rough/panels/<panel>.jpg, a grey pencil drawing at the line art's size) already says where the
picture is dark. It is the tone reference, in place of a Codex colour reference:
1. the rough is warped onto the accepted lines (the same optical flow as the colour finish) and blurred, so pencil
   hatching becomes an even value;
2. each area between the lines takes one flat grey: the region's lit value (80th percentile), quantised to a few tone
   levels (white, 10 %, 20 %, 32 %, 45 % grey), like screen tone;
3. inside a region, the parts clearly darker than the lit value are the shadow: they go to LY-06 as a translucent dark
   grey with one flat strength per patch;
4. a region is a figure's (LY-05) when most of the lines around it are figure lines (LY-07), else background (LY-03).
Writes OUT_DIR/layers/<panel>-LY-03/05/06.webp, lossless copies of the lines (OUT_DIR/lines/), a review composite
(OUT_DIR/panels/<panel>.jpg) and OUT_DIR/epNN-finish.json.
"""
import hashlib, json, os, sys
import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

EP = int(os.environ.get('EPISODE', '2'))
commit = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
P1 = os.path.abspath(os.path.join(HERE, '../..'))
out = sys.argv[2] if len(sys.argv) > 2 else f'{P1}/finish'
ink, rough = f'{P1}/ink', f'{P1}/rough'
E = f'e{EP:02d}'
inkdata = json.load(open(f'{ink}/ep{EP:02d}-ink.json'))
for sub in ('layers', 'lines', 'panels'): os.makedirs(f'{out}/{sub}', exist_ok=True)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
LEVELS = np.array([0.0, 0.10, 0.20, 0.32, 0.45])   # darkness of the flat tones (0 = white paper)
SHADOW_RATIO = 0.88
SHADOW_TONE = (40, 40, 40)
BLUR = 2.5
MIN_REGION = 30
# 通読の直し（RV-e02-03、2026-11-15）：評議の間の奥の壁と卓に、ラフの鉛筆のむらがまだらの影として出た。
# これらのコマでは、背景の領域と広い領域（壁・卓の面）に影を付けず、背景のトーンは強くぼかしたラフ（σ 30）から取って
# 木目やむらで細かく分かれた領域どうしの濃さを揃える。
FLAT_BG = {'e02-p06-k1': 'RV-e02-03', 'e02-p06-k3': 'RV-e02-03', 'e02-p07-k1': 'RV-e02-03'}
FLAT_BG_BLUR = 30
FLAT_SHARE = 0.01   # a region wider than this share of the panel is a wall or a table top (the figures are cut into small regions)


def register(ref, lines):
    L = np.maximum.reduce([lines[k] for k in lines])
    H, W = L.shape
    a = np.clip(255 - L, 0, 255).astype(np.uint8)
    g = ref.astype(np.uint8)
    bg = cv2.GaussianBlur(g, (0, 0), 6)
    lr = np.clip(255 - (bg.astype(np.int16) - g.astype(np.int16)) * 3, 0, 255).astype(np.uint8)
    flow = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM).calc(cv2.GaussianBlur(a, (0, 0), 1.5), cv2.GaussianBlur(lr, (0, 0), 1.5), None)
    flow = cv2.GaussianBlur(flow, (0, 0), 8)
    gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    return cv2.remap(ref.astype(np.float32), gx + flow[..., 0], gy + flow[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def split(Y, lines, flat_bg=False, Yflat=None):
    H, W = Y.shape
    ink_all = np.maximum.reduce([lines[k] for k in lines])
    linemask = ndi.binary_dilation(ink_all > 70, iterations=1)
    labels, n = ndi.label(~linemask)
    idx = np.arange(1, n + 1)
    sizes = ndi.sum(np.ones_like(labels), labels, index=idx)
    fig_near = ndi.binary_dilation(lines['LY-07'] > 70, iterations=3)
    bg_near = ndi.binary_dilation(lines['LY-04'] > 70, iterations=3)
    ring = ~linemask & ndi.binary_dilation(linemask, iterations=2)
    fig_votes = ndi.sum(ring & fig_near, labels, index=idx)
    bg_votes = ndi.sum(ring & bg_near, labels, index=idx)
    is_fig = np.zeros(n + 1, bool); is_fig[1:] = fig_votes > bg_votes * 1.2
    tone = np.zeros(n + 1, np.float32)
    shadow = np.zeros((H, W), np.float32)
    for i, sl in enumerate(ndi.find_objects(labels)):
        lab = i + 1
        if sl is None: continue
        if sizes[i] < MIN_REGION:
            # Tiny regions (wood grain, hatching) stay white paper, except in the flat panels, where they take the
            # blurred tone so a table face does not break into white specks.
            if flat_bg: tone[lab] = LEVELS[np.abs(LEVELS - (1 - np.median(Yflat[sl][labels[sl] == lab]) / 255)).argmin()]
            continue
        m = labels[sl] == lab
        y = Y[sl][m]
        lit = np.percentile(y, 80)
        wide = flat_bg and (not is_fig[lab] or sizes[i] > FLAT_SHARE * H * W)
        if wide: lit = np.median(Yflat[sl][m])
        dark = 1 - lit / 255
        tone[lab] = LEVELS[np.abs(LEVELS - dark).argmin()]
        if sizes[i] < 200 or lit < 40: continue
        if wide: continue
        dk = m & (Y[sl] < lit * SHADOW_RATIO)
        if dk.sum() < 40: continue
        sh = shadow[sl]
        sh[dk] = np.clip((1 - Y[sl][dk] / lit) * 1.1, 0.15, 0.6)
        shadow[sl] = sh
    # Small regions (hatching, buttons) take the tone of their larger neighbour through the line pixels below.
    _, (iy, ix) = ndi.distance_transform_edt(labels == 0, return_indices=True)
    lab_full = labels[iy, ix]
    darkness = tone[lab_full]
    figmask = is_fig[lab_full]
    smask = ndi.binary_opening(shadow > 0, iterations=2)
    sl_lab, sn = ndi.label(smask)
    if sn:
        mean = ndi.mean(shadow, sl_lab, index=np.arange(1, sn + 1))
        keep = ndi.sum(np.ones_like(sl_lab), sl_lab, index=np.arange(1, sn + 1)) >= 150
        shadow = np.where(smask, np.r_[0, mean * keep][sl_lab], 0)
    else:
        shadow = np.zeros_like(shadow)
    return darkness, figmask, shadow


def grey_rgba(darkness, alpha):
    v = np.round(255 * (1 - darkness)).astype(np.uint8)
    return Image.fromarray(np.dstack([v, v, v, (alpha * 255).astype(np.uint8)]), 'RGBA')


panels = {}
for pid, ip in sorted(inkdata['panels'].items()):
    lines = {k: np.array(Image.open(f"{ink}/{v['image']}").getchannel('A'), np.float32) for k, v in ip['layers'].items()}
    H, W = lines['LY-07'].shape
    rpath = f'{rough}/panels/{pid}.jpg'
    ref = np.array(Image.open(rpath).convert('L').resize((W, H), Image.LANCZOS), np.float32)
    Y = cv2.GaussianBlur(register(ref, lines), (0, 0), BLUR)
    # Pencil is light: stretch the panel's values so paper is white and its darkest pencil is near black.
    lo, hi = np.percentile(Y, 1), np.percentile(Y, 99.5)
    Y = np.clip((Y - lo) / max(hi - lo, 1) * 255, 0, 255)
    darkness, figmask, shadow = split(Y, lines, pid in FLAT_BG, cv2.GaussianBlur(Y, (0, 0), FLAT_BG_BLUR) if pid in FLAT_BG else None)
    files = {}
    for ly, img in (('LY-03', grey_rgba(darkness, (~figmask).astype(np.float32))), ('LY-05', grey_rgba(darkness, figmask.astype(np.float32))),
                    ('LY-06', Image.fromarray(np.dstack([np.full((H, W, 3), SHADOW_TONE[0], np.uint8), (shadow * 255).astype(np.uint8)]), 'RGBA'))):
        path = f'{out}/layers/{pid}-{ly}.webp'
        img.save(path, 'WEBP', quality=78, method=6)
        files[ly] = {'image': f'layers/{pid}-{ly}.webp', 'bytes': os.path.getsize(path)}
    lines_out = {}
    for ly in ('LY-04', 'LY-07', 'LY-08'):
        path = f'{out}/lines/{pid}-{ly}.webp'
        Image.open(f"{ink}/{ip['layers'][ly]['image']}").save(path, 'WEBP', lossless=True, method=6)
        lines_out[ly] = {'image': f'lines/{pid}-{ly}.webp', 'from': f"part1/ink/{ip['layers'][ly]['image']}", 'bytes': os.path.getsize(path)}
    files['LY-05']['share'] = round(float(figmask.mean()), 3)
    files['LY-06']['share'] = round(float((shadow > 0).mean()), 3)
    files['LY-03']['share'] = round(float((darkness > 0).mean()), 3)
    comp = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    for ly in ('LY-03', 'LY-05', 'LY-06'): comp.alpha_composite(Image.open(f"{out}/{files[ly]['image']}").convert('RGBA'))
    for ly in ('LY-04', 'LY-07', 'LY-08'):
        a = Image.open(f"{ink}/{ip['layers'][ly]['image']}").getchannel('A')
        comp.alpha_composite(Image.merge('RGBA', [Image.new('L', (W, H), 0)] * 3 + [a]))
    comp.convert('L').save(f'{out}/panels/{pid}.jpg', quality=82)
    refs = [{'path': f"part1/ink/{ip['layers'][ly]['image']}", 'commit': commit, 'sha256': sha(f"{ink}/{ip['layers'][ly]['image']}")} for ly in ('LY-04', 'LY-07', 'LY-08')]
    refs.append({'path': f'part1/rough/panels/{pid}.jpg', 'commit': commit, 'sha256': sha(rpath)})
    panels[pid] = {
        'layers': files, 'lines': lines_out, 'review': f'panels/{pid}.jpg', 'prompt': None,
        'tool': 'no image generation: grey tones from the accepted rough (part1/finish/src/finish-mono.py)',
        'codexModel': None, 'imageModel': 'none', 'codexSession': None, 'rawSha256': sha(rpath), 'rawSize': [W, H],
        'refs': refs,
    }
    if pid in FLAT_BG: panels[pid]['revision'] = {'finding': FLAT_BG[pid], 'date': '2026-11-15', 'what': '背景に影を付けず、背景のトーンを強くぼかしたラフから取った'}
    print(pid, files['LY-05']['share'], files['LY-03']['share'], files['LY-06']['share'], sum(v['bytes'] for v in files.values()) // 1024, 'KB')
json.dump({'schemaVersion': 1, 'episode': EP, 'generatedAt': '2026-11-15', 'panels': panels}, open(f'{out}/ep{EP:02d}-finish.json', 'w'), ensure_ascii=False, indent=1)
print(len(panels), 'panels')
