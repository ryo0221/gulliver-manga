# 第1話「人の山」ネーム（Editor Platform）

工程定義 `fiction-manga@1.2.0` の「ネーム」（話ごと）の成果物です。コマごとに 3D の舞台（デジタルツイン）で人物とカメラを置き、カメラの絵をコマに敷いています（`storyboard.staged`）。AI の提案で、構図・間・めくりの採否は作者です。正本は `artifacts/` の JSON、文章版は `docs/part1-ep01-name.md` です。

## 成果物

| 資料（`artifacts/`） | Editor | 中身 | 画面 |
| --- | --- | --- | --- |
| `gm1-ep01-name` 第1話ネーム（16ページ） | Design（漫画ワークスペース） | 連動コマ割り（分割木）のページ16枚、56コマ。台詞は楕円の仮の吹き出し、ナレーションは明朝体の枠、擬音は灰色の仮の文字。各コマにタグ（大きさ・カメラ）と絵のメモ。コマの一番下に、3D のカメラの絵をコマの枠に切り抜いたアタリ（濃さ 50%）| `screens/01〜05-*.png`、`pages/page-01〜16.png` |
| `gm1-ep01-name-panels` ネームのコマ表 | Structured Data | 1コマ1行：ページ、コマ、シーン、大きさ、カメラの目と高さ（実寸 mm）、向き、大きさの違いを見せるか、絵、脚本の行、文字にする行、ページの頭（めくり）。3D の舞台：舞台、カメラの位置と注視点（モデルの座標、mm）、画角、人物（FG・人物表・位置・向き・ポーズ）、群衆、モデルの版、アタリ、配置図 | `screens/06-panel-table.png` |

## 3D の舞台（`stage/`）

| ファイル | 中身 |
| --- | --- |
| `stage/ep01-stage.json` | コマごとの舞台の記録：舞台、カメラの位置・注視点・台、コマの枠に切り抜いた画角（横×縦）、人物（FG ID、人物表の ID、位置、向き、ポーズ、背丈）、群衆、モデルが無いコマの理由。舞台ごとのモデルの版（artifactId・versionId・contentHash） |
| `stage/underlay/*.jpg` | コマに敷いたカメラの絵（56コマすべて） |
| `stage/plans/*.svg` | コマごとの真上からの配置図：舞台の形、人物（番号は FG の末尾、赤はガリヴァー）、群衆（灰の点）、カメラ（青い四角）と水平の視野、注視点 |
| `stage/sheets/page-NN.png` | 確認用：ページと、そのコマの配置図を並べたもの |
| `stage/models/<舞台>/` | 舞台を組んだときの版：`cad.json`（地面・仮の3D・運搬機）、`ship.json`・`boat.json`（船と小舟）、`temple.json`（F106 の BIM）、`character.json`（人物のリグとコマごとのキー、カメラのキー） |

舞台は5つです。英国の厩（SC-001）、ブリストルの岸壁（SC-002）、難破の海と浜（SC-003）は、再現（GV1〜GV7）にモデルが無いので、床・壁・海面・岩だけの仮の3D（創作）で人の配置とカメラを決めました。浜の草地（SC-004 と扉）は草地と演説の台（本文：1フィート半）を仮の3Dで作りました。神殿（SC-005）は F106 の BIM をそのまま使い、運搬機（本文：7×4フィート、車輪22、高さ3インチ）、見張りの柱と鍛冶の足場（創作）、塔の南の見晴らし台（創作。F106 の塔は寄棟屋根で人が立てないため）を足しました。人物は F107・F108 の体（ガリヴァー 1,750 mm、小人 146 mm）、馬は F121 の体です。船（アンテロープ号）と小舟も、本文に図が無いので、三本マストの船と5 m の小舟の形だけの仮の3D（創作）にしました。船と小舟はそれぞれ別の CAD の版で、コマごとに位置と傾きを変えます（港に停泊、出航、岩に乗り上げる、小舟の転覆）。船員は人物表に無い端役（`EX`）です。

カメラの高さは 3D の舞台のカメラの高さと同じにしました（テストで確かめます）。仰向けのガリヴァーの胸は、3D の体で測ると地面から 245 mm なので、胸の上の小人の目は 381 mm です（以前の 250 mm・386 mm から直しました）。

