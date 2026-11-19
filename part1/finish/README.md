# 第1話「人の山」仕上げと写植（Editor Platform）

工程定義 `fiction-manga@1.3.0` の「仕上げと写植」の成果物です。線画 `gm1-ep01-ink@ink-ep01-v3` と同じ16ページ・56コマ（コマの ID はそのまま）に色を付け、吹き出しと文字を入れました。線は作者が採った線画のままで、その下に塗りと影を敷いています。塗りは AI の提案です。トーン・塗り・影・効果の確認（`finish.approved`）と、台詞の全文と吹き出しの形・書体・位置の確認（`lettering.approved`）は作者です。

## 成果物

| 資料（`artifacts/`） | Editor | 中身 | 画面 |
| --- | --- | --- | --- |
| `gm1-ep01-finish` 第1話仕上げ（16ページ） | Design（漫画ワークスペース） | コマごとに画作りガイドの重ね順でレイヤーのグループ：`LY-03 背景の塗り`・`LY-04 背景の線画`・`LY-05 人物の塗り`・`LY-06 影`・`LY-07 人物の線画`・`LY-08 効果`・`LY-10 文字`・`メモ`。絵のレイヤーとメモは固定。吹き出しとナレーションの枠は1つずつ `LY-09 …` のグループ（枠と文字を一緒に）で、エディタでドラッグして動かせる | `screens/01〜05-*.png`、`pages/page-01〜16.jpg` |
| `gm1-ep01-finish-pages` 仕上げのページ表 | Structured Data | 1ページ1行：コマ、仕上げの方法、もとにした線画の版、渡した設定画（コミット・パス・sha256）、レイヤー、決まりに無い・まとめたレイヤーの理由、人と AI のどちらのレイヤーか、生成の道具と版・渡した参照・出典と利用条件、影の無いコマ | `screens/06-page-table.png` |
| `gm1-ep01-lettering` 写植の記録 | Structured Data | 吹き出し・ナレーションの枠・擬音・題ごとに1行（44行）：コマ、入れる台詞（`gm1-script-lines@script-v1` の行 ID）、種類、話す人、文字、吹き出しの形、書体と大きさ、横書き、位置、顔と要所を避けたか | `screens/07-lettering.png` |

吹き出しを動かす様子：`screens/08-drag-balloon.png`（9ページ3コマの「うおっ！」をドラッグすると枠と尾と文字が一緒に動く）、`screens/09-drag-drawing.png`（絵の上をドラッグしても絵は動かない）。

## 塗りの作り方

1. `src/finish-briefs.py`：採った線画の3枚の線（LY-04・LY-07・LY-08）を黒で重ねた絵を、線画と同じ生成の大きさに白い余白で合わせます（`lines.png`）。
2. `src/gen-finish.sh`（`src/run-finish.sh` で5つずつ）：Codex CLI 0.169.0 の画像生成で、線画に色を塗った「色の見本」を1コマ1枚作ります。渡すのは線の絵と、そのコマの人物・場所の採用した設定画（色付き）です。プロンプトには、線を動かさないこと、アニメ塗り（地色と、光の反対側に一段暗い影）、第1部の基調色（AR-04：煉瓦と草）、ガリヴァーの服（AR-06：青い上着、真鍮のボタン、縁取り無し）を書いています。プロンプトは `prompts/` にあります。
3. `src/finish-assets.py`：色の見本から、線画の下に敷く塗りを作ります。
   - Codex は線を少し描き直すので、見本を線画の位置へ合わせます（線の絵どうしのオプティカルフロー、OpenCV の DIS）。
   - 線画の線で区切られた領域を求めます。各画素は見本の色を取ります。同じ領域の同じ色合いのうち、明るいところより目立って暗い画素を影とし、LY-06 に半透明の影の色で入れ、塗りの側はその画素を明るい色に戻します。
   - 領域を囲む線の多くが人物の線（LY-07）なら人物の塗り（LY-05）、そうでなければ背景の塗り（LY-03）です。線の下の画素は、いちばん近い領域の色にして、線の際に白が出ないようにしました。
   - 塗りと影は、透明度付きの WebP（非可逆）にしました（`layers/`）。線の3枚は、線画の PNG と同じ画素のまま可逆の WebP にした写しを使います（`lines/`）。どちらも Playground の読み込みの上限（16 MB）に収めるためで、原稿は 12.5 MB です。確かめる用の合成が `panels/` です。
