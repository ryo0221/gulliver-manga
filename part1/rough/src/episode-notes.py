import math
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

# 第4話。第3話の学び LN-e03-01〜06 は作者が全部採った（2026-11-19）：細い段は上下が切れる（大事な物は縦の真ん中へ）、
# 子ども・侍女などの脇役は年と背を書く、着ている物の言い方をどこでも同じに。
# 続く状態：1〜9ページ（SC-012・013）は上着の姿。10-2 から（本文 "I ... got up in an instant ... without my coat"）は上着なし。
# 夜は 10〜14ページ（松明と炎の明かり）、15〜16ページは朝。
COAT_E04 = "Continuity: Gulliver wears his plain blue coat with brass buttons, tan breeches, white stockings and black shoes (no chain)."
WAISTCOAT_E04 = "Continuity: Gulliver has left his coat behind in his hurry: he wears a white shirt with a buttoned pale-brown sleeveless waistcoat over it, tan breeches, white stockings and black shoes (NO coat)."
CONTINUITY_E04 = [((1, 1), (9, 2), COAT_E04), ((10, 2), (16, 2), WAISTCOAT_E04)]
TIME_E04 = [
    ((10, 1), (11, 2), "Time: MIDNIGHT. Dark sky; the light comes from torches and lanterns carried by the tiny people (and, far off, a red glow in the sky)."),
    ((12, 1), (14, 2), "Time: NIGHT. The fire on the palace roof lights the scene from above and behind: strong flickering light and deep shadows; smoke against the night sky."),
    ((15, 1), (16, 2), "Time: early MORNING, pale clear light, a little smoke still rising."),
]
SIZE_E04 = {
    'throne': "Size check inside the picture (AR-01): the throne room is a Lilliputian building: its east window (400 mm wide, 280 mm high) is lower than kneeling Gulliver's hips; the Emperor (158 mm) at the window is about as tall as Gulliver's hand is long; kneeling Gulliver's head is about six times as high as the Emperor's. Never draw the palace or the Lilliputians bigger than this.",
    'gate': "Size check inside the picture (AR-01): an envoy (150 mm) standing on Gulliver's open palm is a little shorter than the palm and fingers are long (about 190 mm); a Lilliputian's whole head is smaller than Gulliver's eye. Never draw the Lilliputians bigger than this.",
    'palace': "Size check inside the picture (AR-01): the houses of the capital (3 to 5 storeys, 0.75 to 1.25 m) come up to about Gulliver's waist; the great street (1.5 m wide) is about one stride; a Lilliputian (150 mm) reaches only the lower third of his shin; the buildings of the palace's second court (1.52 m) reach below his chest and the eaves of the royal apartments (1.83 m) are a little above the top of his head. Never draw the city bigger than this.",
}
PANEL_E04 = {
    'e04-p01-k1': "This is the episode's cover (扉): BOTH kneeling Gulliver's whole face (head up, attentive, NOT bowed) and the tiny Emperor on the terrace before the big window must be clearly seen. Keep a tenth of the frame clear above Gulliver's head.",
    'e04-p02-k2': "Gulliver kneels upright with his head UP (not bowed), looking straight down at the Emperor and refusing, calm and firm; his whole face with both eyes in the vertical middle of the frame.",
    'e04-p03-k1': "Gulliver kneels upright with his head UP (not bowed), speaking clearly and calmly.",
    'e04-p04-k1': "The Emperor turns his back to the window and walks back into the room.",
    'e04-p05-k1': "Flimnap leans close to Bolgolam's ear and whispers, one hand raised beside his mouth.",
    'e04-p05-k2': "Gulliver kneels upright, alone, his head a little lowered and thoughtful; the window and the terrace before him are empty.",
    'e04-p06-k1': "The six envoys of Blefuscu are grown men in RED coats and white wigs; behind them a long train (about five hundred) of servants on foot and horseback fills the street.",
    'e04-p06-k2': "The envoys are grown men in red coats and white wigs; their chief is about 50. Their faces, with the eyes, are seen.",
    'e04-p07-k1': "The chief envoy (about 50, a grown man, red coat, white wig) stands WHOLE on Gulliver's open right palm, bowing as he speaks; the other five envoys stand on the ground below.",
    'e04-p08-k1': "Gulliver kneels upright with his head up, asking politely.",
    'e04-p09-k1': "The Emperor sits or stands by the throne; Flimnap shows an open ledger; Bolgolam points out of the window.",
    'e04-p10-k1': "Hundreds of tiny people (each 150 mm, smaller than the bottom step of the great gate is wide) crowd with torches before the great gate of the old temple (Gulliver's house) at midnight, shouting and waving their arms. No giant in this panel.",
    'e04-p10-k2': "Gulliver crawls out on his elbows through the great door of the old temple, face down, head raised; his whole face with both eyes is seen; the tiny crowd with torches makes way below his chin.",
    'e04-p11-k2': "A huge black shoe comes down very carefully into the street between the fleeing tiny people; only his shoe and the lower part of his leg are seen.",
    # 作者に見せる前の描き直し：12-1 は、ガリヴァーが二の庭の建物の上に立っているように見えた。
    'e04-p12-k1': "Retake: in the first try Gulliver seemed to stand ON TOP of the building. He stands on the GROUND of the palace court, seen from behind at an angle, from the knees up: the low buildings of the second court (1.52 m) stand in front of him and reach only to below his CHEST, so his chest, shoulders and head rise above their roofs; beyond them the roof of the royal apartments (eaves a little above his head) is in flames, the flames rising higher than his head. The camera looks from the roof of an outer-court building, a little above the tiny people. On the ground at his feet, tiny people (each 150 mm, up to the lower third of his shin) pass thimble-sized buckets hand to hand.",
    'e04-p12-k2': "Each bucket is as big as a thimble: it fits in a tiny person's two hands. Gulliver's shoe and shin stand huge behind them; his face is NOT drawn.",
    'e04-p13-k1': "Gulliver turns his head and looks around, helpless, the fire behind him lighting one side of his face.",
    'e04-p14-k1': "Steam (not smoke) falls down into the frame from above; the tiny people below look UP toward the top of the frame, mouths open in astonishment. Gulliver is NOT drawn at all.",
    'e04-p14-k2': "The fire is out: thick white steam rises from the dark roof of the royal apartments; the night sky. No figures.",
    'e04-p15-k1': "Draw the royal apartments with the roof burnt through: black charred rafters standing against the morning sky, scorched walls, thin smoke. No figures. (The 3D view here is mostly walls: draw the burnt roof clearly.)",
    'e04-p15-k2': "The Empress (a grown woman, a crown) looks at her burnt rooms, cold and hurt; her whole face is seen.",
    'e04-p15-k3': "The Empress walks away without looking back; behind her two maids-in-waiting (grown women, a little shorter than the Empress) cover their faces with both hands. Gulliver is NOT seen (he is beyond the buildings of the second court).",
    'e04-p16-k1': "Gulliver kneels upright in the great street outside the palace wall, looking at the burnt palace, regretful; his whole face is seen with a tenth of the frame clear above his head.",
}

