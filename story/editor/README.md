# 筋と構成（全4部・24話、Editor Platform）

工程定義 `fiction-manga@1.1.0` の「筋と構成」（作品全体で一度）の成果物を、Editor Platform のネイティブ資料にしたものです。正本は `artifacts/` の JSON です。`docs/story-outline.md` は 24話の筋立て（Document）を書き出した文章版です。

## 成果物と資料の対応

| 工程定義の成果物 | 資料（`artifacts/`） | Editor | 画面 |
| --- | --- | --- | --- |
| 筋の台帳 | `gms-ledger` 全4部の出来事 EV-01〜EV-67（67件）、参加者、因果（cause） | Story Timeline の筋の台帳 | `screens/01-story-timeline*.png`、`screens/06-ledger.png` |
| 構成図 | `gms-composition` 24話への提示順（75か所） | Story Timeline の「構成の提示順」 | `screens/02-composition*.png`、`screens/07-composition-table.png` |
| （構成図が引くシーン） | `gms-scenes` シーンカード SC-001〜SC-074。出来事と人物を引用する | Structured Data | `screens/05-scenes.png` |
| 筋と伏線 | `gms-plot` 筋 PL-01〜PL-04、伏線 FS-01〜FS-08（張るシーンと回収するシーン） | Structured Data | `screens/04-plot.png` |
| 24話の筋立て | `gms-outline` 話ごとの題、本文の章、あらすじ、シーン | Document | `screens/03-outline.png` |
| （台帳が引く人物） | `gms-characters` 第1部の CH-01〜CH-10 と、第2〜4部の仮の人物 CH-11〜CH-29 | Structured Data | `screens/08-characters.png` |
| 世界線と時計 | `gms-world-settings` 時計 CL-1、世界線 WL-A（第1部と同じ） | Story Timeline の世界設定 | — |

`story-links.json` は Story の結び付け（どの資料が台帳・シーンカード・構成図・世界設定・人物表か）です。

## 決めたこと

- 提示順は本文の時の順です。例外は一つで、第1話の序で約5年後に厩で馬と話すガリヴァー（SC-001）を見せ、第24話で同じシーンを再び出して閉じます（FS-01、構成図の `OC-001-R`）。
- 各部6話です。第1部の話の割り当ては、第1部の人物表と場所の「初めて出る場面」に合わせました。
- 時計は第1部と同じ CL-1（ユリウス暦、1699-05-04 = 0 日）です。本文の日付はすべて相対日に直しました（例：1703-06-17 巨人の国に上陸 = 1,505 日、1715-12-05 帰宅 = 6,059 日）。日付の無い出来事は、前後の日付の間の範囲に置いています。第2部の脱出は、本文の「逃げてから約9か月で帰国」から 2,290〜2,340 日としました。
- 第1部の出来事は `part1/editor/gulliver-part1.ts` のものをそのまま使い、そちらに綱渡り（EV-08）、凱旋とナルダック（EV-09）、和平の使節（EV-19）、弾劾の会議（EV-20）と因果の行を足しました。
- 第2〜4部の人物（CH-11〜CH-29）は名前と初めて出る話だけの仮の行です。欄は各部の「人物」の工程で埋めます。

## 確かめていること（`gulliver-story.build.test.ts`）

- 資料がすべて Story Timeline で正しく読める（owner がすべて valid、範囲が complete）。
- すべての出来事が時計の上に置かれ、どのシーンからも引かれない出来事が無い（筋の網羅）。
- すべてのシーンの引用が解決し、すべてのシーンがどこかの話に置かれている。
- 24話がそろい、提示順が並び順どおり。SC-001 が第1話と第24話に出る。
- 伏線ごとに、張るシーンがすべての回収シーンより前に出る。
- 日付のある出来事が時計の上で本文の順に並ぶ。

## 作り直し方

editor-platform（main `39a8fbb6e`）の作業ツリーで実行します。ファイルはコピーするだけで、editor-platform には commit しません。

```sh
SB=<ep>/apps/artifact-host/src/creative/story-board
cp part1/editor/gulliver-part1.ts story/editor/gulliver-story.ts story/editor/gulliver-story.build.test.ts $SB/
cd <ep>
GM_OUT=/tmp/story npx vitest run apps/artifact-host/src/creative/story-board/gulliver-story.build.test.ts
npx vite --host 127.0.0.1 --port 4231 --strictPort &
cp <gm>/story/editor/gulliver-story-screens.mjs ./gm-story-screens.tmp.mjs   # playwright を解決するため ep の中で実行する
node gm-story-screens.tmp.mjs /tmp/story/story-editor.json /tmp/story/screens
```

1. ビルドのテストで資料を組み立て、上の検査をしてから `artifacts/` の JSON を書き出します。
2. 画面のスクリプトで、物語タイムライン（世界時間、構成の提示順）と Playground（各資料）を開き、`screens/` を書き出します。Story を入れたブラウザの記憶域では Playground の最初の画面が落ちるため、Playground は別のコンテキストで開きます。

2026-11-14 に実行し、ビルドのテストは 1 件通り、画面は 12 枚書き出しました。
