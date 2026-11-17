# 第1話「人の山」ラフ（Editor Platform）

工程定義 `fiction-manga@1.2.0` の「ラフ」（話ごと）の成果物です。ネーム `gm1-ep01-name@name-ep01-v2` と同じ16ページ・56コマ（コマの ID はそのまま）に、コマごとのラフ絵を描きました。ラフ絵は、ネームの 3D の舞台のカメラの絵を構図の型にして、Codex の画像生成で描いた鉛筆のラフです。AI の提案で、構図・ポーズ・接触の採否と直しは作者です。

## 成果物

| 資料（`artifacts/`） | Editor | 中身 | 画面 |
| --- | --- | --- | --- |
| `gm1-ep01-rough` 第1話ラフ（16ページ） | Design（漫画ワークスペース） | ネームと同じコマ割り。コマごとにレイヤーのグループ：`LY-01 下絵（3D）`（3D のカメラの絵、濃さ 25%）、`LY-02 アタリ`（ラフ絵）、`LY-10 文字（仮）`（擬音と題）、`メモ`（ネームのタグと絵のメモ）。LY-01・LY-02・メモは固定。その上に、吹き出しとナレーションの枠を1つずつ `LY-09 …` のグループ（枠と文字を一緒に）で置き、エディタでクリックしてそのまま動かせる | `screens/01〜05-*.png`、`pages/page-01〜16.png` |
| `gm1-ep01-rough-pages` ラフのページ表 | Structured Data | 1ページ1行：コマ、作画の方法、もとにした設定画（gulliver-manga のコミットとパスと sha256）、採用見本と 3D の舞台の版、レイヤー、決まりに無い・まとめたレイヤーの理由、人と AI のどちらのレイヤーか、生成の道具と版・渡した参照・出典と利用条件 | `screens/06-page-table.png` |
| `gm1-ep01-rough-figures` ラフの人物の絵 | Structured Data | 人物の配置（FG）1つに1行（135行）：コマ、人物表、ポーズ、このコマ用に描いたか、絵、コマの中の位置、描かない理由 | `screens/07-figure-table.png` |

## ラフ絵の描き方

1. `src/rough-briefs.py`：コマごとに、ネームのコマ表（大きさ、カメラの目と高さ、向き、絵のメモ、台詞）と 3D の舞台（人物の位置・向き・ポーズ）から、Codex に渡す説明を作ります。人物ごとに、3D のカメラに写す位置（コマの中の % と、頭・体・足のどこが枠に入るか）と、カメラに対する向き（正面、後ろ、横、3/4）を計算して書きます。カメラの絵は、生成の大きさ（1536×1024、1024×1536、1024×1024）に灰色の余白で合わせます。
2. `src/gen-rough.sh`（`src/run-rough.sh` で5つずつ）：Codex CLI 0.169.0 の画像生成で、1コマに1枚描きます。渡すのは、カメラの絵と、そのコマに出る人物・場所の採用した設定画（ガリヴァー、小人、皇帝、古い神殿、都）です。ガリヴァーの上着に縁取りを付けないことはプロンプトに書いています。プロンプトは `prompts/` にあります。
3. `src/rough-assets.py`：生の出力を、余白を除いてコマの枠に切り戻し、灰色の JPEG（長い辺 900 px）にします（`panels/`）。生の出力は大きいので commit せず、sha256 を `ep01-rough.json` に残しました。

56コマとも1回で描けました（Codex のモデル gpt-6.1-sol、画像のモデルは出ません）。8ページ1コマは、作者の確認で顔が半分切れていたので、説明に「顔全体を切らずに描く」を足して描き直しました（`prompts/e01-p08-k1.txt` が描き直したときのもの）。13ページの運搬機の3コマも、片側に車輪を12個描いていたので、本文どおり「長さ7フィート・幅4フィート、車輪22（片側11）」を説明に足して描き直しました。

4. `src/rough-assets.py` は、コマごとに「文字を置きたくないところ」の格子も作ります。ラフ絵の線の濃さ（コマの中の背景の濃さより濃いところ）と、3D のカメラに写る人物の頭（`rough-briefs.py` で計算）です。ラフ原稿を組むとき、吹き出し・ナレーションの枠・擬音を、読む順（上から、同じ高さなら左から右）を保ったまま、この格子の濃いところと頭を避ける位置へ動かします（`avoidFigures`）。

## 確かめていること（`gulliver-ep01-rough.build.test.ts`）

