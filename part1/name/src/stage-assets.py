#!/usr/bin/env python3
"""ネーム 第1話の舞台: turns the 3D staging run (gulliver-ep01-stage.demo.ts → STAGE_OUT) into the
ネーム's inputs: each panel's camera view cropped to its frame (stage/underlay/*.jpg), a top-view
plan per panel (stage/plans/*.svg) and one record per panel (stage/ep01-stage.json).

usage: stage-assets.py STAGE_OUT NAME_DESIGN_ARTIFACT OUT_DIR
"""
import glob, json, math, os, shutil, sys
from PIL import Image

stage_dir, design_path, out = sys.argv[1:4]
VFOV = 35.0  # the character view's PerspectiveCamera (fixed vertical field of view)
WHO = {'CH-01': 'ガリヴァー', 'CH-10': 'メアリー', 'CH-02': '皇帝', 'CH-30': '小人', 'EX': '端役', 'horse': '馬'}
SETS = ['stable', 'port', 'sea', 'beach', 'temple']

design = json.load(open(design_path))['draft']['content']
panels = {e['id']: e for e in design['elements'] if e.get('panelGeometry')}
os.makedirs(f'{out}/underlay', exist_ok=True)
os.makedirs(f'{out}/plans', exist_ok=True)

# The F106 temple (BIM, gulliver-lilliput.ts): 40 × 30 ft, north wall on y = 0, gate in its
# middle, the highway 6–11 ft north and the 4 ft turret 20 ft north of the gate.
FT = 304.8
TEMPLE_PLAN = [
    ('神殿（F106）', (-6096, -9144, 6096, 0), '#d8cdb8'),
    ('大通り', (-12192, 6 * FT, 12192, 11 * FT), '#e5dccb'),
    ('塔', (-2 * FT, 20 * FT, 2 * FT, 24 * FT), '#b9a88a'),
]


def tan(d):
    return math.tan(math.radians(d))


def crop_fov(cw, ch, aspect):
    """Centre crop of a cw × ch view to `aspect` (w/h): the crop box and its fields of view."""
    if aspect >= cw / ch:
        w, h = cw, cw / aspect
    else:
        w, h = ch * aspect, ch
    v = 2 * math.degrees(math.atan(tan(VFOV / 2) * h / ch))
    hz = 2 * math.degrees(math.atan(tan(VFOV / 2) * w / ch))
    return ((cw - w) / 2, (ch - h) / 2, (cw + w) / 2, (ch + h) / 2), round(hz, 1), round(v, 1)


