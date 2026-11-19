# 第1話「人の山」線画（Editor Platform）

工程定義 `fiction-manga@1.3.0` の「線画」（ページごと）の成果物です。ラフ `gm1-ep01-rough@rough-ep01-v2` と同じ16ページ・56コマ（コマの ID はそのまま）に、コマごとの線画を入れました。線画は、作者が採ったラフ絵と 3D の舞台のカメラの絵を Codex の画像生成に渡し、ラフをなぞって描かせたものです。AI の提案で、線・細部・人物の比率・コマどうしのつながりの確認（`ink.approved`）と直しは作者です。

## 成果物

| 資料（`artifacts/`） | Editor | 中身 | 画面 |
| --- | --- | --- | --- |
| `gm1-ep01-ink` 第1話線画（16ページ） | Design（漫画ワークスペース） | ラフと同じコマ割り。コマごとにレイヤーのグループ：`LY-01 下絵（3D）`・`LY-02 アタリ`（ラフ絵）は隠して残し、その上に `LY-04 背景の線画`・`LY-07 人物の線画`・`LY-08 効果`、`LY-10 文字（仮）`、`メモ`。絵のレイヤーとメモは固定。吹き出しとナレーションの枠は、ラフと同じく1つずつ `LY-09 …` のグループ（枠と文字を一緒に）で、エディタでクリックしてそのまま動かせる | `screens/01〜05-*.png`、`pages/page-01〜16.png` |
| `gm1-ep01-ink-pages` 線画のページ表 | Structured Data | 1ページ1行：コマ、作画の方法、もとにしたラフ（パスと sha256）と 3D の舞台の版、渡した設定画（コミット・パス・sha256）、レイヤー、決まりに無い・まとめたレイヤーの理由、人と AI のどちらのレイヤーか、生成の道具と版・渡した参照・出典と利用条件、効果の線のあるコマ、背景の線の無いコマ | `screens/06-page-table.png` |

吹き出しを動かす様子：`screens/08-drag-balloon.png`（9ページ3コマの「うおっ！」をドラッグすると、枠と尾と文字が一緒に動く）、`screens/09-drag-drawing.png`（絵の上をドラッグしても線画は動かない）。

## 線画の描き方

1. `../rough/src/rough-briefs.py` で、ラフと同じコマごとの説明・カメラの絵（`layout.png`）・設定画の一覧・生成の大きさを作ります。
2. `src/ink-briefs.py`：採ったラフ絵（`../rough/panels/`）を同じ生成の大きさに灰色の余白で合わせ（`rough.png`）、ラフのときのコマの説明（作者の確認で足した直し、たとえば13ページの車輪は片側11）をそのまま使います。作者の確認で残っていた直し（15ページ1コマの左足の鎖）を足しました。
3. `src/gen-ink.sh`（`src/run-ink.sh` で5つずつ）：Codex CLI 0.169.0 の画像生成で1コマに1枚。1枚目にラフ絵（構図をなぞる）、2枚目に 3D のカメラの絵（比率と遠近）、続けて設定画を渡します。**3色のペンで描かせます**：人物と動物（持ち物、体に付いた鎖や縄も）は黒、それ以外の背景（建物・地面・海・空・船・小道具）は青、効果の線は赤。プロンプトは `prompts/` にあります。56コマとも1回で描けました（約55分）。12ページ5コマは、作者の確認で「顔が切れていて不自然」（片目だけが大きく枠で切れ、端に草）だったので、ラフの切り取りではなく 3D のカメラの絵に合わせ、両目・眉・鼻の付け根を、耳と髪まで枠に入れて描き直しました（`src/ink-briefs.py` の直しの説明）。
4. `src/ink-assets.py`：生の出力をコマの枠に切り戻し（長い辺 900 px）、色でレイヤーに分けます。どのレイヤーも黒い線で、線の濃さを透明度（4段）にした PNG です（`layers/<コマ>-LY-04/07/08.png`）。確かめる用の合成（人物は黒、背景は青、効果は赤）が `panels/` です。生の出力は大きいので commit せず、sha256 を `ep01-ink.json` に残しました。
5. 仕上げで作者が「背景を描いて」（2026-11-14）と指摘した、背景が白いままの5コマ（2-2・3-4・6-1・8-4・11-5）：`src/bg-briefs.py` が3色の線画と舞台の説明を用意し、`src/gen-bg.sh` で Codex に背景だけを青で描き足させ、`src/bg-merge.py` が人物の線に合わせて（アフィン変換）青い線だけを LY-04 に入れます。人物の線（LY-07）と効果（LY-08）は変えていません。6-1 と 11-5 は元の海と梯子の線を残して白かったところにだけ足し、ほかは LY-04 を置き換えました。プロンプトは `prompts/<コマ>-background.txt`、記録は `ep01-ink.json` の `background` です。
5. Design 原稿は Playground の読み込みの上限（16 MB）に収めるため、隠す LY-01 と LY-02 を長い辺 480 px に縮めた写し（`hidden/`）にしました。原稿は 12.6 MB です。

