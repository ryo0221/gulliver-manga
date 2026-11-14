# 第1部 脚本（1〜6話、Editor Platform）

工程定義 `fiction-manga@1.1.0` の「脚本」（部ごと）の成果物です。正本は `artifacts/` の JSON、文章版は `docs/part1-script.md` です。台詞とナレーションは、原文（Project Gutenberg #829 第1篇）から新しく訳した**草案**です。既存の日本語訳は使っていません。台詞の決定は作者です。

## 成果物

| 資料（`artifacts/`） | Editor | 中身 | 画面 |
| --- | --- | --- | --- |
| `gm1-script` 第1部 脚本 | Document | 話ごとの見出し、シーン（SC とページ数）、行 | `screens/01〜03-script*.png` |
| `gm1-script-lines` 台詞とナレーションの表 | Structured Data | 1行ごとに 話・シーン・種類・話す人物（CH）・文 | `screens/04-script-lines.png` |

行の種類と書式：

| 種類 | Document での書き方 | 文字にするか |
| --- | --- | --- |
| ナレーション | 【N】…（ガリヴァーの手記。話す人物は CH-01） | する（明朝体） |
| 台詞 | 名前（CH）「…」 | する（ゴシック体） |
| ト書き | （…） | しない |
| 擬音 | 〔…〕 | 手書きで LY-08 に描く |

## 決めたこと

- 各話16ページ。シーンごとのページ数は脚本の見出しにあります。ネームの工程で変えてよい目安です。
- 各話の最初のシーンは「1ページ目、引きのコマ」のト書きで始め、大きさの違う両者（ガリヴァーと小人）を一つのコマに入れます（AR-05）。第1話は扉のコマで両者を見せてから、英国の厩の序に入ります。
- リリパットの言葉（ヘキナ・デグル、トルゴ・フォナク、ボラク・ミヴォラ）は訳さず、辞書 TE-18〜TE-20 に足しました。称号ナルダックは TE-21 です。
- 本文に無い場面の細部（綱渡りで落ちた廷臣を受け止める、序の厩の会話、別れの言葉など）は創作です。事実（日付、寸法、条文の数、弾劾の四つの罪、レルドレサルの「慈悲」の理屈、牛と羊の数など）は本文に合わせました。
- 群の台詞は CH-30（リリパットの群衆と役人）と CH-31（ブレフスキュの使節）が話します。人物表（`gms-characters`）に足してあります。

## 確かめていること（`gulliver-part1-script.build.test.ts`）

- 1〜6話のシーンが、構成図（`gms-composition`）のその話のシーンと同じで、同じ順に並ぶ。
- 各話のページ数の合計が16。
- 各話の最初の行が引きのコマのト書きで、ガリヴァーと小人の両方を書いている。
- 台詞とナレーションはすべて、人物表にある話す人物を引用する。ナレーションは CH-01。
- 台詞を言う人物は、シーンカードの出る人物に入っている（群の話し手を除く）。

## 作り直し方

`story/editor/README.md` と同じ手順です。`gulliver-part1.ts`、`gulliver-story.ts` と一緒に、このフォルダの `.ts` を editor-platform の `apps/artifact-host/src/creative/story-board/` へコピーして実行します。

```sh
cp part1/editor/gulliver-part1.ts story/editor/gulliver-story.ts part1/script/*.ts $SB/
GM_OUT=/tmp/script npx vitest run apps/artifact-host/src/creative/story-board/gulliver-part1-script.build.test.ts
cp <gm>/part1/script/gulliver-part1-script-screens.mjs ./gm-script-screens.tmp.mjs
node gm-script-screens.tmp.mjs /tmp/script/script-editor.json /tmp/script/screens
```

2026-11-14 に実行し、脚本・筋と構成・第1部のビルドのテストが通り、画面は 4 枚書き出しました。
