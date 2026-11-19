/**
 * ガリヴァー旅行記 第3話「卵の端」の出版準備（fiction-manga@1.3.0 出版準備、話ごと）。
 *
 * 第1話（gulliver-ep01-output.ts）と同じ作り：成果物は「出力の記録」(output-record、表)。出力は export-ep.mjs が、
 * 通読で読んだ固定した版（gulliver-ep03-read.ts の READ_VERSIONS_EP03）から作る。第2話から白黒（作者の判断
 * 2026-11-15）で、仕上げには画像の生成を使っていない。確かめるのは作者（output.approved）。
 */
import { READ_COMMIT_EP03, READ_VERSIONS_EP03 } from './gulliver-ep03-read';
import { BIBLIO, buildEpisodeOutput, type AiRole, type Biblio, type OutputEpisode, type Outputs } from './gulliver-ep01-output';

/** 書誌情報と紹介文（著者名・原作は第1話と同じ。題は脚本の題、あらすじ・紹介文は AI の草案）。 */
export const BIBLIO_EP03: Biblio = {
  title: 'ガリヴァー旅行記　第3話「卵の端」',
  series: 'ガリヴァー旅行記（全4部・24話）第1部 リリパット 第3話',
  author: BIBLIO.author,
  original: BIBLIO.original,
  synopsis:
    '宮廷の大臣レルドレサルが、寝そべるガリヴァーの手のひらの上で国の内情を語る。かかとの高さで分かれる二つの党派と、卵を大きい端から割るか小さい端から割るかで始まった、隣国ブレフスキュとの長い戦争。攻め寄せる艦隊の話を聞いたガリヴァーは、北東の岸から海峡を歩いて渡り、矢を浴びながら50隻の軍艦を綱で引いて帰る。皇帝はナルダックの位を授けるが、その目はまだ海の向こうを見ていた。',
  blurb: '卵の割り方で始まった戦争。原作に忠実に、大きさの違いを実寸の3Dで確かめながら描く、ガリヴァー旅行記の漫画連載。第3話は、二つの党派の話から、海峡を渡ってブレフスキュの艦隊を引いて来るまで。',
};

/** AI の関わり（第3話）。仕上げは白黒で、画像の生成を使わずラフの濃淡からトーンを付けた。 */
export const AI_ROLES_EP03: AiRole[] = [
  { phase: '企画・人物と世界', asked: '第1話と同じ（企画書・画作りガイド・人物表・世界の覚え書き・地図の草案、設定画）', adopted: '作者が受け入れた設定画を、ラフ以降の参照に使った' },
  { phase: '筋と構成・脚本', asked: '原文からの新しい訳と、シーン・台詞・ト書きの草案', adopted: '作者が受け入れた脚本の行（gm1-script-lines@script-v1）の第3話をそのまま写植した。台詞は変えていない' },
  { phase: 'ネーム', asked: 'ページ割り・コマ・カメラと、3D の舞台（デジタルツイン）での人物の配置。通読のあとの撮り直し（2-2、6-1）', adopted: 'コマ割りとカメラ（作者の確認と直しのあと）' },
  { phase: 'ラフ', asked: 'コマごとのラフ絵（Codex CLI の画像生成、3D のカメラの絵と設定画を渡した）', adopted: 'LY-02 アタリ（線画で隠して残した）と、仕上げのトーンの濃淡の元' },
  { phase: '線画', asked: 'ラフをなぞった線画（3色で描かせ、色で LY-04・LY-07・LY-08 に分けた）。通読のあとに描き直したコマ（2-2・4-4・6-1・11-1・12-1・16-1・16-2）', adopted: 'LY-04 背景の線画、LY-07 人物の線画、LY-08 効果（効果は AI の提案）' },
  { phase: '仕上げと写植', asked: '白黒の仕上げ（画像の生成は使わず、ラフの濃淡を線画に合わせてトーンと影にした。広い空と海・室内は平らなトーン（FLAT_BG・SKY_WHITE））。脚本の行を吹き出しと枠に置いた', adopted: 'LY-03 背景のトーン、LY-05 人物のトーン、LY-06 影、LY-09 吹き出し、LY-10 文字' },
  { phase: '通読', asked: '固定した版の通読と指摘の草案', adopted: '指摘の判断と完成の判断は作者（gm1-ep03-read）' },
];

export const EP03_OUTPUT: OutputEpisode = {
  no: 3,
  biblio: BIBLIO_EP03,
  roles: AI_ROLES_EP03,
  fixed: READ_VERSIONS_EP03.find((v) => v.artifact === 'gm1-ep03-finish')!,
  readCommit: READ_COMMIT_EP03,
  sourceFile: 'part1/finish/artifacts/gm1-ep03-finish.artifact.json',
  format: '第1話と同じ：原稿の枠 800×1180（縦横比 1:1.475）、PDF のページは 600×885 pt。作者の判断（2026-11-14）：このまま（A4 に合わせない）。第2話から白黒（作者の判断 2026-11-15）。',
  layers: 'LY-03〜LY-10',
  colophonIntro:
    'この話は、作者が決めた筋・コマ割り・判断のもとで、ラフと線画を AI の画像生成で作り、白黒の仕上げはラフの濃淡から付けました（仕上げに画像の生成は使っていません）。工程ごとに AI に頼んだことと、採ったものは次のとおりです。',
  version: 'output-ep03-v1',
  stamp: '2026-11-19T00:00:00.000Z',
  reason: 'ガリヴァー旅行記 第3話の出版準備（fiction-manga@1.3.0 出版準備：出力の記録。確かめるのは作者）',
};

export async function buildGulliverEp03Output(outputs: Outputs) {
  return buildEpisodeOutput(outputs, EP03_OUTPUT);
}