4. 8ページ1コマ（髪を杭と紐で地面に留められた顔の真上から）は、Codex の画像の道具に自傷の内容として2回断られました（場面の説明を足しても同じでした）。このコマだけは人物の線（LY-07）だけを渡し、まわりは草の緑で塗るよう頼んで描けました。線画の線（紐と杭と草）はそのまま残っています。

## 写植

- 台詞・ナレーション・擬音・題は、ネームから同じ位置のままです。吹き出しと枠は、ラフで決めたとおり、3D のカメラに写る人物の頭とラフの線の濃いところを避けて置いています。気になる位置はエディタで動かせます。
- 書体：台詞はゴシック（叫びは太字）、ナレーションと題は明朝、擬音はゴシックの太字。どれも横書き（Editor の漫画ワークスペースは縦書きとルビを持たないため、企画で横書きに決めています）。
- 題と擬音は、色の上でも読めるよう白い縁取りを付けました（文字を8方向にずらした白い文字を下に敷く。縁取りと文字は一つのグループ）。擬音は画作りガイドでは手書きで LY-08 に描くので、作者が描くまでの仮の文字です。

## 確かめていること（`gulliver-ep01-finish.build.test.ts`）

- `finish.layers`：どのコマにも LY-03・LY-04・LY-05・LY-06・LY-07・LY-08・LY-10・メモのグループが重ね順のとおりにあり、絵のレイヤーとメモは固定、LY-10 と吹き出しは動かせる。LY-09 は台詞かナレーションのあるコマにある。
- `finish.generated-sourced`：塗り・影・線のどの画像にも、生成の道具と版・線画の版・sha256・利用条件が付いている。どのページにも、線画・設定画の固定した版または無い理由・生成の記録がある。
- `lettering.traced`：写植の記録のどの行も、この話のコマと、固定した版の脚本の台詞の行を引用していて、文字は脚本と同じ。
- `lettering.covered`：第1話の脚本の台詞・ナレーション・擬音の行はすべて、どれかの吹き出しや文字に入っている（ト書きは絵で見せるので入れない）。辞書で使わないと決めた表記が無い。
- `lettering.clear`：吹き出し・枠・擬音が、3D のカメラに写る人物の頭の中心に被っていない。
- 16ページを vector で書き出せて、エラーの診断が無い。書き出しにメモの文字が出ない。原稿は 16 MB 未満。

## 作者に見てほしいところ

- **背景を描き足したコマ**（作者「背景を描いて」、2026-11-14）：2-2（厩の板壁・屋根・干し草・藁の床）、3-4（ブリストルの岸壁・港・帆船・空）、6-1（嵐の空と雨）、8-4・11-5（リリパットの空と遠くの林と浜）。背景の線は `part1/ink/src/bg-briefs.py`→`gen-bg.sh`→`bg-merge.py` で線画（LY-04）に足し、人物の線（LY-07）と効果（LY-08）は変えていません。6-1 と 11-5 は元の海と梯子の線を残し、白かったところにだけ足しました。2-2 は以前の草地のような地面を厩の藁に描き直したので、馬の鼻先が栗毛になりました（3D の舞台では栗毛の馬が手前）。
- **影**：影は色の見本の暗いところを取り出したものなので、コマによって量が違います。3-1 と 11-3 は影がほとんど取れていません（ページ表の「影の無いコマ」）。
- **8ページ1コマ**の杭は木の色でなく草の緑になっています。
- 小人の服の色（赤い上着が多い）、メアリーの服、皇帝の緑の服は、設定画が無い人物は Codex の提案のままです。

## 作り直し方

