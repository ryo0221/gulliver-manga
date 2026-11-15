#!/usr/bin/env python3
"""Takes re-shot panels from a stage re-run into the episode's stage record (通読の直し).

usage: stage-revise.py NEW_STAGE_DIR STAGE_DIR EPISODE FINDING DATE PANEL:WHY ...
NEW_STAGE_DIR: stage-assets.py output of the re-run (its own epNN-stage.json, underlay/, plans/, models/<set>/).
STAGE_DIR: part1/name/stage. Only the listed panels change: their underlay and plan are replaced, their record takes the
new camera and figures, and `revised` keeps the finding, the reason, the camera before and the re-run's model versions
(copied to models/<set>-<finding>/).
"""
import json, os, shutil, sys

new_dir, stage_dir, ep, finding, date = sys.argv[1:6]
whys = dict(a.split(':', 1) for a in sys.argv[6:])
name = f'ep{int(ep):02d}-stage.json'
new = {p['panel']: p for p in json.load(open(f'{new_dir}/{name}'))['panels']}
newsets = json.load(open(f'{new_dir}/{name}'))['sets']
rec = json.load(open(f'{stage_dir}/{name}'))
for i, p in enumerate(rec['panels']):
    pid = p['panel']
    if pid not in whys: continue
    n = new[pid]
    models = f"models/{n['set']}-{finding.lower()}/"
    if not os.path.exists(f'{stage_dir}/{models}'): shutil.copytree(f"{new_dir}/models/{n['set']}", f'{stage_dir}/{models}')
    for k in ('underlay', 'plan'):
        shutil.copy(f"{new_dir}/{n[k]}", f"{stage_dir}/{n[k]}")
    rec['panels'][i] = {**n, 'revised': {'finding': finding, 'date': date, 'why': whys[pid], 'before': {'cam': p['cam'], 'look': p['look']},
                                         'models': models, 'props': newsets[n['set']]['props']}}
    print(pid, p['cam'], '->', n['cam'])
json.dump(rec, open(f'{stage_dir}/{name}', 'w'), ensure_ascii=False, indent=1)
