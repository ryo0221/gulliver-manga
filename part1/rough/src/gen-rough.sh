#!/bin/bash
# One Codex run: the rough drawing of one panel.
# usage: gen-rough.sh BRIEF_DIR   (from rough-briefs.py: brief.txt, layout.png, refs.txt, frame.json)
# Writes BRIEF_DIR/raw.png, prompt.txt and codex.log.
set -e
D=$(realpath "$1"); cd "$D"
[ -s brief.txt ] && [ -s layout.png ] || { echo "no brief in $D" >&2; exit 1; }
read -r CW CH < <(python3 -c "import json;print(*json.load(open('frame.json'))['canvas'])")
orient=$([ "$CW" -gt "$CH" ] && echo "Landscape ${CW}x${CH}" || { [ "$CW" -lt "$CH" ] && echo "Portrait ${CW}x${CH}" || echo "Square ${CW}x${CH}"; })
args=(-i "$D/layout.png"); refs=""; n=2
ordinal=(FIRST SECOND THIRD FOURTH FIFTH SIXTH SEVENTH EIGHTH)
while IFS=$'\t' read -r path what || [ -n "$path" ]; do
  [ -n "$path" ] || continue
  args+=(-i "$path"); refs+="The ${ordinal[$((n-1))]} attached image is $what: keep that costume and face design."$'\n'; n=$((n+1))
done < refs.txt
cat > prompt.txt <<P
Use your image generation tool. Make ONE image: a manga ROUGH (ラフ) for one comic panel, drawn the way a manga artist roughs a panel before inking.
Style: loose but clear grey pencil lines on white paper, monochrome only (no colour), light grey tone only to separate figures from the background, no finished rendering. Faces must show the direction of the face and the expression; bodies must show the pose with readable joints; contacts (hands, ropes, feet on the body) must be clear.
The FIRST attached image fixes the composition: keep its camera angle, horizon, and where each object and figure sits and how big it is in the frame. Redraw the blocky stand-ins as real people, horses, ships and places.
$refs Gulliver's coat is plain blue in the design but this rough is monochrome: draw it as a plain coat with buttons and NO trim or edging.
Early-18th-century England and its ships; Lilliput is a country of people 1/12 of Gulliver's size: keep their true size against him (AR-01, no exaggeration).
No likeness to any film, game or existing illustration. No text, no letters, no speech balloons, no panel border, no signature, no watermark.
$orient.

$(cat brief.txt)

After generating, copy the generated PNG to ./raw.png in the current directory. Do not generate more than one image.
P
timeout 900 codex exec --skip-git-repo-check --sandbox workspace-write "$(cat prompt.txt)" "${args[@]}" < /dev/null > codex.log 2>&1
ls -la raw.png