```sh
# $W は線画のときの作業用フォルダ（rough-briefs.py と ink-briefs.py の出力）、$SB は editor-platform の story-board
# 背景を描き足すコマ（bg-briefs.py の BG_NOTES）は、先に線画の LY-04 を作り直す
python3 part1/ink/src/bg-briefs.py $W part1/ink && for p in e01-p02-k2 e01-p03-k4 e01-p06-k1 e01-p08-k4 e01-p11-k5; do bash part1/ink/src/gen-bg.sh $W/$p; done
python3 part1/ink/src/bg-merge.py $W part1/ink $(git rev-parse HEAD)
python3 part1/finish/src/finish-briefs.py $W part1/ink
PAR=5 bash part1/finish/src/run-finish.sh $W            # Codex にサインインしておく。56コマで約1時間
pip install scipy opencv-python-headless
python3 part1/finish/src/finish-assets.py $W part1/ink $(git rev-parse HEAD) part1/finish
cp part1/editor/gulliver-part1.ts story/editor/gulliver-story.ts part1/script/gulliver-part1-script.ts part1/name/gulliver-ep01-name.ts part1/rough/gulliver-ep01-rough.ts part1/ink/gulliver-ep01-ink.ts part1/finish/*.ts $SB/
cp -r part1/name/stage $SB/gulliver-ep01-stage; cp -r part1/rough $SB/gulliver-ep01-rough; cp -r part1/ink $SB/gulliver-ep01-ink; cp -r part1/finish $SB/gulliver-ep01-finish
mkdir -p $SB/gulliver-part1-artifacts; cp part1/script/artifacts/*.json part1/editor/artifacts/gm1-terms.artifact.json $SB/gulliver-part1-artifacts/
GM_OUT=/tmp/finish npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep01-finish.build.test.ts   # 他の話のテストと同じ GM_OUT にしない
node svg2png.mjs /tmp/finish/pages /tmp/finish/png
node gm-finish-screens.tmp.mjs /tmp/finish/finish-editor.json /tmp/finish/screens   # Playground の dev server（:4231）が要る
```

`pages/` は `captureDesignPages`（vector）で書き出した SVG を画像にしたもの（JPEG）と manifest です。

# 第2話「綱渡りの宮廷」仕上げと写植（白黒）

第2話から白黒にした（トークンの節約のため。第1話はカラーのまま）。仕上げのための画像生成は無い。

- 原稿 `artifacts/gm1-ep02-finish.artifact.json`（16 ページ、9.3 MB）、ページ表 `gm1-ep02-finish-pages`、写植の記録
  `gm1-ep02-lettering`。もとは線画 `gm1-ep02-ink@ink-ep02-v1`。ページの画像は `ep02/pages/`。
- レイヤーと重ね順、動かせる吹き出し、写植の決まりは第1話と同じ（`gulliver-ep01-finish.ts` を話ごとに使えるようにした。
  第1話の成果物は変わらない）。

## トーンの作り方（`src/finish-mono.py`）

1. 採ったラフ（`part1/rough/panels/<コマ>.jpg`、鉛筆の絵で線画と同じ大きさ）を、第1話の色の見本と同じオプティカルフローで
   線画の位置へ合わせ、ぼかして（σ 2.5）鉛筆のハッチングを均した。コマごとに、紙を白、いちばん濃い鉛筆を黒に近く伸ばした。
2. 線の間の領域ごとに、明るいところ（80 パーセンタイル）の濃さを、白・10・20・32・45 % の段階のグレーにした（スクリーントーンの代わり）。
3. 領域の中で明るいところより暗いところ（0.88 倍より暗い）を影にし、LY-06 に半透明の濃いグレーで、ひとかたまりごとに一つの濃さで置いた。
   小さすぎるかたまりは捨てた。
4. 人物（LY-05）か背景（LY-03）かは、第1話と同じく領域を囲む線の種類で決めた。

## 通読の直し

