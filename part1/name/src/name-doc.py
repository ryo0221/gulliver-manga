#!/usr/bin/env python3
"""Writes docs/part1-ep01-name.md (the ネーム's text version) from the panel table and the stage.

usage: name-doc.py PANELS_ARTIFACT_JSON STAGE_JSON OUT_MD
"""
import json, sys

panels_path, stage_path, out = sys.argv[1:4]
rows = json.load(open(panels_path))['draft']['content']['rows']
stage = json.load(open(stage_path))

POSES = {
    'stand': '立つ', 'walk': '歩く', 'wave-hat': '帽子を振る', 'hands-together': '手を前で組む', 'turn-away': '顔を背ける',
    'carry-bag': '荷を担ぐ', 'lie': '仰向け', 'lie-look': '仰向けで目だけ下へ', 'lie-arm-free': '仰向けで左腕を上げる',
    'lie-eat': '仰向けで左手を口へ', 'lie-drink': '仰向けで樽を傾ける', 'lie-hand-hover': '仰向けで左手を胸の上にかざす',
    'swim': '泳ぐ', 'tread': '立ち泳ぎ', 'sit': '座る', 'archer': '弓を引く', 'sword-up': '剣を振り上げる', 'point': '指さす',
    'orate': '演説する', 'fall': '転げ落ちる', 'dance': '踊る', 'carry-up': '籠を持ち上げる', 'crouch': 'かがむ',
}


def num(n):
    return f'{n:,}'


L = []
w = L.append
w('# 第1話「人の山」ネーム（16ページ、AI の提案）')
w('')
w('正本は `part1/name/artifacts/` の Design 原稿 `gm1-ep01-name` とコマ表 `gm1-ep01-name-panels` です。この文書はコマ表を書き出した文章版です。ページの絵は `part1/name/pages/` にあります。')
w('')
w('fiction-manga@1.2.0 の「舞台で組む」（storyboard.staged）に合わせ、コマごとに 3D の舞台（デジタルツイン）で人物の位置・向き・ポーズとカメラの位置・注視点を決めました。カメラの絵をコマの枠に切り抜いてコマの下に敷き（アタリ）、真上からの配置図を `part1/name/stage/plans/` に置いています。座標は舞台のモデルの版の座標（mm、z が上、北が +y）です。舞台の記録は `part1/name/stage/ep01-stage.json` です。')
w('')
w('書式：コマごとに「大きさ｜カメラの目 高さ（地面からの実寸）」、カメラの立つ台、カメラの向き、絵のメモ、文字にする行（ナレーション・台詞・擬音）、3D の舞台（カメラ、注視点、画角、人物、群衆、アタリと配置図）。★は大きさの違いを見せるコマ（AR-05、小人の目の高さから撮る）。')
w('')
w('## 3D の舞台')
w('')
w('| 舞台 | シーン | モデルの版 | 群衆 | 仮の3Dにした理由 |')
w('| --- | --- | --- | --- | --- |')
for sid, s in stage['sets'].items():
    models = '<br>'.join(f'{p["name"]}（{p["kind"]} `{p["artifactId"]}` @ `{p["versionId"]}`）' for p in s['props'])
    crowds = '、'.join(f'{c["name"]}（{num(c["count"])}）' for c in s['crowds']) or '—'
    w(f'| {sid}：{s["name"]} | {"・".join(s["scenes"])} | {models} | {crowds} | {s["reason"] or "—（F106 の BIM をそのまま使う）"} |')
w('')
w(f'カメラの画角は、Editor Platform のキャラクター編集のカメラ（縦 {stage["verticalFovDeg"]:g}°）の絵を、コマの枠の縦横比で真ん中から切り抜いたものです。モデルの版の ID は、舞台を組んだときに Playground で保存した版で、`part1/name/stage/models/` に版の JSON があります。')

st = {p['panel']: p for p in stage['panels']}
page = None
for r in rows:
    v = r['values']
    if v['nm.page'] != page:
        page = v['nm.page']
        w('')
        w(f'## {page}ページ（{v["nm.scene"]}）')
        w('')
        if v['nm.turn']:
            w(f'ページの頭：{v["nm.turn"]}')
            w('')
    star = '★' if v['nm.size'] else ''
    w(f'{v["nm.order"]}. {star}{v["nm.shot"]}｜{v["nm.eye"]} {num(v["nm.mm"])} mm（{v["nm.look"]}）')
    if v['nm.stand']:
        w(f'   - 台：{v["nm.stand"]}')
    w(f'   - 絵：{v["nm.art"]}')
    if v['nm.text']:
        w(f'   - 文字：{v["nm.text"]}')
    w(f'   - 脚本の行：{v["nm.lines"]}')
    p = st[r['id']]
    w(f'   - 3D：{v["st.set"]}。カメラ {v["st.cam"]} → 注視点 {v["st.look"]}、画角 {v["st.fov"]}')
    for f in p['figures']:
        at = ', '.join(str(round(x)) for x in f['at'])
        w(f'     - {f["fg"]} {f["ch"]} {f["name"]}：({at})、向き {f["facingDeg"]:g}°、{POSES.get(f["pose"], f["pose"])}')
    if v['st.crowds']:
        w(f'     - 群衆：{v["st.crowds"]}')
    if p.get('underlay'):
        w(f'   - アタリ：[`{p["underlay"]}`](../part1/name/stage/{p["underlay"]})、配置図：[`{p["plan"]}`](../part1/name/stage/{p["plan"]})')
    else:
        w(f'   - アタリ：無し（{p["noModel"]}）、配置図：[`{p["plan"]}`](../part1/name/stage/{p["plan"]})')
open(out, 'w').write('\n'.join(L) + '\n')
print(len(rows), 'panels')
