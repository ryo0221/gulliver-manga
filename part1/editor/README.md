# 第1部の人物・世界・地図（Editor Platform）

工程定義 `fiction-manga@1.1.0` の「人物」と「世界と舞台」の成果物を、Editor Platform のネイティブ資料にしたものです。正本は `artifacts/` の JSON です。`docs/part1-setting.md` は Claude Doc から書き出した文章版で、内容はこちらに合わせています。

## 成果物と資料の対応

| 工程定義の成果物 | 資料（`artifacts/`） | Editor | 画面 |
| --- | --- | --- | --- |
| 人物表 character-sheet | `gm1-characters` 第1部 人物表と相関図 | Structured Data（表） | `screens/05-character-sheet.png` |
| 相関図 relationship-map | 同じ `gm1-characters` の関係の列（relation 型） | Structured Data の Graph 表示 | `screens/06-relationship-graph*.png` |
| 世界の覚え書き stage-notes | `gm1-world-notes`（世界の決まり・世界線と時計・世界間の移送・場所） | Document | `screens/07-world-notes.png` |
| 世界線と時計 | `gm1-world-settings`（時計 CL-1、世界線 WL-A） | Story Timeline の世界設定 | `screens/08-world-lines-clock.png`、`screens/04-story-timeline-worldline.png` |
| 出来事と在場 | `gm1-ledger`（EV-01〜EV-20、参加・在場・因果） | Story Timeline の筋の台帳 | `screens/04-story-timeline.png`、`screens/09-ledger.png` |
| 地図 stage-map | `gm1-map`（場所 LO-01〜LO-11、道 RT-01〜RT-07） | Fiction Map | `screens/11-map.png` |
| 固有名詞と表記の辞書 term-dictionary | `gm1-terms`（TE-01〜TE-17） | Structured Data | `screens/10-dictionary.png` |
| まとめて見る | `gm1-board`、`gm1-board-settings` | 物語ボード（Whiteboard） | `screens/01〜03-story-board*.png` |

`gm1-composition`（構成図）は Story Timeline が要求する空の資料です。全24話の提示順は `story/editor/`（筋と構成）にあります。

2026-11-14 の筋と構成で、綱渡り（EV-08）、凱旋とナルダック（EV-09）、和平の使節（EV-19）、弾劾の会議（EV-20）と因果の行を足しました。`screens/09-ledger.png` はその前の画面です。`story-links.json` は Story の結び付け（どの資料が台帳・世界設定・人物表か）です。

## 決めたこと

- 時計は CL-1 一つだけです。ユリウス暦（英国の当時の暦）で、1699-05-04 のブリストル出航を 0 日とします。本文に日付がある出来事だけ日を確定し、他は範囲で置きます。
- 本文の矛盾について。「リリパットに 9 か月 13 日」と書かれている一方、ブレフスキュで「約 1 か月」準備して 1701-09-24 に出帆しています。両方は満たせないので、リリパットを出た日は 472〜840 日の範囲に置きます。
- 地図は GV1 の「リリパットとブレフスキュ」版 1 を元にしました。地物の名前に LO 番号を付け、王宮（LO-05）と海峡の目印（LO-07）を点として足し、道 RT-01〜RT-07 を足しています。道の説明は、つなぐ場所の LO を必ず引用します（stage.map-traced）。

## 作り直し方

editor-platform（main `39a8fbb6e`）の作業ツリーで実行します。ファイルはコピーするだけで、editor-platform には commit しません。

```sh
cp part1/editor/gulliver-part1.ts part1/editor/gulliver-part1.build.test.ts <ep>/apps/artifact-host/src/creative/story-board/
cp part1/editor/gulliver-part1-editor.demo.ts <ep>/tests/demo/
cd <ep>
GM_OUT=/tmp/part1 npx vitest run apps/artifact-host/src/creative/story-board/gulliver-part1.build.test.ts
DEMO_MATCH=gulliver-part1-editor EDITOR_OUT=/tmp/part1 PART1_JSON=/tmp/part1/part1-editor.json \
  npx playwright test -c <playground の demo 設定> --workers 1 --trace off
```

1. ビルドのテストで資料を組み立てます。物語ボードで開けることを確かめてから、`artifacts/` の JSON を書き出します。
2. 画面のテストで、資料を物語ボード・物語タイムライン・Playground で開き、`screens/` の画面を書き出します。

地図の元にする GV1 の地図は `LILLIPUT_MAP`（既定は `/mnt/project-files/gulliver-world/gv1/lilliput.fiction-map.json`）で指定します。2026-11-14 に実行し、ビルドは 1 件、画面は 5 件のテストが通りました。
