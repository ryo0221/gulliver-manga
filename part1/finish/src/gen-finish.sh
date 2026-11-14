#!/bin/bash
# One Codex run: the colour reference (仕上げ) of one panel, coloured over the accepted line art.
# usage: gen-finish.sh BRIEF_DIR   (finish-briefs.py: lines.png; ink-briefs.py: ink-brief.txt, refs.txt, frame.json)
# Writes BRIEF_DIR/color-raw.png, color-prompt.txt and color-codex.log.
set -e
D=$(realpath "$1"); cd "$D"
[ -s lines.png ] && [ -s ink-brief.txt ] || { echo "no finish input in $D" >&2; exit 1; }
read -r CW CH < <(python3 -c "import json;print(*json.load(open('frame.json'))['canvas'])")
orient=$([ "$CW" -gt "$CH" ] && echo "Landscape ${CW}x${CH}" || { [ "$CW" -lt "$CH" ] && echo "Portrait ${CW}x${CH}" || echo "Square ${CW}x${CH}"; })
args=(-i "$D/lines.png"); refs=""; n=2
ordinal=(FIRST SECOND THIRD FOURTH FIFTH SIXTH)
while IFS=$'\t' read -r path what || [ -n "$path" ]; do
  [ -n "$path" ] || continue
  args+=(-i "$path"); refs+="The ${ordinal[$((n-1))]} attached image is $what, in its approved colours: use those colours for that person or place."$'\n'; n=$((n+1))
done < refs.txt
# The brief's figure list and memo, without the rough/3D image notes.
brief=$(grep -v -e '^The SECOND image' -e '^The FIRST image' ink-brief.txt)
# An optional note for this panel (finish-briefs.py writes it), e.g. the scene's context.
[ -s finish-note.txt ] && brief+=$'\n'"$(cat finish-note.txt)"
cat > color-prompt.txt <<P
Use your image generation tool. Make ONE image: the full-colour FINISH (仕上げ) of one manga panel, coloured over the attached line art.
The FIRST attached image is the author's approved black line art of this panel. Keep every line exactly where it is, with the same shapes, sizes and composition: do not redraw, move, add or remove anything; only colour it in, like colouring the inked page. The white bands at the edges (if any) are outside the panel: leave them plain white.
$refs Colouring style: clean anime-style cel colouring. Flat base colours inside the lines, plus ONE hard-edged darker shadow tone per colour (cel shadow) on the side away from the light; light from the upper left unless the scene says otherwise (night scenes: cool moonlight, warm lantern light). No gradients except in the sky and the sea, no texture, no screentone, no glow, no added lines, no text.
Palette (art guide AR-04, AR-06): part 1 (Lilliput) is built on warm brick and grass greens; England and the sea in muted 18th-century colours. Gulliver: plain blue coat with BRASS buttons and NO gold trim or edging, tan breeches, white stockings, black shoes, brown hair tied back. Lilliputians: early-18th-century clothes in muted colours. Skin tones natural.
No likeness to any film, game or existing illustration. No text, no letters, no speech balloons, no signature, no watermark.
$orient.

$brief

After generating, copy the generated PNG to ./color-raw.png in the current directory. Do not generate more than one image.
P
timeout 900 codex exec --skip-git-repo-check --sandbox workspace-write "$(cat color-prompt.txt)" "${args[@]}" < /dev/null > color-codex.log 2>&1
ls -la color-raw.png