- ページとコマがネームと同じ（コマの ID が同じ順）。
- `rough.layers`：どのコマにも、LY-01・LY-02・LY-10・メモのグループが重ね順のとおりにあり、LY-01・LY-02・メモは固定されている。LY-01 は 3D の絵1枚、LY-02 はそのコマのラフ絵1枚（コマと同じ枠）。その上の LY-09 は、吹き出し・ナレーションの枠ごとのグループで、それぞれ文字を1つ持つ。台詞・ナレーション・擬音はすべて入っている。
- `rough.lettering-clear`（fiction-manga 1.3.0）：吹き出し・ナレーションの枠・擬音が、3D のカメラに写る人物の頭の中心に被っていない。
- `rough.sources`：どのページにも、設定画の固定した版（コミット・パス・sha256）または設定画が無い理由、採用見本と 3D の舞台の版、生成の道具と版・渡したネームの版・出典と利用条件、LY-02 にまとめた理由がある。ガリヴァー・小人・皇帝を描いたコマは、その設定画を Codex に渡している。
- `rough.figures-drawn`：舞台の FG がすべて人物の絵の表にあり、描いたものはそのコマのラフ絵を指し、描かないものは理由（画角の外）がある。人物のいるコマは、少なくとも1人を描いている。同じラフ絵を2つのコマで使っていない。
- 16ページを vector で書き出せて、エラーの診断が無い。書き出しではメモのグループを隠し（原稿には残す）、ページの絵にメモの文字が出ない。

## 決めたこと（提案）

- **吹き出しと枠は、エディタで一つずつ動かせます。** 枠と文字を一緒のグループにしてコマの直下に置き、ラフ絵と下絵のレイヤーは固定しました。Playground で吹き出しをドラッグすると、枠と文字が一緒に動き、絵の上をドラッグしても絵は動きません（`screens/08-drag-balloon.png`）。このため台詞とナレーションの文字（LY-10）は LY-09 とまとめています。写植で分けます。
- **ラフ絵は LY-02 アタリに入れました。** 画作りガイドのラフのレイヤーには背景の位置の層が無く、Codex は1コマを1枚で描くので、人物と背景を1枚にしています。線画で LY-04（背景の線画）と LY-07（人物の線画）に分けます。
- **メモ**（ネームのタグと絵のメモ）は決まりの外のレイヤーです。ラフの指示として残し、書き出しでは隠します。
- 3D の下絵は、ラフ絵の線を読みやすくするため、ネームの 50% から 25% に薄くしました。
- ラフは白黒の鉛筆です。色はガイドの AR-04 のとおり仕上げで付けます。
- 人物の配置は 135 です。103 は 3D のカメラで枠に入り、このコマ用に描きました。31 は画角の外なので描いていません（理由を表に書きました）。1つ（2ページ2コマの灰の馬）は、3D のカメラではわずかに枠の外ですが、ネームの絵のメモ「馬の鼻先」に合わせて描きました。ネームの舞台のカメラを直す必要があります。

## 作者に見てほしいところ

- **1ページ1コマ（扉）**：3D のカメラでは胸の上の小人5人が枠の外になり、ラフ絵では弓の先しか入っていません。小人を見せるなら、ネームの舞台のカメラを引くか、ラフを描き直します。
- **2ページ2コマ**：上の灰の馬の鼻先です。
- **15ページ1コマ**：立ち上がるガリヴァーの左足の鎖が描かれていません。枠の端に灰色の余白の線が少し残っています。
- 吹き出しの位置は、頭の中心を避けるだけで、体や手に掛かるところは残ります。気になる吹き出しは、エディタで動かしてください。
- 小人の大きさ（AR-01）は、ガリヴァーと同じコマではおおむね 1/12 ですが、コマによってばらつきます。線画の前に、3D の下絵（LY-01）と重ねて確かめてください。

## 作り直し方

ネームと同じ手順です。`part1/name/gulliver-ep01-name.ts` と一緒に、このフォルダの `.ts` と、`part1/name/stage/`（`gulliver-ep01-stage/` として）とこのフォルダ（`gulliver-ep01-rough/` として）を editor-platform の `apps/artifact-host/src/creative/story-board/` へコピーして実行します。