- RV-e02-03（`finish-ep02-v2`）：評議の間の 6-1・6-3・7-1 で、壁と卓にまだらのグレーと白い点が出た。`FLAT_BG` のコマでは、背景と広い領域（壁・卓の面）に影を付けず、トーンを強くぼかしたラフ（σ 30）から取り、木目で細かく分かれた小さな領域にもトーンを付けた。
- 線画を描き直したコマ（`finish-ep02-v3`）：7-4・16-1 はラフも描き直したのでラフからトーンを取った。3-1・11-1・11-2・16-2 は線画だけを描き直し、前のラフと構図が合わないので、`INK_TONE` で線画の線と斜線の濃さからトーンを取った（他のコマより明るい）。
- 線を描き直していないコマは前と同じ画素（参照のコミットも前の記録のまま）。

## 作者に見てほしいところ

- トーンの濃さはラフの鉛筆に従うので、ラフで濃く塗った壁などは濃いグレーになる。段階や明るさは `LEVELS` で変えられる。
- 影はラフの陰影から取ったもので、光の向きはコマごとに揃っていないことがある。

## 作り直し方

```sh
EPISODE=2 python3 src/finish-mono.py <gulliver-manga のコミット>   # layers/ lines/ panels/ ep02-finish.json
# $SB に gulliver-ep01/02-finish*.ts と gulliver-ep02-finish/（ep02-finish.json・layers・lines）を置いて
GM_OUT=/tmp/fin2 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep02-finish.build.test.ts
```

# 第3話「卵の端」仕上げと写植（白黒）

第2話と同じ白黒の作り（`src/finish-mono.py`、画像生成なし）。もとは線画 `gm1-ep03-ink@ink-ep03-v1`。

- 原稿 `artifacts/gm1-ep03-finish.artifact.json`（16 ページ、8.2 MB）、ページ表 `gm1-ep03-finish-pages`、写植の記録 `gm1-ep03-lettering`（第3話の台詞・ナレーション・効果音をすべて `gm1-script-lines@script-v1` から）。ページの画像は `ep03/pages/`。
- 第2話の学び LN-e02-06：広い室内・壁のコマ（4-4・5-1・5-2）は最初から `FLAT_BG`（背景に影を付けず、強くぼかしたラフからトーン）にした。作者に見せる前に、海面にラフのむらがまだらに出た広い海のコマ（7-1・7-2・12-1）も `FLAT_BG` にした。
- 3-1 は線画だけ描き直したが、構図（ガリヴァーの胸と手、手のひらのレルドレサル）はラフと同じなので、ラフからトーンを取った。

```sh
EPISODE=3 python3 src/finish-mono.py <gulliver-manga のコミット>
# $SB に gulliver-ep0[123]-finish*.ts と gulliver-ep03-finish/（ep03-finish.json・layers・lines）を置いて
GM_OUT=/tmp/fin3 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep03-finish.build.test.ts
```

# 第4話「火事」仕上げと写植（白黒）

第3話と同じ白黒の作り（`src/finish-mono.py`、画像生成なし）。もとは線画 `gm1-ep04-ink@ink-ep04-v1`。

- 原稿 `artifacts/gm1-ep04-finish.artifact.json`（16 ページ）、ページ表 `gm1-ep04-finish-pages`、写植の記録 `gm1-ep04-lettering`（第4話の台詞・ナレーション・効果音をすべて `gm1-script-lines@script-v1` から）。ページの画像は `ep04/pages/`。
- 第3話の学び LN-e03-04（作者が採る、2026-11-19）：最初から、昼と朝の空のコマ（1-1・2-2・3-1・5-2・8-1・9-2・15-2・16-1・16-2）は `SKY_WHITE`、玉座の間と壁ばかりのコマ（1-2・2-3・3-2・3-3・4-2・5-1・8-2・8-3・9-1・14-1・15-1・15-3）は `FLAT_BG` にした。夜（10〜14ページ）の空は暗いままにした。
- 作者に見せる前に、夜の空にラフのむらがまだらに出た 11-1 も `FLAT_BG` にした。

```sh
EPISODE=4 python3 src/finish-mono.py <gulliver-manga のコミット>
# $SB に gulliver-ep0[1234]-finish*.ts と gulliver-ep04-finish/（ep04-finish.json・layers・lines）を置いて
GM_OUT=/tmp/fin4 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep04-finish.build.test.ts
```
