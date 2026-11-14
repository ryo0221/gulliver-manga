#!/bin/bash
# usage: REF=<approved Gulliver raw.png> gen2.sh <item> <underlay.png> <kind: figure|place> <brief>
set -e
item=$1; ul=$(realpath "$2"); kind=$3; brief=$4
[ -n "$REF" ] || { echo 'REF is not set' >&2; exit 1; }
REF=$(realpath "$REF")
# Work directory for the Codex run; paths above are resolved before changing into it.
W=${GEN_WORK:-${TMPDIR:-/tmp}/gulliver-manga-gen}/$item
mkdir -p "$W"; cd "$W"
if [ "$kind" = figure ]; then
 bg="Background must be pure flat white (#FFFFFF) everywhere outside the figure: no floor, no grid, no shadow."
 rules="Ignore and do not draw the orange bone lines and dots in the reference, and do not draw the grey floor grid."
else
 bg="Fill the whole frame, including sky."
 rules=""
fi
cat > prompt.txt <<P
Use your image generation tool. The FIRST attached image is the layout reference to trace (keep its composition). The SECOND attached image is the approved character design of Gulliver: copy his costume exactly, including a plain blue coat with plain brass buttons and NO gold trim or gold edging anywhere on the coat, cuffs or pocket flaps.
Make ONE image: full colour manga setting art (character/setting sheet), clean even thin black main line, flat cel colours (no gradients, no painterly texture, minimal shading).
Early-18th-century English clothes and ships. No likeness to any film, game or existing illustration.
Keep the reference's proportions, pose, camera angle and framing exactly; same position and size in the frame. Landscape orientation 1536x1024.
$rules
$bg
No text, no speech balloons, no signature, no watermark.
Subject: $brief
After generating, copy the generated PNG to ./raw.png in the current directory. Do not generate more than one image.
P
timeout 600 codex exec --skip-git-repo-check --sandbox workspace-write "$(cat prompt.txt)" -i "$ul" -i "$REF" < /dev/null > codex.log 2>&1
ls -la raw.png
