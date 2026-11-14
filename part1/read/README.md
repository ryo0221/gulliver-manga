# 第1話「人の山」通読（Editor Platform）

工程定義 `fiction-manga@1.3.0` の「通読」の成果物「編集の記録」です。仕上げた第1話を固定した版で1ページ目から読み、指摘を1件ずつ記録しました。指摘の判断と、完成とするかの判断は作者です（`read.approved`）。

## 成果物

| 資料（`artifacts/`） | Editor | 中身 |
| --- | --- | --- |
| `gm1-ep01-read` 第1話 編集の記録 | Document | 通読した版（固定した版とコミット）、指摘ごとの判断と理由、直した後の版、完成の判断 |
| `gm1-ep01-read-findings` 指摘の表 | Structured Data | 1指摘1行：対象（コマ・ページ・シーン・台詞の行）、出し手、いつ・どの工程で、指摘、判断、理由、直した後の版 |

## 読んだ版

- はじめの通読：`gm1-ep01-finish@finish-ep01-v2`（コミット b520265b、PR #9 のマージ）
- 直した版の読み直し：`gm1-ep01-finish@finish-ep01-v3`、`gm1-ep01-lettering@finish-ep01-v3`（コミット e0136eec）

## 指摘と判断（2026-11-14、作者「おすすめです直して」）

| 指摘 | 対象 | 判断 | 直した後 |
| --- | --- | --- | --- |
| RV-e01-01 顔が切れていて不自然 | 12-5 | 直す（作者の指摘） | 線画 ink-ep01-v1 |
| RV-e01-02 背景を描いて | 2-2 3-4 6-1 8-4 11-5 | 直す（作者の指摘） | 仕上げ finish-ep01-v2 |
| RV-e01-03 扉で胸の上の小人が見えない | 1-1 | 直す | 舞台のカメラ・ラフ・線画・仕上げ |
| RV-e01-04 小人が大きすぎる | 12-3（9-2 は直さない） | 直す | 線画・仕上げ |
| RV-e01-05 杭が草の緑 | 8-1 | 直す | 仕上げ（杭だけ木の茶色） |
| RV-e01-06 影がほとんど無い | 3-1 11-3 | 直さない | |
| RV-e01-07 15-2 で両脚に鎖 | 15-2 | 直す | 線画・仕上げ（左脚だけ） |
| RV-e01-08 門がガリヴァーと同じ背 | 16-1 | 直さない | |
| RV-e01-09 右上が白い | 7-2 | 直す | 線画（夜空と草）・仕上げ |
| RV-e01-10 馬の色 | 2-2 2-4 | 意図として残す | |
| RV-e01-11 序の時の飛び | 1-2 2-6 | 意図として残す | |
| RV-e01-12 12-3 で樽が見えない | 12-3 | 直さない | |

作者の判断（2026-11-14「完成として良い」）：完成。

## 直し方

直したコマは、どれも同じ工程の道具でコマ単位に作り直しました（`ep01-ink.json`・`ep01-finish.json`・`ep01-rough.json` の `revision`、`ep01-stage.json` の `revised` に、指摘の番号と前の生成の sha256 を残しています）。

- 扉 1-1：`../name/src/gulliver-ep01-stage.demo.ts` のカメラを胸の上の小人の後ろの少し上へ引き、浜の舞台だけを撮り直しました（`STAGE_SETS=beach`、モデルの版は `../name/stage/models/beach-cover/`）。ラフは `../rough/src/rough-briefs.py` の `REVISED_CAMERA`・`REVISED_NOTE` で、ネームのカメラの覚え書きを直した版に置き換えて描かせました。
- 12-3・15-2：`../ink/src/ink-briefs.py` の `INK_NOTES` に直しを足し、`INK_ONLY=<コマ>` で `ink-assets.py` をそのコマだけに使いました。
- 7-2：`../ink/src/bg-briefs.py` の `BG_NOTES` と `BG_ONLY=<コマ>`（`bg-merge.py` も）。
- 8-1：画像の生成は使わず、`../finish/src/finish-assets.py` の `REGION_FIX` で、杭の中の小さな領域だけを塗り直しました。
- 塗り直しは `FINISH_ONLY=<コマ>` で `finish-assets.py` をそのコマだけに使いました。扉は1回目に空の上に白い帯が残ったので、空を上の端まで塗るよう足して塗り直しました。

## 作り直し方

```sh
cp part1/read/*.ts part1/name/gulliver-ep01-name.ts part1/script/gulliver-part1-script.ts part1/editor/gulliver-part1.ts story/editor/gulliver-story.ts $SB/
GM_OUT=/tmp/read npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep01-read.build.test.ts
```
