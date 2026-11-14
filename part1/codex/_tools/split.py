# usage: split.py raw.png underlay.png kind(figure|place) out_dir item
import sys, cv2, numpy as np
raw_p, ul_p, kind, out, item = sys.argv[1:]
raw = cv2.imread(raw_p); ul = cv2.imread(ul_p)
H, W = ul.shape[:2]
def bbox(m):
    ys, xs = np.nonzero(m); return xs.min(), ys.min(), xs.max(), ys.max()
if kind == 'figure':
    # underlay figure box: pixels far from background, thin lines removed
    bgc = np.median(ul[:20, :20].reshape(-1, 3), axis=0)
    d = np.abs(ul.astype(int) - bgc).sum(2) > 60
    d = cv2.morphologyEx(d.astype(np.uint8), cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(d)
    keep = np.zeros_like(d)
    for i in range(1, n):
        if st[i, 4] > 2000: keep[lab == i] = 1
    ux0, uy0, ux1, uy1 = bbox(keep)
    # raw figure box: not near-white
    nw = (raw.min(2) < 230).astype(np.uint8)
    nw = cv2.morphologyEx(nw, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    rx0, ry0, rx1, ry1 = bbox(nw)
    s = (uy1 - uy0) / (ry1 - ry0)
    cx_u, cx_r = (ux0 + ux1) / 2, (rx0 + rx1) / 2
    M = np.float32([[s, 0, cx_u - s * cx_r], [0, s, uy0 - s * ry0]])
    img = cv2.warpAffine(raw, M, (W, H), flags=cv2.INTER_AREA, borderValue=(255, 255, 255))
    # alpha: flood near-white from border
    white = (img.min(2) >= 232).astype(np.uint8)
    n, lab = cv2.connectedComponents(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    bgm = np.isin(lab, [b for b in border if b != 0] if 0 not in border or True else []) & (white == 1)
    alpha = np.where(bgm, 0, 255).astype(np.uint8)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
    layers = {'LY-05': 'fill', 'LY-07': 'line'}
else:
    # places: cover-fit to the underlay frame
    s = max(W / raw.shape[1], H / raw.shape[0])
    img = cv2.resize(raw, (round(raw.shape[1] * s), round(raw.shape[0] * s)), interpolation=cv2.INTER_AREA)
    y0 = (img.shape[0] - H) // 2; x0 = (img.shape[1] - W) // 2
    img = img[y0:y0 + H, x0:x0 + W]
    alpha = np.full((H, W), 255, np.uint8)
    layers = {'LY-03': 'fill', 'LY-04': 'line'}
L = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
clo = cv2.morphologyEx(L, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
strength = np.clip((clo - L - 25) / 60, 0, 1) * (L < 150)
line_a = (strength * 255).astype(np.uint8)
line_a = np.minimum(line_a, alpha)
lineimg = np.dstack([np.full((H, W, 3), 20, np.uint8), line_a])
lm = (strength > 0.05).astype(np.uint8)
lm = cv2.dilate(lm, np.ones((3, 3), np.uint8))
fill = cv2.inpaint(img, lm, 3, cv2.INPAINT_TELEA)
fillimg = np.dstack([fill, alpha])
for ly, k in layers.items():
    cv2.imwrite(f'{out}/{item}-{ly}.png', fillimg if k == 'fill' else lineimg)
cv2.imwrite(f'{out}/{item}-composite.png', img)
print('ok', W, H)
