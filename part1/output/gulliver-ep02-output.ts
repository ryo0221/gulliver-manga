/**
 * ガリヴァー旅行記 第2話「綱渡りの宮廷」の出版準備（fiction-manga@1.3.0 出版準備、話ごと）。
 *
 * 第1話（gulliver-ep01-output.ts）と同じ作り：成果物は「出力の記録」(output-record、表)。出力は export-ep.mjs が、
 * 通読で読んだ固定した版（gulliver-ep02-read.ts の READ_VERSIONS_EP02）から作る。第2話から白黒（作者の判断
 * 2026-11-15）で、仕上げには画像の生成を使っていない。確かめるのは作者（output.approved）。
 */
import { READ_COMMIT_EP02, READ_VERSIONS_EP02 } from './gulliver-ep02-read';
import { BIBLIO, buildEpisodeOutput, type AiRole, type Biblio, type OutputEpisode, type Outputs } from './gulliver-ep01-output';

/** 書誌情報と紹介文（著者名・原作は第1話と同じ。題は脚本の題、あらすじ・紹介文は AI の草案）。 */
export const BIBLIO_EP02: Biblio = {
  title: 'ガリヴァー旅行記　第2話「綱渡りの宮廷」',
  series: 'ガリヴァー旅行記（全4部・24話）第1部 リリパット 第2話',
  author: BIBLIO.author,
  original: BIBLIO.original,
  synopsis:
    '鎖につながれて半年近く、ガリヴァーは小人の国の言葉を覚え、宮廷の芸を見せてもらうようになる。地上12インチの細い糸の上で跳ね、いちばん高く跳んだ者が官職を得る綱渡り。評議では提督ボルゴラムが反対するなか、八つの条文と奇妙な誓いで鎖が外される。自由になったガリヴァーは都ミルデンドウを訪ね、城壁をまたぎ、王宮の窓から差し出された皇后の手に口づけする。',
  blurb: '跳んだ高さで大臣が決まる国。原作に忠実に、大きさの違いを実寸の3Dで確かめながら描く、ガリヴァー旅行記の漫画連載。第2話は、綱渡りの芸から、鎖が外れて都と王宮を訪ねるまで。',
};

/** AI の関わり（第2話）。仕上げは白黒で、画像の生成を使わずラフの濃淡からトーンを付けた。 */
export const AI_ROLES_EP02: AiRole[] = [
  { phase: '企画・人物と世界', asked: '第1話と同じ（企画書・画作りガイド・人物表・世界の覚え書き・地図の草案、設定画）', adopted: '作者が受け入れた設定画を、ラフ以降の参照に使った' },
  { phase: '筋と構成・脚本', asked: '原文からの新しい訳と、シーン・台詞・ト書きの草案', adopted: '作者が受け入れた脚本の行（gm1-script-lines@script-v1）の第2話をそのまま写植した。台詞は変えていない' },
  { phase: 'ネーム', asked: 'ページ割り・コマ・カメラと、3D の舞台（デジタルツイン）での人物の配置。通読のあとの撮り直し（7-4、16-1）', adopted: 'コマ割りとカメラ（作者の確認と直しのあと）' },
  { phase: 'ラフ', asked: 'コマごとのラフ絵（Codex CLI の画像生成、3D のカメラの絵と設定画を渡した）', adopted: 'LY-02 アタリ（線画で隠して残した）と、仕上げのトーンの濃淡の元' },
  { phase: '線画', asked: 'ラフをなぞった線画（3色で描かせ、色で LY-04・LY-07・LY-08 に分けた）。通読のあとに描き直した6コマ', adopted: 'LY-04 背景の線画、LY-07 人物の線画、LY-08 効果（効果は AI の提案）' },
  { phase: '仕上げと写植', asked: '白黒の仕上げ（画像の生成は使わず、ラフの濃淡を線画に合わせてトーンと影にした。線画だけ直した4コマは線画の斜線から）。脚本の行を吹き出しと枠に置いた', adopted: 'LY-03 背景のトーン、LY-05 人物のトーン、LY-06 影、LY-09 吹き出し、LY-10 文字' },
  { phase: '通読', asked: '固定した版の通読と指摘の草案', adopted: '指摘の判断と完成の判断は作者（gm1-ep02-read）' },
];

export const EP02_OUTPUT: OutputEpisode = {
  no: 2,
  biblio: BIBLIO_EP02,
  roles: AI_ROLES_EP02,
  fixed: READ_VERSIONS_EP02.find((v) => v.artifact === 'gm1-ep02-finish')!,
  readCommit: READ_COMMIT_EP02,
  sourceFile: 'part1/finish/artifacts/gm1-ep02-finish.artifact.json',
  format: '第1話と同じ：原稿の枠 800×1180（縦横比 1:1.475）、PDF のページは 600×885 pt。作者の判断（2026-11-14）：このまま（A4 に合わせない）。第2話から白黒（作者の判断 2026-11-15）。',
  layers: 'LY-03〜LY-10',
  colophonIntro:
    'この話は、作者が決めた筋・コマ割り・判断のもとで、ラフと線画を AI の画像生成で作り、白黒の仕上げはラフの濃淡から付けました（仕上げに画像の生成は使っていません）。工程ごとに AI に頼んだことと、採ったものは次のとおりです。',
  version: 'output-ep02-v1',
  stamp: '2026-11-16T00:00:00.000Z',
  reason: 'ガリヴァー旅行記 第2話の出版準備（fiction-manga@1.3.0 出版準備：出力の記録。確かめるのは作者）',
};

export async function buildGulliverEp02Output(outputs: Outputs) {
  return buildEpisodeOutput(outputs, EP02_OUTPUT);
}