## 確かめていること（`gulliver-ep01-ink.build.test.ts`）

- ページとコマがネーム・ラフと同じで、56コマすべてに線画がある。
- `ink.layers`：どのコマにも、LY-01・LY-02・LY-04・LY-07・LY-08・LY-10・メモのグループが重ね順のとおりにあり、LY-01 と LY-02 は隠れていて、絵のレイヤーとメモは固定されている。LY-04・LY-07・LY-08 はそれぞれコマと同じ枠の PNG 1枚で、生成の道具と版・ラフの版・sha256・利用条件が付いている。人物が枠に入るコマは人物の線がある。背景の線の無いコマはページ表にその理由とともに書いてある。
- どのページにも、ラフ（パスと sha256）・設定画の固定した版または無い理由・生成の記録がある。ガリヴァー・小人・皇帝を描いたコマは、その設定画を渡している。
- 吹き出し・ナレーションの枠は1つずつ動かせるグループで、台詞はすべて入っている。`lettering.clear`：吹き出し・枠・擬音が、3D のカメラに写る人物の頭の中心に被っていない。
- 16ページを vector で書き出せて、エラーの診断が無い。書き出しにメモの文字も隠したラフ絵も出ない。原稿は 16 MB 未満。

## 決めたこと（提案）

- **レイヤーは色で分けました。** Codex は1コマを1枚で描くので、3色で描かせて後で分けました。人物が手に持つ物と体に付いた鎖・縄は人物（LY-07）です。人物と背景が重なる境目では、線がもう一方に入っていることがあります。
- **LY-08 効果は提案です。** 画作りガイドでは効果は人の描くレイヤーです。赤で描かれた効果の線（2-2 の鼻息、5-2、10-2、10-4 の矢の線、13-3、14-3）は AI の提案として入れました。採るか描き直すかは作者です。手書きの擬音も作者が LY-08 に描きます。それまで擬音は LY-10 の仮の文字です。
- 背景の線の無いコマが6つあります（3-4、8-4、10-1、10-2、10-4、11-4）。人物だけの寄りか、ガリヴァーの体が地面になるコマです。LY-04 のグループは空の画像のまま残しました。
- 吹き出しの位置はラフのままです（作者が動かした位置を変えないため）。

## 作者に見てほしいところ

- **15ページ**：1コマは直しのとおり左足に鎖があります。2コマは両足に鎖が描かれていて、1コマと合いません。
- **1ページ1コマ（扉）**：ラフと同じく、胸の上の小人は弓の先だけです（ネームの舞台のカメラの直しが要るまま）。
- **13ページ3コマ**：運搬機の車輪が手前で大きく、片側に4つしか見えません（枠で切れています）。
- 線の太さ・顔の描き方・小人の大きさ（AR-01）は、コマごとに少しずつ違います。

## 作り直し方

