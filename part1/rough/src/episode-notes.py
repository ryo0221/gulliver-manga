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

# 第3話。第2話の学び LN-e02-01〜06 は作者が全部採った（2026-11-17）：頭の位置（stage の FK）、顔の一部だけを見せない、
# 大きさは 3D の数字で（ネームの覚え書きの【大きさ（3D）】）、細い物は太さの比べと両端（【細い物】）、巨人の頭の上に1割の余白。
# 続く状態：9-1 で上着・靴・靴下を脱ぎ、革の胴着と半ズボンで裸足（本文 "I put off my coat, shoes, and stockings, and walked
# into the sea, in my leathern jerkin"）。眼鏡は 9-1 で胸の内ポケットへ、10-4 で出してかけ、艦隊を引いて戻るまでかけたまま。
CONTINUITY_E03 = [
    ((1, 1), (8, 2), "Continuity: Gulliver wears his plain coat with buttons, breeches, stockings and shoes (no chain any more)."),
    ((9, 1), (9, 1), "Continuity: Gulliver has just taken off his coat, shoes and stockings: he stands in a sleeveless LEATHER JERKIN over his shirt and breeches, BAREFOOT and bare-legged; the folded coat, shoes and stockings lie at his feet."),
    ((9, 2), (10, 3), "Continuity: Gulliver wears only a sleeveless leather jerkin over his shirt, and breeches; bare legs and BARE FEET (no coat, no shoes, no stockings). No spectacles on his face yet (they are in the jerkin's inside pocket)."),
    ((10, 4), (12, 2), "Continuity: Gulliver wears a sleeveless leather jerkin over his shirt, breeches, bare legs and feet, and from this panel on a pair of small round SPECTACLES on his nose to guard his eyes from the arrows."),
    ((13, 1), (16, 3), "Continuity: Gulliver still wears only the sleeveless leather jerkin over his shirt, and breeches, wet from the sea, bare legs and bare feet (no coat, no shoes)."),
]
SIZE_E03 = {
    'house': "Size check inside the picture (AR-01): Reldresal (150 mm) standing on Gulliver's open palm is a little shorter than the palm and fingers are long (about 190 mm); a Lilliputian's whole head is smaller than Gulliver's eye. Never draw the Lilliputians bigger than this.",
    'coast': "Size check inside the picture (AR-01): a Lilliputian (150 mm) reaches only a little above Gulliver's ankle; the quay (300 mm high) comes to about the middle of his shin. Never draw the Lilliputians bigger than this.",
    'fleet': "Size check inside the picture (AR-01): each warship is about as long as Gulliver is tall (1.8 m) and its masts stand about 1.7 m above the water, higher than his head while he is in the sea up to his chest; a sailor (150 mm) is smaller than his hand.",
    'strait': "Size check inside the picture (AR-01): the strait is 800 yards wide; seen this far, Gulliver and the ships are small shapes in the sea.",
}
FLASHBACK_E03 = "This is a FLASHBACK panel (an old story told by Reldresal): only Lilliputians, no giant anywhere; draw it in the same pencil style but slightly softer, as a memory. Everything is Lilliputian: the people, the table, the eggs (a Lilliputian egg is about a third of a Lilliputian's hand long), the palace and the boats are in normal proportion to each other."
PANEL_E03 = {
    'e03-p01-k1': "This is the episode's cover (扉): BOTH Gulliver's face (propped on his elbows, looking at the tiny man) and Reldresal standing on Gulliver's open right palm must be clearly seen. Keep a tenth of the frame clear above Gulliver's head.",
    'e03-p08-k1': "Seen through a pocket telescope: draw the round black vignette of the telescope's lens around the picture; inside it, the rows of anchored warships with soldiers on deck.",
    'e03-p09-k2': "Gulliver's huge BARE foot steps into the sea; splashes. Show the beach and the sea behind.",
    # 作者に見せる前の描き直し：9-3 は海だけに見えた、15-1 は頭が枠の上で切れた。
    'e03-p09-k3': "Retake: in the first try only empty sea showed. Gulliver must be clearly SEEN swimming in the middle of the strait: his head, shoulders and stroking arms with a wake behind him, about a fifth of the frame wide, a little below the centre; far ahead on the horizon the Blefuscu shore and the masts of the fleet.",
    'e03-p15-k1': "Retake: in the first try Gulliver's head was cut off by the top of the frame. Tilt the view up: draw kneeling Gulliver's WHOLE head and bowed face (eyes lowered, humble) inside the frame, with sky above it; his knee on the ground and his hands on his knee; the quay edge below.",
    'e03-p13-k1': "The court waits on the beach, seen from behind them: the Emperor (green coat) and his courtiers look out to sea, uneasy. Far out in the sea only Gulliver's head shows above the water, and behind it come the sails of the captured fleet (no giant body visible: he is chest-deep in the sea far away).",
    'e03-p12-k1': "Gulliver wades in the sea up to his chest, towing the fleet: the bundle of fifty cables runs from his right hand back to the bows of the first ships (both ends of the cables seen). Leave a tenth of the frame clear above him.",
}

def _key(v): return (int(v['nm.page']), int(v['nm.order']))

def notes_e03(pid, v, p):
    out = []
    k = _key(v)
    flash = p['set'] in ('past', 'eggs')
    gul = any(g['ch'] == 'CH-01' for g in p['figures'])
    if gul:
        for a, b, t in CONTINUITY_E03:
            if a <= k <= b: out.append(t)
    if flash: out.append(FLASHBACK_E03)
    elif p['set'] in SIZE_E03 and gul: out.append(SIZE_E03[p['set']])
    if pid in PANEL_E03: out.append(PANEL_E03[pid])
    if gul and v['nm.shot'] in ('引き', '大引き'):
        out.append("Gulliver is shown whole in this wide shot: keep his whole head inside the frame with about a tenth of the frame's height clear above it (LN-e02-05).")
    if any(w in v['nm.art'] for w in ('綱', '矢', '鉤')):
        out.append("Thin things (cables, arrows, hooks) stay thin: cables thinner than Gulliver's finger, arrows like sewing needles; show where each cable starts and ends (LN-e02-04).")
    out.append("Never cut a face with the frame edge, and never show only part of a face (a nose or a mouth alone): every face in the frame is drawn whole, with its eyes, or not at all (LN-e02-02).")
    out.append("Always draw a background (ground, sky, sea, walls or the room) even in a close-up; never leave the space behind the figures blank.")
    return out

def notes(pid, v, p):
    if pid.startswith('e03-'): return notes_e03(pid, v, p)
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
