/**
 * ガリヴァー旅行記 第4話「火事」の通読（fiction-manga@1.3.0 通読、話ごと）。
 *
 * 第1話〜第3話と同じ作り：成果物は「編集の記録」(editorial-record)。仕上げた白黒の16ページを
 * 固定した版で1ページ目から読み、指摘を1件ずつ記録した。AI の指摘は提案で、判断は作者が決めるまで「作者の判断待ち」。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import { findingsTable, readDocument, type Finding, type ReadEpisode } from './gulliver-ep01-read';

/** 通読した固定した版（read.fixed-version）。 */
export const READ_VERSIONS_EP04 = [
  { artifact: 'gm1-ep04-finish', version: 'finish-ep04-v1', what: '第4話「火事」仕上げ（白黒、16ページ、Design）' },
  { artifact: 'gm1-ep04-lettering', version: 'finish-ep04-v1', what: '第4話 写植の記録' },
  { artifact: 'gm1-script-lines', version: 'script-v1', what: '第1部 脚本の行（台詞の全文の照合）' },
] as const;
/** 通読した版を main に入れたコミット（PR #23 のマージ）。 */
export const READ_COMMIT_EP04 = 'b7bc2633b4cc2c25c2bec6c4d5455840e5ea206f';

export const FINDINGS_EP04: Finding[] = [
  {
    id: 'RV-e04-01',
    target: 'e04-p01-k2 e04-p08-k3',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '1-2・8-3 の皇帝の顔が濃いグレーで、ほかのコマ（3-2・4-1・8-2・9-1）の明るい顔と肌の色が違って見え、同じ人に見えにくい。',
    decision: '作者の判断待ち',
    reason: '直す（提案）：仕上げで、この2コマの皇帝の顔と手のトーンをほかのコマと同じ明るさにする（finish-mono.py、線画とラフはそのまま）。',
  },
  {
    id: 'RV-e04-02',
    target: 'e04-p05-k1',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '5-1 でフリムナップがささやいている相手のボルゴラムが、部屋の反対側の遠くに立っていて、ささやきに見えない（ネームのメモ「ボルゴラムに顔を寄せてささやく」）。',
    decision: '作者の判断待ち',
    reason: '直す（提案）：ラフから描き直す。二人を玉座の脇に並べ、フリムナップがボルゴラムの耳もとに顔を寄せる。',
  },
  {
    id: 'RV-e04-03',
    target: 'e04-p04-k2',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '4-2 のフリムナップとボルゴラムが離れて立ち、コマの上半分が何も無い白い壁で、「玉座の脇で目を見交わす」に見えにくい。',
    decision: '作者の判断待ち',
    reason: '直す（提案）：5-1 と一緒にラフから描き直す。玉座を間に、二人が近くで目を見交わす。',
  },
  {
    id: 'RV-e04-04',
    target: 'e04-p12-k1',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '12-1 で、ガリヴァーが窓の並ぶ大きな建物の上の細い通路に立っているように見え、建物がガリヴァーより大きく見える（二の庭の建物は 1.52 m で、彼の胸の下まで）。',
    decision: '作者の判断待ち',
    reason: '直す（提案）：線画から描き直す。ガリヴァーは庭の地面に立ち、手前の二の庭の建物の屋根が彼の胸の下に来るようにする。',
  },
  {
    id: 'RV-e04-05',
    target: 'e04-p12-k2',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '12-2 で、奥のガリヴァーの靴（大きさの比べになる物）がナレーションの枠に隠れている。',
    decision: '作者の判断待ち',
    reason: '直す（提案）：写植で、ナレーションの枠を靴と脛にかからない左上へ動かす。',
  },
  {
    id: 'RV-e04-06',
    target: 'e04-p15-k3',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '15-3 の皇后と二人の侍女がコマの下に小さく、右半分が何も無い壁。侍女が顔を覆う仕草も読みにくい。',
    decision: '作者の判断待ち',
    reason: '直す（提案）：ラフから描き直す。皇后が背を向けて去る姿と、顔を覆う侍女を、コマの半分ほどの大きさで描く。',
  },
  {
    id: 'RV-e04-07',
    target: 'e04-p16-k1',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '16-1 で、王宮の外の大通りにひざまずくガリヴァーの後ろの建物が彼より高く大きい。16-2 では王宮の囲いの壁（2フィート、0.61 m）は彼の膝ほどで、大きさが合わない。',
    decision: '作者の判断待ち',
    reason: '直す（提案）：線画から描き直す。背景は低い囲いの壁と、その向こうの焼けた屋根で、どれも彼の肩より低く描く。',
  },
  {
    id: 'RV-e04-08',
    target: 'e04-p13-k1',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '13-1 の夜空に、細かい白いしみ（ラフのむらから出たトーン）が散っていて、雲に見えにくい。',
    decision: '作者の判断待ち',
    reason: '直す（提案）：仕上げで FLAT_BG にし、夜空を平らな濃いグレーにする（線画の雲の線は残す）。',
  },
  {
    id: 'RV-e04-09',
    target: 'e04-p09-k2',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '9-2 で庭を歩いて帰るガリヴァーの周りに、地面の線と空しか無い。',
    decision: '意図として残す',
    reason: '意図として残す（提案）：「何も知らずに帰る」ひとりの後ろ姿を、何も無い広い庭で見せる構図。',
  },
  {
    id: 'RV-e04-10',
    target: 'e04-p14-k2 e04-p15-k1',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '14-2・15-1 は人がいない建物の壁と屋根だけのコマ。',
    decision: '意図として残す',
    reason: '意図として残す（提案）：ネームのとおり、湯気に包まれた屋根と、焼け落ちた屋根を見せる「間」のコマ。',
  },
];

export const VERDICT_EP04 = {
  status: '作者の判断待ち',
  decidedBy: '作者',
  proposal:
    '仕上げた白黒の16ページ（finish-ep04-v1）を1ページ目から読んだ。台詞・ナレーション・効果音はすべて写植されている（写植の記録の確かめ）。話の流れ（拒否→使節→許しと告げ口→火事→消火→皇后の怒り→法）は読める。RV-e04-01〜08 を直してから読み直すのを提案する。RV-e04-09・10 は意図として残す提案。完成の判断は作者。',
};

export const EP04_READ: ReadEpisode = {
  episode: 4,
  title: '火事',
  versions: READ_VERSIONS_EP04,
  readNote: `${READ_VERSIONS_EP04[0].artifact}@${READ_VERSIONS_EP04[0].version}（コミット ${READ_COMMIT_EP04.slice(0, 8)}、PR #23 のマージ）を1ページ目から読んだ。ページは part1/finish/ep04/pages/page-01〜16.png。白黒の仕上げ。`,
  findings: FINDINGS_EP04,
  verdict: VERDICT_EP04,
};

const stamp = '2026-11-20T00:00:00.000Z';
const VERSION = 'read-ep04-v1';
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
        reason: 'ガリヴァー旅行記 第4話の通読（fiction-manga@1.3.0 通読：編集の記録。指摘の判断と完成の判断は作者）',
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

export async function buildGulliverEp04Read() {
  return [
    await native('document', 'gm1-ep04-read', '第4話「火事」編集の記録（通読）', readDocument(EP04_READ)),
    await native('data', 'gm1-ep04-read-findings', '第4話 通読の指摘', findingsTable(FINDINGS_EP04)),
  ];
}