def plan_svg(set_rec, shot, hfov, crowd_pts):
    cam, look = shot['cam'], shot['look']
    pts = [cam[:2], look[:2]] + [p['at'][:2] for p in shot['places']]
    dist = math.dist(cam[:2], look[:2]) or 1
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    span = max(max(xs) - min(xs), max(ys) - min(ys), 400) * 1.35
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    x0, y0 = cx - span / 2, cy - span / 2
    S = 360
    k = S / span
    X = lambda x: (x - x0) * k
    Y = lambda y: S - (y - y0) * k  # north (+y) up
    el = []
    boxes = [(b['name'], (b['at'][0], b['at'][1], b['at'][0] + b['size'][0], b['at'][1] + b['size'][1]), '#cfc6b0')
             for b in set_rec['cad'] if not b.get('cylinder') and b['size'][0] * b['size'][1] < 4e9]
    if set_rec.get('bim') == 'temple':
        boxes = TEMPLE_PLAN + boxes
    polys = []
    for v in set_rec.get('vessels') or []:
        place = (shot.get('vessels') or {}).get(v['id']) or ({'at': v['home']} if v.get('home') else None)
        if not place:
            continue
        qx, qy, qz, qw = place.get('rot') or [0, 0, 0, 1]
        yaw = math.atan2(2 * (qw * qz + qx * qy), 1 - 2 * (qy * qy + qz * qz))
        c, sn = math.cos(yaw), math.sin(yaw)
        for b in v['boxes']:
            if b.get('cylinder'):
                continue
            ax, ay = b['at'][0], b['at'][1]
            bx, by = ax + b['size'][0], ay + b['size'][1]
            pts = [(place['at'][0] + c * x - sn * y, place['at'][1] + sn * x + c * y) for x, y in ((ax, ay), (bx, ay), (bx, by), (ax, by))]
            polys.append((f"{v['name']} {b['name']}", pts))
    for name, (ax, ay, bx, by), color in boxes:
        x, y, w, h = X(ax), Y(by), (bx - ax) * k, (by - ay) * k
        if x > S or y > S or x + w < 0 or y + h < 0:
            continue
        el.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{color}" fill-opacity="0.55" stroke="#8a7f6a" stroke-width="0.6"><title>{name}</title></rect>')
    for name, pts in polys:
        d = ' '.join(f'{X(x):.1f},{Y(y):.1f}' for x, y in pts)
        el.append(f'<polygon points="{d}" fill="#8b6b45" fill-opacity="0.45" stroke="#5b3b24" stroke-width="0.6"><title>{name}</title></polygon>')
    for p in crowd_pts:
        if x0 <= p[0] <= x0 + span and y0 <= p[1] <= y0 + span:
            el.append(f'<circle cx="{X(p[0]):.1f}" cy="{Y(p[1]):.1f}" r="1.2" fill="#9ca3af"/>')
    # The camera's horizontal field of view, to the look point and a little past it.
    a = math.atan2(look[1] - cam[1], look[0] - cam[0])
    r = dist * 1.25
    h2 = math.radians(hfov / 2)
    l = (cam[0] + r * math.cos(a + h2), cam[1] + r * math.sin(a + h2))
    rr = (cam[0] + r * math.cos(a - h2), cam[1] + r * math.sin(a - h2))
    el.append(f'<path d="M{X(cam[0]):.1f},{Y(cam[1]):.1f} L{X(l[0]):.1f},{Y(l[1]):.1f} L{X(rr[0]):.1f},{Y(rr[1]):.1f} Z" fill="#2563eb" fill-opacity="0.12" stroke="#2563eb" stroke-width="0.8"/>')
    el.append(f'<line x1="{X(cam[0]):.1f}" y1="{Y(cam[1]):.1f}" x2="{X(look[0]):.1f}" y2="{Y(look[1]):.1f}" stroke="#2563eb" stroke-dasharray="3 2" stroke-width="0.8"/>')
    el.append(f'<circle cx="{X(look[0]):.1f}" cy="{Y(look[1]):.1f}" r="2.5" fill="none" stroke="#2563eb"/>')
    el.append(f'<rect x="{X(cam[0]) - 4:.1f}" y="{Y(cam[1]) - 4:.1f}" width="8" height="8" fill="#2563eb"/>')
    for i, p in enumerate(shot['places']):
        x, y = X(p['at'][0]), Y(p['at'][1])
        f = math.radians(p['facingDeg']) + math.pi / 2  # a figure faces +y at facing 0
        lying = p['pose'].startswith('lie')
        col = '#b91c1c' if p['fig'] == 'gulliver' else '#111827'
        if lying and p['fig'] == 'gulliver':
            # Lying on the back: head 700 mm toward −y of the body, feet 800 mm toward +y.
            hx, hy = p['at'][0] - 700 * math.cos(f), p['at'][1] - 700 * math.sin(f)
            fx, fy = p['at'][0] + 850 * math.cos(f), p['at'][1] + 850 * math.sin(f)
            el.append(f'<line x1="{X(hx):.1f}" y1="{Y(hy):.1f}" x2="{X(fx):.1f}" y2="{Y(fy):.1f}" stroke="{col}" stroke-width="{max(2, 420 * k):.1f}" stroke-opacity="0.35" stroke-linecap="round"/>')
            el.append(f'<circle cx="{X(hx):.1f}" cy="{Y(hy):.1f}" r="{max(2.5, 110 * k):.1f}" fill="{col}"/>')
        else:
            el.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3" fill="{col}"/>')
            el.append(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x + 9 * math.cos(f):.1f}" y2="{y - 9 * math.sin(f):.1f}" stroke="{col}" stroke-width="1.4"/>')
        el.append(f'<text x="{x + 5:.1f}" y="{y - 5:.1f}" font-size="9" fill="{col}">{p["fg"][-2:]}</text>')
    # A scale bar.
    bar = 10 ** math.floor(math.log10(span / 3))
    el.append(f'<line x1="10" y1="{S - 10}" x2="{10 + bar * k:.1f}" y2="{S - 10}" stroke="#111" stroke-width="2"/>')
    label = f'{bar / 1000:g} m' if bar >= 1000 else f'{bar:g} mm'
    el.append(f'<text x="10" y="{S - 14}" font-size="9" fill="#111">{label}</text>')
    el.append(f'<text x="8" y="16" font-size="10" fill="#111">{shot["panel"]}　カメラ高さ {round(cam[2])} mm</text>')
    el.append(f'<text x="{S - 10}" y="16" font-size="10" text-anchor="end" fill="#111">↑北（+y）</text>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}" font-family="IPAGothic, sans-serif">'
            f'<rect width="{S}" height="{S}" fill="#fbfaf7"/>' + ''.join(el) + '</svg>')


