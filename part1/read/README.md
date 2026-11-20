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

# 第2話「綱渡りの宮廷」通読

`gm1-ep02-read`（編集の記録）と `gm1-ep02-read-findings`（指摘の表）。はじめに読んだ版は `gm1-ep02-finish@finish-ep02-v1`（コミット 2373f55c、白黒）、
作者の判断（2026-11-15「これと提案の6件を直してください」）で直した版 `finish-ep02-v3` を読み直した。ページは `../finish/ep02/pages/`。
第1話の `readDocument`・`findingsTable` を話ごとに使えるようにした（第1話の成果物は変わらない）。

| 指摘 | 対象 | 判断 |
| --- | --- | --- |
| RV-e02-01 細い糸が太い石の縁に見える | 3-1 | 直す（線画 ink-ep02-v2） |
| RV-e02-02 引きでガリヴァーの頭が切れている | 7-4 | 直す（舞台・ラフ rough-ep02-v2・線画） |
| RV-e02-03 評議の間の壁と卓にまだらのグレー | 6-1 6-3 7-1 | 直す（仕上げだけ、`FLAT_BG`） |
| RV-e02-04 都の家がガリヴァーより大きく見える | 11-1 | 直す（線画） |
| RV-e02-05 見張りの小人が大きすぎる | 11-2 | 直す（線画） |
| RV-e02-06 宮殿の窓が頭より大きい | 16-2 | 直す（線画） |
| RV-e02-09 顔が鼻だけで気持ち悪い（作者） | 16-1 | 直す（舞台を窓の外の脇から撮り直し・ラフ・線画） |
| RV-e02-10 線画だけ直した4コマのトーンが明るい | 3-1 11-1 11-2 16-2 | 意図として残す（作者 2026-11-15「このままでよい」） |
| RV-e02-07 勝者の顔が枠の外 | 5-2 | 意図として残す（腰の寄り） |
| RV-e02-08 上着の裾のメモと上着を脱いだ姿 | 12-2 | 意図として残す（作者の判断） |

作者の判断（2026-11-16「2話は完成としてよい」）：完成。出版準備は `finish-ep02-v3`（コミット 2b451a94、PR #14 のマージ）から作る。

```sh
cp part1/read/*.ts part1/name/gulliver-ep0{1,2}-name.ts part1/script/gulliver-part1-script.ts $SB/
GM_OUT=/tmp/read npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep02-read.build.test.ts
```

直し方：舞台は `../name/src/gulliver-ep02-stage.demo.ts` のカメラを変えて court・city を撮り直し、`../name/src/stage-revise.py` で直したコマだけを
`stage/ep02-stage.json` に入れた（`revised`）。舞台の罠：ポーズの `at` は足ではなく腰で、寝そべるガリヴァー（PRONE）の頭は窓の壁から 1.1 m 南にあった
（16-1 だけ `PRONE_AT_WINDOW`）。ラフは `rough-briefs.py` の `REVISED_CAMERA`・`REVISED_NOTE`、線画は `ink-briefs.py` の `INK_NOTES` と `INK_ONLY`、
仕上げは `finish-mono.py` の `FLAT_BG`・`INK_TONE`。

# 第3話「卵の端」通読

`gm1-ep03-read`（編集の記録）と `gm1-ep03-read-findings`（指摘の表）。はじめに読んだ版は `gm1-ep03-finish@finish-ep03-v1`（コミット 294641e2、PR #18 のマージ、白黒）、
作者の判断（2026-11-17「おすすめ通り直して」）で直した版 `finish-ep03-v2` を読み直した。ページは `../finish/ep03/pages/`。

作者の判断（2026-11-19、「第3話を完成として、書き出しと学びも作りますか」に「完成として両方作る」）：完成。出版準備は `finish-ep03-v2`（コミット 99527ac、PR #19 のマージ）から作る。

| 指摘 | 対象 | 判断と直し方 |
| --- | --- | --- |
| RV-e03-01 話すレルドレサルの頭が枠の外 | 2-2 | 直す（舞台を引いて撮り直し、ラフ・線画・仕上げ。ガリヴァーの顔は入れない） |
| RV-e03-02 同じく頭が枠の外 | 6-1 | 直す（同上） |
| RV-e03-03 幼い王子が大人に見える | 4-4 | 直す（ラフから） |
| RV-e03-04 胸までのはずの海が脛ほど | 12-1 | 直す（ラフから） |
| RV-e03-05 綱の束の間がくさび形のむら | 12-1 | 直す（線画で綱を1本ずつの線に） |
| RV-e03-06 皇帝の立つ台が模様の無い灰色の板 | 16-1 16-2 | 直す（線画から、石の壇） |
| RV-e03-07 効果音の「ン」だけが折り返し | 10-2 | 直す（写植：擬音は1行に収まる字の大きさ） |
| RV-e03-08 11-1 だけ胴着がひも締め | 11-1 | 直す（線画から） |
| RV-e03-09 空のグレーのしみ | 15-1 16-3 | 直す（仕上げ：`SKY_WHITE`） |
| RV-e03-10 頭が枠の外 | 9-2 | 意図として残す（足としぶきの寄り） |
| RV-e03-11 卵が大きい | 5-2 | 意図として残す（小人の目の高さの寄り） |

