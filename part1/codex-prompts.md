# Part 1 (Lilliput) setting art — Codex requests

Plan: https://claude.ai/artifact/4TLyrtjaJKNPSBfEtT2nZ3 (art guide: AR-01..07, LY-01..10, SM-01..05)
Part 1 sheet: https://claude.ai/artifact/Mt255P7TVnCGZvJMdQGVXh (CH / LO / TE tables)
Underlays (LY-01): `underlay/` next to this file (PNG; `*-view.png` = plain viewport, others path-traced).

## Common rules (send with every request)

- Full colour manga setting art, clean even thin main line (AR-03), backgrounds thinner than figures.
- Early-18th-century English clothes and ships (AR-02). No film, game or existing-illustration likeness.
- Keep the underlay's proportions, pose and camera exactly (AR-01: true size ratio 1:12, no exaggeration).
- Output one transparent PNG per layer, same pixel size as the underlay, named `<item>-<LY id>.png`:
  - figures: LY-05 人物の塗り (flat colours), LY-07 人物の線画 (lines only)
  - places: LY-03 背景の塗り (flat colours + sky), LY-04 背景の線画 (lines only)
- No text, no speech balloons, no signatures, no watermark.
- Gulliver's blue coat never has gold trim (buttons are brass) — AR-06, Ryo 2026-11-14.
- Record for each PNG: Codex version/model, prompt, input files → `provenance.json` next to the outputs.

## Requests

| item | underlay | brief |
| --- | --- | --- |
| ch01-gulliver-front / -side / -back | `underlay/ch01-gulliver-{front,side,back}.png` | Lemuel Gulliver, ship's surgeon, 1,750 mm, about 30. Blue coat, tan breeches, white stockings, black shoes (AR-06), short brown hair tied back, clean-shaven, tired but curious face. |
| lilliputian-front / -side / -back | `underlay/lilliputian-{front,side,back}.png` | A Lilliputian courtier, 146 mm tall but drawn as a normal adult person (same body proportions). Dark red coat, grey breeches, small sword. |
| scale-gulliver-lilliputian | `underlay/scale-gulliver-lilliputian.png` | Both together at true scale (the Lilliputian reaches Gulliver's lower shin). Gulliver's coat exactly as in ch01 sheets: NO gold trim, brass buttons. |
| lo03-temple | `underlay/lo03-temple.png` | The ancient temple outside Mildendo's west gate where Gulliver lodges; gate 4 ft high, 2 ft wide; abandoned, stone, early-morning light. |
| lo04-mildendo | `underlay/lo04-mildendo.png` | Mildendo, a 500-ft-square walled city, two crossing main streets, 3–5 storey houses, palace at the centre; warm brick and grass palette (AR-04, part 1). |
| (later) CH-02..CH-07 | Lilliputian underlay + sheet rows | Each from its row in the Part 1 sheet (変えない外見). Main figures must be told apart by hair, build and silhouette. |

## Output

Put outputs in `/mnt/project-files/gulliver-manga/part1/codex/` (one folder per item, e.g. `codex/ch01-gulliver-front/`), with `provenance.json` per item. Underlay PNGs are 940×735 (figures) and 1280×720 (places). Orange lines and dots in the figure underlays are the rig's bones: ignore them (do not draw them).
