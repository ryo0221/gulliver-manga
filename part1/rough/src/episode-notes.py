# Per-episode notes for rough-briefs.py (exec'd; defines notes(pid, v, p) -> list of lines).
# 第1話の学び：LN-e01-02（絵の中の物どうしで大きさを比べて書く）、LN-e01-03（寄りのコマにも背景を描く）、
# LN-e01-04（シーンをまたいで続く状態を表にして、そのシーンのコマの指示に入れる）。第1話のコマには何も足さない。

# 続く状態（第2話）。本文：鎖は左足首だけ（第1話 15-2 の直し）、条文に誓って外れる（10-1）。都では上着を脱ぎ、
# 短い胴着だけで歩く（"in my short waistcoat, for fear of damaging the roofs and eaves of the houses with the skirts of my coat"）。
CONTINUITY_E02 = [
    # (first panel, last panel, text) — panel ids compare by page then order
    ((1, 1), (9, 3), "Continuity: Gulliver is still chained by the LEFT ankle only (one chain from his left ankle back to the old temple's door); his right leg is free. He wears his plain coat with buttons."),
    ((10, 1), (10, 1), "Continuity: the chain is on his LEFT ankle; this panel shows its lock being opened."),
    ((10, 2), (10, 3), "Continuity: the chain is now off: it lies loose on the ground; Gulliver's ankles are free. He wears his plain coat."),
    ((11, 1), (16, 2), "Continuity: in the city Gulliver has taken his long coat OFF so that its skirts will not damage the roofs: he wears only a short sleeveless waistcoat over his shirt, breeches, stockings and shoes. No chain."),
]

SIZE_E02 = {
    'court': "Size check inside the picture (AR-01): a whole Lilliputian is about as tall as Gulliver's hand is long; a Lilliputian's head is smaller than Gulliver's eye. The dancing thread is 12 inches up: it reaches only Gulliver's shin. Never draw the Lilliputians bigger than this.",
    'city': "Size check inside the picture (AR-01): the city wall (2.5 feet high) and the three-storey house roofs come up to about the middle of Gulliver's thigh; the main street (5 feet wide) is narrower than his stride; a Lilliputian is about as tall as his shoe is long. Never draw the city bigger than this.",
    'council': "Everything here is Lilliputian: the people, the long table and the throne are in normal proportion to each other (no giant in this room).",
}

PANEL_E02 = {
    'e02-p01-k1': "This is the episode's cover (扉): Gulliver's face (looking down kindly, amused) and the tiny performers on his open palm must BOTH be clearly seen. Each performer, standing on his palm, is about as tall as his hand is long. Keep his whole head inside the frame (the 3D head sits at the top edge: tilt the view a touch up rather than cut his face).",
    'e02-p02-k4': "Seen from Gulliver's eyes: the thread and the courtiers look as small as his finger.",
    'e02-p04-k1': "Gulliver's fingertip catches the falling man: the whole man is about as long as the finger.",
    'e02-p04-k3': "The dizzy man lies on Gulliver's fingertip: the whole man is about as long as the finger.",
    'e02-p12-k2': "The storyboard memo says he holds his coat skirts: he has taken the coat off (see Continuity), so draw him holding the short waistcoat close and stepping sideways with great care.",
    'e02-p14-k2': "The two stools are 5 feet high: they come up to about Gulliver's chest; he stands on them to step over the inner buildings.",
    'e02-p15-k1': "The 3D render shows the window glass as opaque: draw Gulliver's huge EYE (with the brow and part of the cheek) filling the small window from outside, looking in. The window is 4 by 6 inches, about as big as his eye with the brow. The princes inside are each smaller than that eye.",
    'e02-p15-k2': "Behind the Empress, the window is filled with Gulliver's huge eye and brow looking in (the 3D glass is opaque; draw the eye).",
    'e02-p15-k3': "Seen from the back of the room: through the small window, Gulliver's huge eye (with the brow) smiles softly; the rest of his face is outside, beyond the window frame. The window is about as big as his eye with the brow.",
    # 通読の直し（RV-e02-09）：前の覚え書き「窓に唇・鼻・顎だけ」が、窓に鼻だけの気味の悪い絵になった。外から横顔の全体を（rough-briefs の REVISED_NOTE）。
    'e02-p16-k1': "Gulliver is OUTSIDE the building, lying in the court; he never comes into the room. The Empress holds her hand out to him from the small window. Her whole hand is about the size of his fingernail; he brings his lips very gently to it.",
    'e02-p16-k2': "Sunset light. The inner court is narrow for him: he lies face down between the buildings, his head at the palace window.",
}

def _key(v): return (int(v['nm.page']), int(v['nm.order']))

def notes(pid, v, p):
    if not pid.startswith('e02-'): return []
    out = []
    k = _key(v)
    for a, b, t in CONTINUITY_E02:
        if a <= k <= b: out.append(t)
    gul = any(g['ch'] == 'CH-01' for g in p['figures'])
    if p['set'] in SIZE_E02 and (gul or p['set'] == 'council'): out.append(SIZE_E02[p['set']])
    if pid in PANEL_E02: out.append(PANEL_E02[pid])
    out.append("Never cut a face with the frame edge: every face that is in the frame is drawn whole.")
    out.append("Always draw a background (ground, sky, walls or the room) even in a close-up; never leave the space behind the figures blank.")
    return out