records = {}
sets = {}
for sid in SETS:
    st = json.load(open(f'{stage_dir}/{sid}/stage.json'))
    s = st['set']
    sets[sid] = {
        'name': s['name'], 'scenes': s['scenes'], 'reason': s['reason'],
        'props': [{'name': p['name'], **p['source']} for p in st['props']],
        'canvas': st['canvas'],
        'cad': [{k: b[k] for k in ('id', 'name', 'at', 'size', 'cylinder') if b.get(k) is not None} for b in s['cad']],
        'bim': s['bim'],
        'vessels': [{'id': v['id'], 'name': v['name'], 'home': v['home']} for v in s.get('vessels') or []],
        'crowds': [{k: c[k] for k in ('id', 'name', 'count')} for c in st['crowds']],
    }
    # The model versions the stage was built on (CAD/BIM, vessels, the character) and the raw record.
    os.makedirs(f'{out}/models/{sid}', exist_ok=True)
    for f in glob.glob(f'{stage_dir}/{sid}/*.json'):
        shutil.copy(f, f'{out}/models/{sid}/')
    actors = {a['id']: a for a in st['actors']}
    crowd_pts = {c['id']: c['points'] for c in st['crowds']}
    cw, chh = st['canvas']['width'], st['canvas']['height']
    for shot in st['shots']:
        pid = shot['panel']
        panel = panels[pid]
        b = panel['bounds']
        aspect = b['width'] / b['height']
        box, hfov, vfov = crop_fov(cw, chh, aspect)
        places = []
        for i, p in enumerate(shot['places']):
            a = actors[p['fig']]
            places.append({'fg': f'FG-{pid}-{i + 1:02d}', 'ch': a['who'], 'name': a['name'], 'fig': p['fig'],
                           'at': p['at'], 'facingDeg': round(math.degrees(p['facing']), 1), 'pose': p['pose'],
                           'heightMm': a['heightMm']})
        shot = {**shot, 'places': places}
        rec = {'panel': pid, 'set': sid, 'cam': shot['cam'], 'look': shot['look'], 'stand': shot.get('stand'),
               'hfovDeg': hfov, 'vfovDeg': vfov, 'figures': places, 'crowds': shot.get('crowds') or [],
               'noModel': shot.get('noModel'), 'vessels': shot.get('vessels') or {}}
        png = f'{stage_dir}/{sid}/{pid}.png'
        if not shot.get('noModel'):
            im = Image.open(png).convert('RGB')
            sx, sy = im.width / cw, im.height / chh
            im = im.crop(tuple(round(v * (sx if i % 2 == 0 else sy)) for i, v in enumerate(box)))
            scale = min(1.0, 2 * b['width'] / im.width)
            im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
            im.save(f'{out}/underlay/{pid}.jpg', quality=70, optimize=True)
            rec['underlay'] = f'underlay/{pid}.jpg'
        pts = [pt for c in rec['crowds'] for pt in crowd_pts.get(c, [])]
        open(f'{out}/plans/{pid}.svg', 'w').write(plan_svg({'cad': s['cad'], 'bim': s['bim'], 'vessels': s.get('vessels')}, shot, hfov, pts))
        rec['plan'] = f'plans/{pid}.svg'
        records[pid] = rec

json.dump({'schemaVersion': 1, 'episode': 1, 'verticalFovDeg': VFOV, 'sets': sets,
           'panels': [records[k] for k in sorted(records)]},
          open(f'{out}/ep01-stage.json', 'w'), ensure_ascii=False, indent=1)
print(len(records), 'panels')
