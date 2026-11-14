#!/bin/bash
# One Codex run: draw the background into one panel's line art (keeps the figures, adds blue background lines).
# usage: gen-bg.sh BRIEF_DIR   (bg-briefs.py: bg-lines.png, bg-brief.txt; rough-briefs.py: layout.png, frame.json)
# Writes BRIEF_DIR/bg-raw.png, bg-prompt.txt and bg-codex.log.
set -e
D=$(realpath "$1"); cd "$D"
[ -s bg-brief.txt ] && [ -s bg-lines.png ] && [ -s layout.png ] || { echo "no background brief in $D" >&2; exit 1; }
read -r CW CH < <(python3 -c "import json;print(*json.load(open('frame.json'))['canvas'])")
orient=$([ "$CW" -gt "$CH" ] && echo "Landscape ${CW}x${CH}" || { [ "$CW" -lt "$CH" ] && echo "Portrait ${CW}x${CH}" || echo "Square ${CW}x${CH}"; })
cat > bg-prompt.txt <<P
Use your image generation tool. Make ONE image: the same manga line art as the FIRST attached image, with its background drawn in.
The FIRST attached image is the approved line art of one comic panel. Its background was left empty (plain white). Keep EVERY existing line exactly where it is and as it is: the same composition, camera, figures, poses, faces, sizes and positions; do not move, redraw, restyle, add or remove any person or animal. Only draw the background into the white areas behind the figures.
The SECOND attached image is the 3D layout render of the same camera: use it for the horizon and the perspective of the background.

THE BACKGROUND TO DRAW:
$(cat bg-brief.txt)

INK COLOURS (the colours mark the layers; they are separated afterwards):
- keep the PURE BLACK lines (#000000) of the people and animals as they are;
- draw the whole background in PURE BLUE lines (#0000FF): clean manga pen lines with varied weight, fine line hatching for shade, more detail near the camera and simpler far away;
- keep any PURE RED lines (#FF0000) as they are and add no new red.
Lines only on pure white paper: no grey, no screentone, no solid fills, no colour other than these three. Where a figure overlaps the background, the background line stops at the figure's outline. The top of the panel may stay as open sky with only a few cloud outlines; do not fill the sky with lines.
No likeness to any film, game or existing illustration. No text, no letters, no speech balloons, no panel border, no signature, no watermark. The white bands at the edges of the FIRST image are padding outside the panel: continue the background into them.
$orient.

After generating, copy the generated PNG to ./bg-raw.png in the current directory. Do not generate more than one image.
P
timeout 900 codex exec --skip-git-repo-check --sandbox workspace-write "$(cat bg-prompt.txt)" -i "$D/bg-lines.png" -i "$D/layout.png" < /dev/null > bg-codex.log 2>&1
ls -la bg-raw.png