def notes_e04(pid, v, p):
    out = []
    k = _key(v)
    gul = any(g['ch'] == 'CH-01' for g in p['figures'])
    if gul:
        for a, b, t in CONTINUITY_E04:
            if a <= k <= b: out.append(t)
    for a, b, t in TIME_E04:
        if a <= k <= b: out.append(t)
    if p['set'] in SIZE_E04 and (gul or p['set'] != 'gate'): out.append(SIZE_E04[p['set']])
    if pid in PANEL_E04: out.append(PANEL_E04[pid])
    if gul and v['nm.shot'] in ('引き', '大引き') and '膝から上' not in v['nm.art']:
        out.append("Gulliver is shown whole in this wide shot: keep his whole head inside the frame with about a tenth of the frame's height clear above it (LN-e02-05).")
    elif gul and v['nm.shot'] in ('引き', '大引き'):
        out.append("Gulliver is shown from the knees up: keep his whole head inside the frame with about a tenth of the frame's height clear above it (LN-e02-05).")
    if '描かない' in v['nm.art']:
        out.append("Where the storyboard memo says a face is NOT drawn (描かない), draw no part of that face at all: not the chin, not the nose, not an eye.")
    aspect = math.tan(math.radians(p['hfovDeg']) / 2) / math.tan(math.radians(p['vfovDeg']) / 2)
    if aspect > 2.2:
        out.append("This panel is a WIDE, LOW strip: the top and bottom of the drawing will be cut away, so keep every head and face in the middle band of the height (LN-e03-01).")
    out.append("Extras: draw the tiny people as grown men and women of mixed ages unless the brief says children (LN-e03-02).")
    out.append("Never cut a face with the frame edge, and never show only part of a face (a nose or a mouth alone): every face in the frame is drawn whole, with its eyes, or not at all (LN-e02-02).")
    out.append("Always draw a background (ground, sky, walls, the street or the room) even in a close-up; never leave the space behind the figures blank.")
    return out

def notes(pid, v, p):
    if pid.startswith('e04-'): return notes_e04(pid, v, p)
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