```sh
python3 part1/rough/src/rough-briefs.py part1/name/artifacts/gm1-ep01-name-panels.artifact.json part1/name/stage/ep01-stage.json part1/name/stage/underlay $W
PAR=5 bash part1/rough/src/run-rough.sh $W            # Codex にサインインしておく。56コマで約1時間
python3 part1/rough/src/rough-assets.py $W $(git rev-parse HEAD) part1/rough
cp part1/editor/gulliver-part1.ts story/editor/gulliver-story.ts part1/script/gulliver-part1-script.ts part1/name/gulliver-ep01-name.ts part1/rough/*.ts $SB/
cp -r part1/name/stage $SB/gulliver-ep01-stage; cp -r part1/rough $SB/gulliver-ep01-rough
GM_OUT=/tmp/rough npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep01-rough.build.test.ts
node gm-rough-screens.tmp.mjs /tmp/rough/rough-editor.json /tmp/rough/screens   # Playground の dev server（:4231）が要る
```

`pages/` は確定版を `captureDesignPages`（vector）で書き出した SVG を PNG にしたものと manifest です（SVG はラフ絵を含んで大きいので commit していません）。Design 原稿は、Playground の読み込みの上限（16 MB）に収まるよう、ラフ絵を長い辺 900 px にしています。

# 第2話「綱渡りの宮廷」ラフ

工程定義 `fiction-manga@1.3.0` の「ラフ」です。ネーム `gm1-ep02-name@name-ep02-v1` と同じ16ページ・48コマに、第1話と同じ方法（3D の舞台のカメラの絵＋採用した設定画を Codex に渡す）でラフ絵を描きました。成果物は `artifacts/gm1-ep02-rough`（Design）、`gm1-ep02-rough-pages`（ページ表）、`gm1-ep02-rough-figures`（人物の絵の表）、記録は `ep02-rough.json`、ページの絵は `ep02/pages/` です。AI の提案で、採否と直しは作者です。

## 第1話の学びの入れ方

- `src/episode-notes.py` に、第2話の覚え書きを置きました（`rough-briefs.py` が読み、第1話のコマには何も足しません）。
  - LN-e01-04 続く状態：鎖は左足首だけ（1-1〜9-3）、10-1 で外れ、10-2 から無し。都（SC-008）では上着を脱いで短い胴着だけ（原文 "in my short waistcoat"）。
  - LN-e01-02 大きさの比べ：小人の全身はガリヴァーの手の長さほど、頭は目より小さい。糸（12インチ）は脛まで。城壁と3階建ての屋根は太ももの半ば。窓（4×6インチ）は目と眉ほど。皇后の手は爪ほど。
  - LN-e01-03 背景：寄りのコマにも、地面・空・壁・部屋のどれかを描く。
  - 作者の決まり：枠に入る顔は切らない。
  - 15〜16ページ：3D の窓のガラスは不透明なので、窓の外のガリヴァーの目と口を描くよう書きました。
- LN-e01-01 主役が枠に入っているか：`briefs.json` の人物ごとの「枠の中か」を見て、主役が外れていた 11-2（城壁の見張り）と 15-1（王子たちと皇后）は、ネームの舞台のカメラを直してから描きました。
- LN-e01-08：扉（1-1）を先に作者に見せました。
- `rough-briefs.py` は、座る人物の頭の高さを立った高さで計算していました（第2話から、座る人物は身長の 0.52 で計算）。1〜10ページの最初の説明では、座るガリヴァーの頭を「枠で切れる」と書いていましたが、Codex は 3D の絵に従って顔を描きました。2-1 だけは頭の無い人に見えたので描き直しました。

## 描き直したコマ（作者に見せる前）

`ep02-rough.json` の `retake` に、理由と1回目の生の出力の sha256 を残しました。

| コマ | 理由 | 直し方 |
| --- | --- | --- |
| 2-1 | ガリヴァーの首から下だけが写り、頭の無い人に見えた | ネームの舞台のカメラを上に向けて顔を枠に入れた |
| 6-2・8-2・8-3 | ラフ原稿で、吹き出しが顔に掛かった（顔が枠の真ん中で、吹き出しの余白が無い） | カメラを振って吹き出しの余白を空けた |
| 15-3 | 説明の覚え書きを「外から見る」と書き間違えた | 覚え書きを直した |
| 16-1 | ガリヴァーが部屋の中に入っていた | 「建物の外、窓に口と鼻だけ」を足した |

吹き出しを顔に掛けない置き方（`../name/gulliver-ep01-name.ts` の `avoidFigures`）は、頭に掛かる位置の重みを 50 から 1000 にしました。第1話のラフの資料は変わりません（同じ JSON になることを確かめました）。

## 作者に見てほしいところ

- 12-2：ネームの覚え書きは「上着の裾を押さえ」ですが、原作に合わせて上着を脱いだ胴着で描きました。
- 6-2：吹き出しの余白を空けるため、皇帝と大臣たちの顔が枠の下のほうにあります。
- 14-2：高さ5フィートの腰掛けが、脚立のような形になっています。

