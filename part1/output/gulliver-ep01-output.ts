/**
 * ガリヴァー旅行記 第1話「人の山」の出版準備（fiction-manga@1.3.0 出版準備、話ごと）。
 *
 * 成果物は「出力の記録」(output-record、表)：出力物（形式ごとの出力物と、もとにした固定した版。レイヤーを
 * 残した元の原稿とまとめた出力物を分ける）、書誌情報と紹介文、AI の関わり。出力は export-ep.mjs が、
 * 通読で読んだ固定した版（gulliver-ep01-read.ts の READ_VERSIONS）から作る。確かめるのは作者（output.approved）。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import type { StructuredData } from '@editor-platform/structured-data/model';
import { READ_COMMIT, READ_VERSIONS } from './gulliver-ep01-read';

export type OutputFile = { file: string; format: 'PNG' | 'PDF'; page?: number; pages?: number; width?: number; height?: number; pointSize?: [number, number]; bytes: number; sha256: string };
export type Outputs = { name: string; scale: number; source: { artifactId: string; versionId: string; contentHash: string }; files: OutputFile[] };

/** 書誌情報と紹介文（AI の草案。題・著者名・紹介文は作者が決める）。 */
export const BIBLIO = {
  title: 'ガリヴァー旅行記　第1話「人の山」',
  series: 'ガリヴァー旅行記（全4部・24話）第1部 リリパット 第1話',
  author: '作者の確認待ち（作者名）',
  original: 'ジョナサン・スウィフト『ガリヴァー旅行記』（1726年）。本文は Project Gutenberg #829 の英語の原文から新しく訳した。',
  synopsis:
    '1699年、船医ガリヴァーはブリストルを出て南の海へ向かう。嵐で船は砕け、ひとり泳ぎ着いた浜で眠り込む。目を覚ますと、全身が細い紐で地面に留められ、胸の上を身の丈6インチの小人たちが歩いていた。矢の雨、食べ物の籠、そして運搬機で都の外の古い神殿へ。鎖につながれた「人の山」を、塔の上から皇帝が見下ろす。',
  blurb: '目を覚ますと、私は小人の国の囚人だった。原作に忠実に、大きさの違いを実寸の3Dで確かめながら描く、ガリヴァー旅行記の漫画連載。第1話は、難破から「人の山」と名づけられるまで。',
};

/** AI の関わり（工程ごとに、AI に頼んだことと、採った絵・レイヤー・台詞）。出口の規定：各話の最後に記す。 */
export const AI_ROLES: { phase: string; asked: string; adopted: string }[] = [
  { phase: '企画・人物と世界', asked: '企画書・画作りガイド・人物表・世界の覚え書き・地図の草案。設定画（Codex CLI の画像生成）', adopted: '作者が受け入れた設定画（CH-01〜07、小人、神殿、都）を、ラフ以降の参照に使った' },
  { phase: '筋と構成・脚本', asked: '原文からの新しい訳と、シーン・台詞・ト書きの草案', adopted: '作者が受け入れた脚本の行（gm1-script-lines@script-v1）をそのまま写植した。台詞は変えていない' },
  { phase: 'ネーム', asked: 'ページ割り・コマ・カメラと、3D の舞台（デジタルツイン）での人物の配置', adopted: 'コマ割りとカメラ（作者の確認と直しのあと）' },
  { phase: 'ラフ', asked: 'コマごとのラフ絵（Codex CLI の画像生成、3D のカメラの絵と設定画を渡した）', adopted: 'LY-02 アタリ（線画で隠して残した）' },
  { phase: '線画', asked: 'ラフをなぞった線画（3色で描かせ、色で LY-04・LY-07・LY-08 に分けた）。背景を描き足した5コマ', adopted: 'LY-04 背景の線画、LY-07 人物の線画、LY-08 効果（効果は AI の提案）' },
  { phase: '仕上げと写植', asked: '色の見本（Codex）を線画に合わせ、塗りと影に分けた。脚本の行を吹き出しと枠に置いた', adopted: 'LY-03 背景の塗り、LY-05 人物の塗り、LY-06 影、LY-09 吹き出し、LY-10 文字' },
  { phase: '通読', asked: '固定した版の通読と指摘の草案', adopted: '指摘の判断と完成の判断は作者（gm1-ep01-read）' },
];