`pages/` は確定版の書き出し（`captureDesignPages` の vector、SVG と manifest）と、それを PNG にしたものです。

## 決めたこと（提案）

- 読む方向は左から右（`ltr`）。コマの読み順は、上の段から、段の中は左から右です。見開きは 1–2、3–4… の組で、めくりは奇数ページの頭に来ます。小人の初めての姿（9ページ）と、立ち上がる大ゴマ（15ページ）をめくりの頭に置きました。
- 1ページのコマは2〜6です（スマートフォンで読むため6以内）。台詞の多いシーン（SC-004）は5ページに広げ、ト書きだけのコマ（4ページの出航）も1つ足しました。
- カメラの高さは、地面からの実寸（mm）で書きます。小人の目は 136 mm（ガリヴァーの目 1,630 mm の 1/12）、英国の人の目は 1,600 mm 前後（コマごとに 3D の舞台で決めた高さ）。台の上に立つカメラは、台の高さに目の高さを足します：仰向けのガリヴァーの胸（3D の体で測って 245 mm）の上は 381 mm、神殿の向かいの塔の見晴らし台（本文「5フィート以上」1,524 mm）の上は 1,660 mm、都の城壁（本文「2フィート半」762 mm）の上は 898 mm。台はコマ表の「カメラの立つ台」にあります。大きさの違いを見せるコマ（★、15コマ）はすべて小人の目の高さから撮ります（AR-05）。脚本で「俯瞰」と書いた扉と運搬機のコマ（1ページ1コマ目、13ページ2コマ目）も、AR-05 に合わせて小人の目の高さ（運搬機は柱の上の見張り、創作 1,064 mm の柱の上で 1,200 mm）に変えました。
- 吹き出しの形と尻尾、擬音の字形は仮です。吹き出しは写植（LY-09）、擬音は線画で手描き（LY-08）にします。台詞の文は脚本のままで、変えていません。
- 漫画ワークスペースの「変更提案」（JSON）は、作者の編集中の版と revision に結び付き、吹き出しを新しく足せないため、今回は使いませんでした。ネームは読み込める Design 原稿として渡し、作者が直接直します。
- 3D のカメラの絵はアタリです。ラフの工程では同じ舞台とカメラから下絵（LY-01）を書き出します。

## 確かめていること（`gulliver-ep01-name.build.test.ts`）

- 16ページで、シーンごとのページ数と順が脚本と同じ。
- 脚本の行がすべて、脚本の順に、ちょうど一つのコマに入る（シーンの網羅）。ナレーション・台詞・擬音は、すべて原稿の文字になっている。
- 読む方向が左から右で、コマの読み順が上の段から左から右。1ページのコマは6以内。
- 1ページ目の最初のコマが、大きさの違いを見せる大引き。大きさの違いを見せるコマのカメラはすべて小人の目の高さ（AR-05）。
- 胸・塔・城壁・柱・足場の上のカメラは、台の高さに小人の目の高さを足した値（地面から）。
- SC-004（目覚め）では、自由なのは左腕だけ。カメラの向きと絵のメモに右手・右腕が出てこない。
- 文字の枠と吹き出しが、コマの多角形の内側に（境から 6 以上離れて）入り、同じコマの中で重ならない。文字はどれも、描画と同じ組版で枠に収まる（はみ出す行が無い）。
- 舞台で組む（fiction-manga@1.2.0 `storyboard.staged`）：どのコマにも舞台の記録があり、舞台がそのシーンのもので、モデルの版（versionId と contentHash）が書いてある。カメラの高さがコマ表の目の高さと 1 mm 以内で同じ。台の上のカメラには台がある。配置図がある。人物はどれも FG ID と、人物表の ID（端役は `EX`）を持つ。モデルのあるコマはカメラの絵がコマと同じ枠でコマの一番下に敷かれ、画像の出所が書いてある。モデルの無いコマは理由がある。大きさの違いを見せるコマはすべてモデルのある舞台で組む。
- 16ページを vector で書き出せて、エラーの診断が無い。

## 作り直し方

