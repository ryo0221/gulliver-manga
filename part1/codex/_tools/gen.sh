#!/bin/bash
# usage: gen.sh <item> <underlay.png> <kind: figure|place> <brief>
set -e
item=$1; ul=$2; kind=$3; brief=$4
W=/tmp/claude-0/-home-user/44300328-351a-52ce-b649-b63fb7917747/scratchpad/gen/$item
mkdir -p $W; cd $W
if [ "$kind" = figure ]; then
 bg="Background must be pure flat white (#FFFFFF) everywhere outside the figure: no floor, no grid, no shadow."
 rules="Ignore and do not draw the orange bone lines and dots in the reference, and do not draw the grey floor grid."
else
 bg="Fill the whole frame, including sky."
 rules=""
fi
cat > prompt.txt <<P
Use your image generation tool, with the attached image as the reference to edit/trace (keep its composition).
Make ONE image: full colour manga setting art (character/setting sheet), clean even thin black main line, flat cel colours (no gradients, no painterly texture, minimal shading).
Early-18th-century English clothes and ships. No likeness to any film, game or existing illustration.
Keep the reference's proportions, pose, camera angle and framing exactly; same position and size in the frame. Landscape orientation 1536x1024.
$rules
$bg
No text, no speech balloons, no signature, no watermark.
Subject: $brief
After generating, copy the generated PNG to ./raw.png in the current directory. Do not generate more than one image.
P
timeout 600 codex exec --skip-git-repo-check --sandbox workspace-write "$(cat prompt.txt)" -i "$ul" < /dev/null > codex.log 2>&1
ls -la raw.png