const stamp = '2026-11-14T00:00:00.000Z';
const VERSION = 'output-ep01-v1';
async function native(kind: string, id: string, name: string, content: unknown) {
  const artifact: Artifact<unknown> = {
    schemaVersion: 1,
    id,
    name,
    kind,
    provenance: { source: 'created' },
    draft: { baseVersionId: VERSION, updatedAt: stamp, content: structuredClone(content) },
    versions: [
      {
        artifactId: id,
        versionId: VERSION,
        parentVersionId: null,
        schemaVersion: 1,
        createdAt: stamp,
        createdBy: null,
        reason: 'ガリヴァー旅行記 第1話の出版準備（fiction-manga@1.3.0 出版準備：出力の記録。確かめるのは作者）',
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

function outputTable(outputs: Outputs): StructuredData {
  const fixed = READ_VERSIONS.find((v) => v.artifact === 'gm1-ep01-finish')!;
  const src = `${outputs.source.artifactId}@${outputs.source.versionId}（contentHash ${outputs.source.contentHash.slice(0, 12)}、コミット ${READ_COMMIT.slice(0, 8)}）`;
  const rows: StructuredData['rows'] = [];
  const row = (id: string, section: string, item: string, value: string, source = '') =>
    rows.push({ id, values: { 'or.section': section, 'or.item': item, 'or.value': value, 'or.source': source } });
  // 出力物：レイヤーを残した元の原稿と、まとめた出力物を分ける。
  row('OR-e01-01', '出力物', '元の原稿（レイヤーを残す）', `${fixed.what}。Design（漫画ワークスペース）、コマごとに LY-03〜LY-10 のレイヤーのグループ。part1/finish/artifacts/gm1-ep01-finish.artifact.json`, `${fixed.artifact}@${fixed.version}`);
  const pngs = outputs.files.filter((f) => f.format === 'PNG');
  row('OR-e01-02', '出力物', 'PNG（ページごと）', `${pngs.length}枚、${pngs[0]!.width}×${pngs[0]!.height} px（原稿の枠 800×1180 の ${outputs.scale} 倍）。${pngs.map((f) => `${f.file} sha256:${f.sha256.slice(0, 12)}`).join('、')}`, src);
  for (const f of outputs.files.filter((x) => x.format === 'PDF'))
    row('OR-e01-03', '出力物', 'PDF（話ごと）', `${f.file}、${f.pages}ページ、${f.pointSize!.join('×')} pt。書き出しの元の版（references.json）を添付。sha256:${f.sha256.slice(0, 12)}、${Math.round(f.bytes / 1024)} KB`, src);
  row('OR-e01-04', '出力物', '判型', '原稿の枠は 800×1180（縦横比 1:1.475）。企画の「A4縦」（1:1.414）より縦長で、PDF のページは 600×885 pt（A4 は 595×842 pt）。A4 に合わせるかは作者が決める。');
  // 書誌情報と紹介文
  row('OR-e01-05', '書誌情報と紹介文', '題', BIBLIO.title);
  row('OR-e01-06', '書誌情報と紹介文', '連載', BIBLIO.series);
  row('OR-e01-07', '書誌情報と紹介文', '著者名', BIBLIO.author);
  row('OR-e01-08', '書誌情報と紹介文', '原作', BIBLIO.original);
  row('OR-e01-09', '書誌情報と紹介文', 'あらすじ', BIBLIO.synopsis);
  row('OR-e01-10', '書誌情報と紹介文', '紹介文', BIBLIO.blurb);
  // AI の関わり
  AI_ROLES.forEach((r, i) => row(`OR-e01-${String(11 + i).padStart(2, '0')}`, 'AI の関わり', r.phase, `頼んだこと：${r.asked}。採ったもの：${r.adopted}`));
  return {
    schemaVersion: 2,
    columns: [
      { id: 'or.section', name: '項目', type: 'select', options: ['出力物', '書誌情報と紹介文', 'AI の関わり'], required: true },
      { id: 'or.item', name: '中身', type: 'text', required: true },
      { id: 'or.value', name: '記録', type: 'text', required: true },
      { id: 'or.source', name: 'もとにした固定した版', type: 'text' },
    ],
    rows,
  };
}

export async function buildGulliverEp01Output(outputs: Outputs) {
  return [await native('data', 'gm1-ep01-output', '第1話 出力の記録', outputTable(outputs))];
}