`story/editor/README.md` と同じ手順です。`gulliver-part1.ts`、`gulliver-story.ts`、`gulliver-part1-script.ts` と一緒に、このフォルダの `.ts` を editor-platform の `apps/artifact-host/src/creative/story-board/` へコピーして実行します。

```sh
cp part1/editor/gulliver-part1.ts story/editor/gulliver-story.ts part1/script/gulliver-part1-script.ts part1/name/*.ts $SB/
GM_OUT=/tmp/name npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep01-name.build.test.ts
npx vite --host 127.0.0.1 --port 4231 --strictPort &
cp <gm>/part1/name/gulliver-ep01-name-screens.mjs ./gm-name-screens.tmp.mjs   # playwright を解決するため ep の中で実行する
node gm-name-screens.tmp.mjs /tmp/name/name-editor.json /tmp/name/screens
```

舞台は Playwright の demo で組みます（Playground、キャラクター編集）。`src/` を editor-platform に置き、CAD のカーネルを指定して実行してから、カメラの絵と配置図を作ります。

```sh
mkdir -p tests/demo && cp <gm>/part1/name/src/gulliver-ep01-stage.demo.ts tests/demo/ && cp <gm>/part1/name/src/gulliver-ep01-stage.config.ts gm-stage.config.ts
CAD_OCCT_DIST=$PWD/work/cad-kernel STAGE_OUT=/tmp/stage npx playwright test -c gm-stage.config.ts --trace off   # 5つの舞台、約4分
python3 <gm>/part1/name/src/stage-assets.py /tmp/stage <gm>/part1/name/artifacts/gm1-ep01-name.artifact.json <gm>/part1/name/stage   # カメラの絵・配置図・記録と、モデルの版（models/）を書く
cp -r <gm>/part1/name/stage $SB/gulliver-ep01-stage   # ネームのテストが読む
python3 <gm>/part1/name/src/name-doc.py <gm>/part1/name/artifacts/gm1-ep01-name-panels.artifact.json <gm>/part1/name/stage/ep01-stage.json <gm>/docs/part1-ep01-name.md
```

画面は、漫画ワークスペースのページ（1・9・15）、見開き（8–9）、通読、コマ表です。2026-11-14 に実行し、5つの舞台の demo、ネームと脚本のテストが通り、画面を 6 枚書き出しました。

## 第2話「綱渡りの宮廷」（完成）

`gulliver-ep02-name.ts`（16ページ・48コマ、`name-ep02-v1`）。成果物は `artifacts/gm1-ep02-name`（Design）と `artifacts/gm1-ep02-name-panels`（コマの表）、ページの絵は `ep02/pages/` です。舞台は `src/gulliver-ep02-stage.demo.ts` の3つ（court：古い神殿の前の広場、council：会議の間、city：都ミルデンドウ F105 と王宮）で、記録は `stage/ep02-stage.json` です。

- 第1話の学び LN-e01-01（コマの主役が枠に入っているか）を、舞台のカメラの絵で確かめてから組みました。
- 都の舞台は F105 の BIM が大きく、キャラクター編集の「Ready」のあとも計算が続きます。撮影の前に、すべてのプロップが表示されるまで待ちます。
- 皇后の窓のコマ（15〜16ページ）は、F105 の王の住まい（中央の10フィート四方）の南の壁の窓（4×6インチ）に合わせました。3D の窓のガラスは不透明なので、窓の外のガリヴァーの目は 3D の絵には写りません（ラフで描く）。
- ネームの確認のあと、カメラの絵で主役が見えなかった4コマを撮り直しました（2026-11-14）：扉 1-1（ガリヴァーの顔と手のひらの小人が両方入るよう引いた）、8-1（ボルゴラムが手前に入るよう低く引いた）、11-1（丘の東の端から）、16-2（王宮の外や丘からは壁でガリヴァーが隠れるので、内庭の地面からの「引き」に変えた）。ラフの段階で、主役が枠から外れていた 11-2・15-1、座るガリヴァーの頭が枠の外だった 2-1、吹き出しの余白が無かった 6-2・8-2・8-3 のカメラも直しました（`../rough/README.md`）。寝そべるガリヴァー（`PRONE`）の `at` は足の位置で、前の版では体が宮殿の壁の中に埋まっていたので、頭が窓の外に来るよう南へ動かしました。

