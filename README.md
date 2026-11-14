# ガリヴァー旅行記 漫画連載

ガリヴァー旅行記（Project Gutenberg #829）を、工程定義 `fiction-manga@1.1.0` に従って漫画にし、Web で連載するための制作リポジトリです。絵は Editor Platform で作った 3D の下絵をもとにします。清書は AI の画像生成（Codex）で行い、採るかどうかは作者が決めます。

## 中身

| 場所 | 中身 |
| --- | --- |
| `docs/plan.md` | 企画（進め方・企画書・画作りガイド）。2026-11-14 に作者が承認済み。正本は [Claude Doc](https://claude.ai/artifact/4TLyrtjaJKNPSBfEtT2nZ3)。 |
| `docs/part1-setting.md` | 第1部リリパットの人物・世界・地図・辞書。正本は [Claude Doc](https://claude.ai/artifact/Mt255P7TVnCGZvJMdQGVXh)。 |
| `part1/editor/` | 第1部の人物表と相関図・世界の覚え書き・世界線と時計・出来事・地図・辞書・物語ボード。Editor Platform のネイティブ資料（`artifacts/`）と画面（`screens/`）。詳しくは `part1/editor/README.md`。 |
| `part1/underlay/` | Editor Platform の Playground で書き出した 3D 下絵（LY-01）。 |
| `part1/src/` | 下絵を書き出すテストとその設定。editor-platform の作業ツリーで実行する。 |
| `part1/codex-prompts.md` | Codex への依頼書（共通ルールと項目ごとの指示）。 |
| `part1/codex/<項目>/` | Codex の設定画。元画像（raw）、レイヤー PNG（LY-03/04/05/07）、合成画像、`provenance.json`。 |
| `part1/codex/_tools/` | 生成スクリプト（`gen.sh`, `gen2.sh`）と、線と塗りに分けるスクリプト（`split.py`）。 |
| `part1/name/`・`part1/rough/`・`part1/ink/` | 第1話のネーム・ラフ・線画（Editor Platform の Design 原稿と表、ページの絵、作り方）。詳しくはそれぞれの `README.md`。 |

Markdown の書き出しでは、Claude Doc の図（工程の順と相関図）は「embedded content」という仮の文字に置き換わっています。
