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

1. `gulliver-ep01-output.build.test.ts`：通読の記録（`../read/gulliver-ep01-read.ts` の `READ_VERSIONS`）にある固定した版を `captureDesignPages`（vector）で書き出し、奥付（`colophonHtml()`：書誌情報と AI の関わり）を添えます。
2. `src/export-ep.mjs`：SVG と奥付を Chromium で3倍の PNG にし、PDF は同じ絵を JPEG（品質92）で1ページずつ入れます（PNG のままだと 110 MB になったため）。エディタのページの書き出し（canvas-ui `exportPages`）と同じく、ページの大きさの 0.75 倍の pt で、manifest を添付します。
3. もう一度テストを `GM_OUTPUTS` 付きで動かすと、出力が固定した版から作られたことを確かめ、出力の記録を作ります。

```sh
cp part1/read/*.ts part1/output/*.ts $SB/; cp part1/output/src/export-ep.mjs gm-export-ep.tmp.mjs   # editor-platform で
GM_FINISH=$GM/part1/finish GM_OUT=/tmp/out npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep01-output.build.test.ts
node gm-export-ep.tmp.mjs /tmp/out /tmp/out/export gulliver-ep01 3
GM_FINISH=$GM/part1/finish GM_OUT=/tmp/out GM_OUTPUTS=/tmp/out/export npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep01-output.build.test.ts
```

## 作者の確認待ち

- 著者名は作者が決めました（ナナシ　アイ）。題・あらすじ・紹介文は AI の草案です。
- 判型：原稿の枠 800×1180（1:1.475）は、企画の「A4縦」（1:1.414、595×842 pt）より縦長です。このままにするか、A4 に合わせるか。