```sh
CAD_OCCT_DIST=$PWD/work/cad-kernel STAGE_OUT=/tmp/stage2 npx playwright test -c gm-stage2.config.ts --trace off   # 3つの舞台、約12分
GM_NO_STAGE=1 GM_OUT=/tmp/name2 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep02-name.build.test.ts   # 先にページだけ
python3 <gm>/part1/name/src/stage-assets.py /tmp/stage2 /tmp/name2/artifacts/gm1-ep02-name.artifact.json <gm>/part1/name/stage 2
cp -r <gm>/part1/name/stage $SB/gulliver-ep02-stage
GM_OUT=/tmp/name2 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep02-name.build.test.ts
```

## 第3話「卵の端」（下書き、作者の確認待ち）

`gulliver-ep03-name.ts`（16ページ・46コマ、`name-ep03-v1`）。成果物は `artifacts/gm1-ep03-name`（Design）と `artifacts/gm1-ep03-name-panels`（コマの表）、ページの絵は `ep03/pages/` です。舞台は `src/gulliver-ep03-stage.demo.ts` の4つで、記録は `stage/ep03-stage.json` です。

- house：ガリヴァーの住まい（F106）。寝そべるガリヴァーの手のひらにレルドレサルが立つ。ポーズは `src/gulliver-stage-poses.ts`（第2話のポーズに、prone-palm・望遠鏡・水を歩く・曳く などを足した）。
- strait：幅800ヤードの海峡とリリパット・ブレフスキュの両岸（引きのコマだけ）。
- coast / fleet：海峡のうち、リリパットの岸と艦隊のまわりだけを切り出した舞台。1.3 km の海峡を1つの舞台にすると、カメラの手前の切り取り面（全体の大きさの1/1000）が数メートルになり、寄りのコマで人物が切れるためです。
- 艦隊50隻は、1隻を船体・帆柱・帆2枚の箱4つにし、色ごとに1つのボディにまとめました（CAD の上限：フィーチャー256、ボディ64）。
- 第2話の学び LN-e02-01〜06 は、作者の選択（2026-11-17「全部いれてください」）で全部採りました。ネームでは次のように入れ、テストで確かめています。
  - LN-e02-01・05：引き・大引きのコマで、ガリヴァーの頭のてっぺん（FK の頭の位置 + 120 mm）が枠の中にあり、上にコマの1割の余白があること。地図のコマ 7-2 は、小山のガリヴァーが枠の外だったので、両岸と小山が入るよう撮り直しました。
  - LN-e02-02：顔の一部だけを見せる覚え書きを書かない。
  - LN-e02-03：大きさの違うコマの覚え書きに、3D の舞台で測った数字を【大きさ（3D）】として書く。
  - LN-e02-04：綱・矢の覚え書きに、太さの比べと両端を【細い物】として書く。
  - LN-e02-06（FLAT_BG、ラフの描き直し）はラフと仕上げの工程で使います。
- ポーズの `at` は腰の位置です。頭・目・手のひらの位置は `posePoint`（FK）で求め、`ep03-stage.json` の `points` に残しています。

```sh
cp <gm>/part1/name/src/gulliver-ep03-stage.demo.ts <gm>/part1/name/src/gulliver-stage-poses.ts tests/demo/
cp <gm>/part1/name/src/gulliver-ep03-stage.config.ts gm-stage3.config.ts
CAD_OCCT_DIST=$PWD/work/cad-kernel STAGE_OUT=/tmp/stage3 npx playwright test -c gm-stage3.config.ts --trace off   # 4つの舞台、約5分（STAGE_SETS=coast,fleet で一部だけ）
GM_STAGE=/nonexistent GM_NO_STAGE=1 GM_OUT=/tmp/name3 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep03-name.build.test.ts   # 先にページだけ
python3 <gm>/part1/name/src/stage-assets.py /tmp/stage3 /tmp/name3/artifacts/gm1-ep03-name.artifact.json <gm>/part1/name/stage 3
cp -r <gm>/part1/name/stage/. $SB/gulliver-ep03-stage/
GM_OUT=/tmp/name3 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep03-name.build.test.ts
```