ラフと同じ手順です。`$W` は作業用のフォルダ、`$SB` は editor-platform の `apps/artifact-host/src/creative/story-board/` です。

```sh
python3 part1/rough/src/rough-briefs.py part1/name/artifacts/gm1-ep01-name-panels.artifact.json part1/name/stage/ep01-stage.json part1/name/stage/underlay $W
python3 part1/ink/src/ink-briefs.py $W part1/rough
PAR=5 bash part1/ink/src/run-ink.sh $W            # Codex にサインインしておく。56コマで約1時間
python3 part1/ink/src/ink-assets.py $W $(git rev-parse HEAD) part1/ink
cp part1/editor/gulliver-part1.ts story/editor/gulliver-story.ts part1/script/gulliver-part1-script.ts part1/name/gulliver-ep01-name.ts part1/rough/gulliver-ep01-rough.ts part1/ink/*.ts $SB/
cp -r part1/name/stage $SB/gulliver-ep01-stage; cp -r part1/rough $SB/gulliver-ep01-rough; cp -r part1/ink $SB/gulliver-ep01-ink
GM_OUT=/tmp/ink npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep01-ink.build.test.ts
node gm-ink-screens.tmp.mjs /tmp/ink/ink-editor.json /tmp/ink/screens   # Playground の dev server（:4231）が要る
```

`pages/` は `captureDesignPages`（vector）で書き出した SVG を PNG にしたものと manifest です。

# 第2話「綱渡りの宮廷」線画

工程定義 `fiction-manga@1.3.0` の「線画」です。ラフ `gm1-ep02-rough@rough-ep02-v1` と同じ16ページ・48コマに、第1話と同じ方法（ラフ絵と 3D のカメラの絵と設定画を Codex に渡し、黒・青・赤の3色で描かせて色で分ける）で線画を描きました。成果物は `artifacts/gm1-ep02-ink`（Design、13.0 MB）と `gm1-ep02-ink-pages`（ページ表）、記録は `ep02-ink.json`、ページの絵は `ep02/pages/` です。AI の提案で、線・細部・人物の比率・つながりの確認（`ink.approved`）と直しは作者です。

- 48コマとも1回で描けました（約50分）。指示は、ラフのときの説明（第1話の学び：続く状態・大きさの比べ・背景・顔を切らない）をそのまま使い、12-2 には作者の確認（2026-11-15「上着を脱いだままでいい」）を足しました。
- 第1話の学び LN-e01-03：**背景の線の無いコマはありません**（どのコマも青い線がコマの線の 17% 以上）。
- 効果の線（赤）は 13-2 と 15-1 にだけ少しあります（AI の提案）。
- 道具は話の番号で選びます：`ink-briefs.py`・`ink-assets.py` は `EPISODE=2`、`ink-assets.py` は隠す LY-01・LY-02 の写し（`hidden/`、長い辺 480 px）も作ります。`gulliver-ep01-ink.ts` の `buildEpisodeInk`・`pageTable` は話を受け取れるようにしました（第1話の資料は同じ JSON のまま）。

```sh
python3 part1/rough/src/rough-briefs.py part1/name/artifacts/gm1-ep02-name-panels.artifact.json part1/name/stage/ep02-stage.json part1/name/stage/underlay $W
EPISODE=2 python3 part1/ink/src/ink-briefs.py $W part1/rough
PAR=5 bash part1/ink/src/run-ink.sh $W $(cd $W && ls -d e02-*)
EPISODE=2 python3 part1/ink/src/ink-assets.py $W $(git rev-parse HEAD) part1/ink
cp part1/name/gulliver-ep0[12]-name.ts part1/rough/*.ts part1/ink/*.ts $SB/
cp -r part1/name/stage $SB/gulliver-ep02-stage; cp -r part1/rough $SB/gulliver-ep02-rough; cp -r part1/ink $SB/gulliver-ep02-ink
GM_OUT=/tmp/ink2 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep02-ink.build.test.ts
node gm-svg2png.tmp.mjs /tmp/ink2/pages /tmp/ink2/png
```

