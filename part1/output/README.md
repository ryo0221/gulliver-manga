# 第1話「人の山」出版準備（Editor Platform）

工程定義 `fiction-manga@1.3.0` の「出版準備」（話ごと）の成果物「出力の記録」です。通読で読み直した固定した版 `gm1-ep01-finish@finish-ep01-v3` から、ページごとの PNG と話ごとの PDF を書き出しました。確かめるのは作者です（`output.approved`）。

## 成果物

| 資料 | 中身 |
| --- | --- |
| `artifacts/gm1-ep01-output` 第1話 出力の記録（Structured Data） | 出力物（レイヤーを残した元の原稿と、まとめた出力物を分ける。形式ごとに、もとにした固定した版）、書誌情報と紹介文、AI の関わり |
| `ep01-outputs.json` | 書き出した各ファイルの大きさと sha256、もとにした版（artifactId・versionId・contentHash） |
| PNG（ページごと） | 2400×3540 px（原稿の枠 800×1180 の3倍）16枚と奥付1枚。大きいので commit せず、プロジェクトのファイル `gulliver-manga/part1/output/png/` に置いた |
| PDF（話ごと） | `gulliver-ep01.pdf`、漫画16ページ＋奥付、600×885 pt。書き出しの元の版（capture の manifest）を `references.json` として添付。プロジェクトのファイル `gulliver-manga/part1/output/` |

元の原稿（レイヤーを残したもの）は `../finish/artifacts/gm1-ep01-finish.artifact.json`（Design、コマごとに LY-03〜LY-10）です。

プロジェクトのファイルに置いた写しは、置き場所の都合でファイルのバイトが変わることがあります（画素は同じ）。sha256 は書き出したときのファイルのものです。

## 書き出し方

1. `gulliver-ep01-output.build.test.ts`：通読の記録（`../read/gulliver-ep01-read.ts` の `READ_VERSIONS`）にある固定した版の中身から、メモのグループ（カメラの札と描き方の覚え書き）だけを隠して（仕上げのテストと同じ `forExport`）書き出し用の版にし、`captureDesignPages`（vector）で書き出します。固定した版との違いがメモのグループだけで、ページに「絵：」の覚え書きが出ないことを確かめます。もとにした版と隠したものは `pages/source.json`（PDF にも添付）と `ep01-outputs.json` の `source` に残します。奥付（`colophonHtml()`：書誌情報と AI の関わり）を添えます。
2. `src/export-ep.mjs`：SVG と奥付を Chromium で3倍の PNG にし、PDF は同じ絵を JPEG（品質92）で1ページずつ入れます（PNG のままだと 110 MB になったため）。エディタのページの書き出し（canvas-ui `exportPages`）と同じく、ページの大きさの 0.75 倍の pt で、manifest を添付します。
3. もう一度テストを `GM_OUTPUTS` 付きで動かすと、出力が固定した版から作られたことを確かめ、出力の記録を作ります。

```sh
cp part1/read/*.ts part1/output/*.ts $SB/; cp part1/output/src/export-ep.mjs gm-export-ep.tmp.mjs   # editor-platform で
GM_FINISH=$GM/part1/finish GM_OUT=/tmp/out npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep01-output.build.test.ts
node gm-export-ep.tmp.mjs /tmp/out /tmp/out/export gulliver-ep01 3
GM_FINISH=$GM/part1/finish GM_OUT=/tmp/out GM_OUTPUTS=/tmp/out/export npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep01-output.build.test.ts
```

## 作者の判断

- 著者名は作者が決めました（ナナシ　アイ）。題・あらすじ・紹介文は AI の草案です。
- 判型：原稿の枠 800×1180（1:1.475）は企画の「A4縦」（1:1.414）より縦長ですが、作者の判断でこのままにしました（2026-11-14）。

# 第2話「綱渡りの宮廷」出版準備

通読で完成とした（作者の判断 2026-11-16「2話は完成としてよい」）固定した版 `gm1-ep02-finish@finish-ep02-v3`（コミット 2b451a94）から、第1話と同じ手順で書き出しました。白黒です。

| 資料 | 中身 |
| --- | --- |
| `artifacts/gm1-ep02-output` 第2話 出力の記録（Structured Data） | 出力物、書誌情報と紹介文（題は脚本、あらすじ・紹介文は AI の草案、著者名・原作は第1話と同じ）、AI の関わり（仕上げに画像の生成は使っていない） |
| `ep02-outputs.json` | 書き出した各ファイルの大きさと sha256、もとにした版 |
| PNG（ページごと） | 2400×3540 px 16枚と奥付1枚。プロジェクトのファイル `gulliver-manga/part1/output-ep02/png/` |
| PDF（話ごと） | `gulliver-ep02.pdf`、漫画16ページ＋奥付、600×885 pt。プロジェクトのファイル `gulliver-manga/part1/output-ep02/` |

第1話の `gulliver-ep01-output.ts` を話ごとに使えるようにしました（`OutputEpisode`、`buildEpisodeOutput`、`colophonHtml(ep)`）。第1話の出力の記録は変わりません。

```sh
cp part1/read/*.ts part1/output/*.ts $SB/; cp part1/output/src/export-ep.mjs gm-export-ep.tmp.mjs   # editor-platform で
GM_FINISH=$GM/part1/finish GM_OUT=/tmp/out2 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep02-output.build.test.ts
node gm-export-ep.tmp.mjs /tmp/out2 /tmp/out2/export gulliver-ep02 3
GM_FINISH=$GM/part1/finish GM_OUT=/tmp/out2 GM_OUTPUTS=/tmp/out2/export npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep02-output.build.test.ts
```