直し方と罠：
- 舞台は `../name/src/gulliver-ep03-stage.demo.ts` のカメラを変えて house を撮り直し（約1.5分）、`stage-revise.py` で 2-2・6-1 だけを入れた。
- **コマは横に細く、生成した絵（3:2）の上下が切れる。** 1回目の描き直しでは、Codex が足したガリヴァーの顔がコマの上で切れた。2-2・6-1 は「顔を入れない」とラフ・線画の説明に書き、2-2 の線画は「ラフと同じ大きさで写す」を足して3回目で収まった。
- ラフは `rough-briefs.py` の `REVISED_CAMERA`・`REVISED_NOTE`、線画は `ink-briefs.py` の `INK_NOTES` と `INK_ONLY`、仕上げは `finish-mono.py` の `SKY_WHITE`。
- 線画だけ描き直した 11-1・16-1・16-2 は構図がラフと同じなので、ラフからトーンを取った。

```sh
cp part1/read/*.ts part1/name/gulliver-ep0{1,2,3}-name.ts part1/script/gulliver-part1-script.ts $SB/
GM_OUT=/tmp/read npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep03-read.build.test.ts
```

# 第4話「火事」通読

`gm1-ep04-read`（編集の記録）と `gm1-ep04-read-findings`（指摘の表）。はじめに読んだ版は `gm1-ep04-finish@finish-ep04-v1`（コミット b7bc2633、PR #23 のマージ、白黒）、
作者の判断（2026-11-20「おすすめ通り直す」）で直した版 `finish-ep04-v2` を読み直した。ページは `../finish/ep04/pages/`。

作者の判断（2026-11-20「マージして」「完成」）：完成。出版準備は `finish-ep04-v2`（コミット d34fcab、PR #24 のマージ）から作る。

| 指摘 | 対象 | 判断と直し方 |
| --- | --- | --- |
| RV-e04-01 皇帝の顔の濃さがコマで違う | 1-2 8-3 | 直す（仕上げ：`FACE_LIGHT` で顔のトーンを抜く） |
| RV-e04-02 ささやく相手が部屋の反対側 | 5-1 | 直す（ラフから、玉座の脇で耳もとにささやく） |
| RV-e04-03 二人が離れ、上半分が白い壁 | 4-2 | 直す（ラフから、玉座の両脇に近く立つ） |
| RV-e04-04 建物の上に立って見える | 12-1 | 直す（ラフから、地面に立ち低い建物は向こう） |
| RV-e04-05 ナレーションが靴を隠す | 12-2 | 直す（写植：`AVOID_EXTRA` で靴と脛を避ける） |
| RV-e04-06 皇后と侍女が小さく、右半分が壁 | 15-3 | 直す（ラフから、人物をコマの半分ほどに） |
| RV-e04-07 背景の建物が彼より大きい | 16-1 | 直す（ラフから、背景は肩より低い） |
| RV-e04-08 夜空の白いしみ | 13-1 | 直す（仕上げ、`FLAT_BG`） |
| RV-e04-09 周りが地面と空だけ | 9-2 | 意図として残す |
| RV-e04-10 人のいない壁と屋根のコマ | 14-2 15-1 | 意図として残す |

直し方と罠：
- ラフは `rough-briefs.py` の `REVISED_NOTE`、線画は `ink-briefs.py` の `INK_NOTES` と `INK_ONLY`、仕上げは `finish-mono.py` の `FACE_LIGHT`・`FLAT_BG`、写植の避けは `rough-assets.py` の `AVOID_EXTRA`。
- **12-1・16-1 はラフから描き直した**（仕上げのトーンはラフから取るので、線画だけでは合わない）。12-1 は描き直しでも 3D の手前の大きな壁をまた写したので、「1枚目（3D）の手前の大きな壁を写さない」と書いて3回目で収まった。
- 仕上げのトーンはラフから取るので、構図を変えたコマはラフも描き直す。

```sh
cp part1/read/*.ts part1/name/gulliver-ep04-name.ts part1/script/gulliver-part1-script.ts $SB/
GM_OUT=/tmp/read npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep04-read.build.test.ts
```