# 第3話「卵の端」線画

ラフ `gm1-ep03-rough@rough-ep03-v1`（16ページ・46コマ）に、第2話と同じ方法で線画を描きました。成果物は `artifacts/gm1-ep03-ink`（Design、11.4 MB）と `gm1-ep03-ink-pages`、記録は `ep03-ink.json`、ページの絵は `ep03/pages/` です。AI の提案で、確認（`ink.approved`）と直しは作者です。

- 46コマとも1回で描けました（約15分）。指示はラフのときの説明（第2話の学び：続く状態・大きさ・顔を切らない・細い物・頭の上の余白）をそのまま使いました。
- **背景の線の無いコマはありません。** 効果の線（赤）は 4-4・11-1・13-2 にだけ少しあります（AI の提案）。
- 3-1 だけ描き直しました。ラフのとおりにガリヴァーの顎の先だけが枠の上に残り、顔が切れていたためです（作者の決まり、LN-e02-02）。3D のカメラのとおり頭を枠の外に出し、枠の上の端が首巻きを横切るようにしました（`src/ink-briefs.py` の `INK_NOTES`）。

```sh
EPISODE=3 python3 part1/ink/src/ink-briefs.py $W part1/rough      # $W はラフの作業場所（rough-briefs.py の出力）
PAR=5 bash part1/ink/src/run-ink.sh $W $(cd $W && ls -d e03-*)
EPISODE=3 python3 part1/ink/src/ink-assets.py $W $(git rev-parse HEAD) part1/ink
cp part1/name/gulliver-ep0[123]-name.ts part1/rough/*.ts part1/ink/*.ts $SB/
mkdir -p $SB/gulliver-ep03-ink; cp -r part1/ink/ep03-ink.json part1/ink/layers part1/ink/hidden part1/ink/panels part1/ink/prompts $SB/gulliver-ep03-ink/
GM_OUT=/tmp/ink3 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep03-ink.build.test.ts
node gm-svg2png.tmp.mjs /tmp/ink3/pages /tmp/ink3/png
```

# 第4話「火事」線画

ラフ `gm1-ep04-rough@rough-ep04-v1`（16ページ・37コマ、作者確認済み 2026-11-19「よいと思います」）に、第3話と同じ方法で線画を描きました。成果物は `artifacts/gm1-ep04-ink`（Design、10.8 MB）と `gm1-ep04-ink-pages`、記録は `ep04-ink.json`、ページの絵は `ep04/pages/` です。AI の提案で、確認（`ink.approved`）と直しは作者です。

- 37コマとも1回で描けました（約12分）。指示はラフのときの説明（第3話までの学び：続く状態・明かり・大きさ・顔を切らない・頭の上の余白・細い段）をそのまま使いました。描き直しはありません。
- **背景の線の無いコマはありません。** 効果の線（赤）は描かれませんでした。炎・湯気・煙は背景の線（青）として描かれています。

```sh
EPISODE=4 python3 part1/ink/src/ink-briefs.py $W part1/rough      # $W はラフの作業場所（rough-briefs.py の出力）
PAR=5 bash part1/ink/src/run-ink.sh $W $(cd $W && ls -d e04-*)
EPISODE=4 python3 part1/ink/src/ink-assets.py $W $(git rev-parse HEAD) part1/ink
cp part1/name/gulliver-ep04-name.ts part1/rough/*.ts part1/ink/*.ts $SB/
mkdir -p $SB/gulliver-ep04-ink; cp -r part1/ink/ep04-ink.json part1/ink/layers part1/ink/hidden part1/ink/panels part1/ink/prompts $SB/gulliver-ep04-ink/
GM_OUT=/tmp/ink4 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep04-ink.build.test.ts
node gm-svg2png.tmp.mjs /tmp/ink4/pages /tmp/ink4/png
```
