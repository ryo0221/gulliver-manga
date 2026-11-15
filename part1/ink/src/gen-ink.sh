#!/bin/bash
# One Codex run: the line art (線画) of one panel, inked over the accepted rough.
# usage: gen-ink.sh BRIEF_DIR   (rough-briefs.py + ink-briefs.py: ink-brief.txt, rough.png, layout.png, refs.txt, frame.json)
# Writes BRIEF_DIR/ink-raw.png, ink-prompt.txt and ink-codex.log.
set -e
D=$(realpath "$1"); cd "$D"
[ -s ink-brief.txt ] && [ -s rough.png ] && [ -s layout.png ] || { echo "no ink brief in $D" >&2; exit 1; }
read -r CW CH < <(python3 -c "import json;print(*json.load(open('frame.json'))['canvas'])")
orient=$([ "$CW" -gt "$CH" ] && echo "Landscape ${CW}x${CH}" || { [ "$CW" -lt "$CH" ] && echo "Portrait ${CW}x${CH}" || echo "Square ${CW}x${CH}"; })
args=(-i "$D/rough.png" -i "$D/layout.png"); refs=""; n=3
ordinal=(FIRST SECOND THIRD FOURTH FIFTH SIXTH SEVENTH EIGHTH)
while IFS=$'\t' read -r path what || [ -n "$path" ]; do
  [ -n "$path" ] || continue
  args+=(-i "$path"); refs+="The ${ordinal[$((n-1))]} attached image is $what: keep that costume and face design."$'\n'; n=$((n+1))
done < refs.txt
cat > ink-prompt.txt <<P
Use your image generation tool. Make ONE image: the manga LINE ART (線画, inks) for one comic panel, inked cleanly over the attached pencil rough the way a manga artist inks a page.
The FIRST attached image is the author's approved pencil rough of this panel: trace its composition faithfully — same camera angle, horizon, figure places, sizes, poses, facings, gestures and expressions. Clean up and finish the drawing: confident pen lines, varied line weight (thicker outlines, thin inner detail), correct anatomy and hands, readable faces, clothing folds, and the details of buildings, ships, ropes and ground. Do not add or remove figures.
The SECOND attached image is the 3D layout render of the same camera: use it to keep proportions, perspective and the true sizes of things.
$refs Gulliver's coat: plain, with buttons and NO trim or edging.
Lilliput is a country of people 1/12 of Gulliver's size: keep their true size against him (AR-01, no exaggeration). Keep every face whole inside the frame unless the rough itself crops it.

INK COLOURS (the colours mark the layers; they are separated afterwards):
- PURE BLACK lines (#000000) for every person and animal: outlines, faces, hair, clothes, hands, and whatever they hold or wear (bows, swords, hats, chains and ropes tied on a body).
- PURE BLUE lines (#0000FF) for everything that is not a person or animal: buildings, walls, ground, sand, grass, sea and waves, sky and clouds, ships, boats, carts, barrels, ladders, loose ropes and stakes.
- PURE RED lines (#FF0000) only for manga effect lines (speed lines, focus lines, impact or shock marks) where the panel's action calls for them; if the panel needs none, use no red at all.
Lines only on pure white paper: no grey, no screentone, no solid fills, no colour other than these three, no shading except fine line hatching in the same colour as the thing it shades. Where a figure overlaps the background, the background line stops at the figure's outline.
No likeness to any film, game or existing illustration. No text, no letters, no sound effects lettering, no speech balloons, no panel border, no signature, no watermark.
$orient.

$(cat ink-brief.txt)

After generating, copy the generated PNG to ./ink-raw.png in the current directory. Do not generate more than one image.
P
timeout 900 codex exec --skip-git-repo-check --sandbox workspace-write "$(cat ink-prompt.txt)" "${args[@]}" < /dev/null > ink-codex.log 2>&1
ls -la ink-raw.png
