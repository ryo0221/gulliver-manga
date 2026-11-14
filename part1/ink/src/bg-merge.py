#!/usr/bin/env python3
"""Puts the background drawn by gen-bg.sh into the ep1 line art (LY-04), keeping the figure and effect lines.

usage: bg-merge.py BRIEFS_ROOT INK_DIR GM_COMMIT
BRIEFS_ROOT: bg-briefs.py + gen-bg.sh output (bg-raw.png, bg-prompt.txt, bg-codex.log per panel).
INK_DIR: part1/ink (its layers and ep01-ink.json are updated in place for the panels of bg-briefs.BG_NOTES).
GM_COMMIT: the gulliver-manga commit that holds the line art passed to Codex.

Codex redraws the whole panel a little: its picture is moved onto the accepted lines by one affine transform fitted
on the figure lines (ECC). Only its blue lines are taken, and none on the accepted figure lines, so the figure lines (LY-07) and effect lines (LY-08) stay exactly as accepted; LY-04 is
replaced by the new background lines, or (ADD_ONLY) kept with the new lines added only where it was empty.
"""
import hashlib, importlib.util, json, os, re, sys
import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

root, ink, commit = sys.argv[1:4]
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('bgb', f'{HERE}/bg-briefs.py'); bgb = importlib.util.module_from_spec(spec)
sys.argv = [sys.argv[0], root, ink]; spec.loader.exec_module(bgb)
briefs = json.load(open(f'{root}/briefs.json'))
data = json.load(open(f'{ink}/ep01-ink.json'))
# Panels whose accepted background lines stay (the new drawing only adds the sky); the others take the new background
# whole (2-2: the meadow-like ground hatching becomes the stable's straw, wall and roof).
ADD_ONLY = {'e01-p06-k1', 'e01-p11-k5'}
EMPTY = 12
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()


def alpha(path, size=None):
    a = Image.open(path).getchannel('A')
    return np.asarray(a.resize(size, Image.LANCZOS) if size and a.size != size else a, np.float32)