## 作り直し方

```sh
python3 part1/rough/src/rough-briefs.py part1/name/artifacts/gm1-ep02-name-panels.artifact.json part1/name/stage/ep02-stage.json part1/name/stage/underlay $W
PAR=5 bash part1/rough/src/run-rough.sh $W            # 48コマで約40分
EPISODE=2 python3 part1/rough/src/rough-assets.py $W $(git rev-parse HEAD) part1/rough
cp part1/editor/gulliver-part1.ts story/editor/gulliver-story.ts part1/script/gulliver-part1-script.ts part1/name/gulliver-ep0[12]-name.ts part1/rough/*.ts $SB/
cp -r part1/name/stage $SB/gulliver-ep02-stage; mkdir $SB/gulliver-ep02-rough; cp -r part1/rough/ep02-rough.json part1/rough/panels part1/rough/prompts $SB/gulliver-ep02-rough/
GM_OUT=/tmp/rough2 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep02-rough.build.test.ts
node gm-svg2png.tmp.mjs /tmp/rough2/pages /tmp/rough2/png
```

# 第3話「卵の端」ラフ

ネーム `gm1-ep03-name@name-ep03-v1`（16ページ・46コマ、作者確認済み）に、第2話と同じ方法でラフ絵を描きました。成果物は `artifacts/gm1-ep03-rough`（Design）、`gm1-ep03-rough-pages`、`gm1-ep03-rough-figures`、記録は `ep03-rough.json`、ページの絵は `ep03/pages/` です。人物にレルドレザル（CH-05）が加わりました。

## 第2話の学びの入れ方

- `src/episode-notes.py` の第3話の覚え書き：
  - 続く状態：8-2 まで上着、9-1 で脱いで胴着だけ、9-2〜10-3 は眼鏡無し、10-4〜12-2 は眼鏡、13-1 から濡れた胴着。
  - 大きさ：館・海岸・艦隊・海峡ごとの比べ（ネームの【大きさ（3D）】の数値と同じ）。昔話（舞台 past・eggs）にはガリヴァーが出ないことを書きました。
  - LN-e02-02 顔を半分だけ枠に入れない、LN-e02-04 綱・糸・矢を細く、LN-e02-05 引きの絵で頭の上に余白、を全コマ（または当たるコマ）に足しました。
- `rough-briefs.py`：寝る・腹ばい・泳ぐ姿勢は、3D の姿勢から求めた頭の位置（FK）を使うようにしました。胴着姿（gj）は胴着と素足で書きます。
- `gulliver-ep03-rough.build.test.ts` は、上の覚え書きが説明に入っていることを確かめます。

## 描き直したコマ（作者に見せる前）

| コマ | 理由 | 直し方 |
| --- | --- | --- |
| 9-3 | 海だけに見え、泳ぐガリヴァーが見えなかった | 泳ぐ姿を枠の5分の1ほどで描く覚え書きを足した |
| 15-1 | ひざまずくガリヴァーの頭が枠の上で切れた（2回） | ネームの舞台のカメラを上に向けた（見る高さ 950→1350 mm）。3回目で描いた |

13-1・13-2 は、皇帝が枠から外れていたので、ラフの前にネームの舞台のカメラを引きました（ネームのページ 13・15 も描き直し）。

## 作者に見てほしいところ

- 2-3：二人の間が空いて、真ん中が何も無く見えます。
- 5-2：卵が卓の上で大きく見えます（3D では長さ約5 mm）。

## 作り直し方

```sh
python3 part1/rough/src/rough-briefs.py part1/name/artifacts/gm1-ep03-name-panels.artifact.json part1/name/stage/ep03-stage.json part1/name/stage/underlay $W
PAR=5 bash part1/rough/src/run-rough.sh $W            # 46コマで約15分
EPISODE=3 python3 part1/rough/src/rough-assets.py $W $(git rev-parse HEAD) part1/rough
cp part1/name/gulliver-ep03-name.ts part1/rough/gulliver-ep03-rough*.ts $SB/
cp -r part1/name/stage/. $SB/gulliver-ep03-stage/; mkdir -p $SB/gulliver-ep03-rough; cp -r part1/rough/ep03-rough.json part1/rough/panels part1/rough/prompts $SB/gulliver-ep03-rough/
GM_OUT=/tmp/rough3 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-ep03-rough.build.test.ts
node gm-svg2png.tmp.mjs /tmp/rough3/pages /tmp/rough3/png
```