for pid in bgb.BG_NOTES:
    d = f'{root}/{pid}'
    if not os.path.exists(f'{d}/bg-raw.png'): print(pid, 'no bg-raw.png'); continue
    b = briefs[pid]
    cw, ch = b['frame']['canvas']; ox, oy, pw, ph = b['frame']['panel']
    old = {ly: alpha(f'{ink}/layers/{pid}-{ly}.png') for ly in ('LY-04', 'LY-07', 'LY-08')}
    H, W = old['LY-07'].shape
    raw = Image.open(f'{d}/bg-raw.png').convert('RGB')
    sx, sy = raw.width / cw, raw.height / ch
    cut = np.asarray(raw.crop((round(ox * sx), round(oy * sy), round((ox + pw) * sx), round((oy + ph) * sy))).resize((W, H), Image.LANCZOS), np.float32)
    # Register on the figure lines (they are meant to be unchanged): flow from the accepted figure lines to the raw's black lines.
    r, g, bl = cut[..., 0], cut[..., 1], cut[..., 2]
    blackness = 255 - np.maximum.reduce([r, g, bl])
    a = np.clip(255 - old['LY-07'], 0, 255).astype(np.uint8)
    bimg = np.clip(255 - blackness, 0, 255).astype(np.uint8)
    # One affine transform for the whole panel (a dense flow smears the open sky and sea, where there are no figure
    # lines to hold it), fitted on the figure lines by ECC.
    A = cv2.GaussianBlur(a, (0, 0), 3).astype(np.float32) / 255
    B = cv2.GaussianBlur(bimg, (0, 0), 3).astype(np.float32) / 255
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        _, warp = cv2.findTransformECC(A, B, warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-5), None, 5)
    except cv2.error:
        warp = np.eye(2, 3, dtype=np.float32)
    warped = cv2.warpAffine(cut, warp, (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    shift = float(np.abs(warp - np.eye(2, 3)).max() * max(W, H))
    r, g, bl = warped[..., 0], warped[..., 1], warped[..., 2]
    ink_amt = 255 - np.minimum.reduce([r, g, bl])
    blue = (bl - np.maximum(r, g) > 40) & (ink_amt >= 24)
    new_bg = np.where(blue, ink_amt, 0)
    # Keep the background lines off the accepted figure lines (Codex redraws them in black; a blue stroke right on a
    # figure line is a misregistered copy). Blue inside a figure's outline stays: water over a swimmer, a ladder on a body.
    fig = ndi.binary_dilation(old['LY-07'] > 40, iterations=3)
    new_bg[fig] = 0
    if pid in ADD_ONLY:
        # Keep the accepted background lines; take only the new strokes that lie mostly in the white the line art left
        # (farther than EMPTY px from any accepted line), so the sea or the ladder is not drawn twice.
        ink_old = np.maximum.reduce([old[k] for k in old]) > 40
        empty = ndi.distance_transform_edt(~ink_old) > EMPTY
        lab, n = ndi.label(new_bg >= 40, structure=np.ones((3, 3)))
        if n:
            share = ndi.mean(empty, lab, index=np.arange(1, n + 1))
            new_bg[np.r_[False, share < 0.5][lab]] = 0
        new_bg = np.maximum(new_bg, old['LY-04'])
    q = np.select([new_bg < 40, new_bg < 110, new_bg < 180], [0, 85, 170], 255).astype(np.uint8)
    im = Image.new('LA', (W, H), 0); im.putalpha(Image.fromarray(q))
    path = f'{ink}/layers/{pid}-LY-04.png'
    im.save(path, optimize=True)
    # Review composite and the panel record.
    counts = {'LY-04': int((q > 0).sum()), 'LY-07': int((old['LY-07'] > 0).sum()), 'LY-08': int((old['LY-08'] > 0).sum())}
    total = sum(counts.values()) or 1
    p = data['panels'][pid]
    for ly in ('LY-04', 'LY-07', 'LY-08'):
        p['layers'][ly]['share'] = round(counts[ly] / total, 3)
    p['layers']['LY-04']['bytes'] = os.path.getsize(path)
    comp = Image.new('RGB', (W, H), (255, 255, 255))
    tint = {'LY-04': (40, 80, 220), 'LY-07': (0, 0, 0), 'LY-08': (220, 30, 30)}
    for ly, t in tint.items():
        comp.paste(Image.new('RGB', (W, H), t), (0, 0), Image.open(f'{ink}/layers/{pid}-{ly}.png').getchannel('A'))
    comp.save(f'{ink}/panels/{pid}.jpg', quality=80)
    open(f'{ink}/prompts/{pid}-background.txt', 'w').write(open(f'{d}/bg-prompt.txt').read())
    log = open(f'{d}/bg-codex.log', errors='replace').read()
    session = re.search(r'^session id: (.+)$', log, re.M)
    model = re.search(r'^model: (.+)$', log, re.M)
    p['background'] = {
        'why': "author's finish review 2026-11-14: 「背景を描いて」 (the panel's background was left white)",
        'prompt': f'prompts/{pid}-background.txt',
        'codexModel': model.group(1) if model else None,
        'codexSession': session.group(1) if session else None,
        'rawSha256': sha(f'{d}/bg-raw.png'),
        'rawSize': [raw.width, raw.height],
        'input': {'path': f'part1/ink/layers/{pid}-LY-04/07/08.png (before this change)', 'commit': commit},
        'kept': 'LY-04 を残し、白かったところにだけ新しい背景の線を足した' if pid in ADD_ONLY else 'LY-04 を新しい背景の線に置き換えた',
    }
    print(pid, p['layers']['LY-04']['share'], p['layers']['LY-04']['bytes'] // 1024, 'KB', 'affine change px', round(shift, 1))
json.dump(data, open(f'{ink}/ep01-ink.json', 'w'), ensure_ascii=False, indent=1)
