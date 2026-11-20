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
  { artifact: 'gm1-ep04-finish', version: 'finish-ep04-v2', what: '第4話「火事」仕上げ（白黒、16ページ、Design）' },
  { artifact: 'gm1-ep04-lettering', version: 'finish-ep04-v2', what: '第4話 写植の記録' },
  { artifact: 'gm1-script-lines', version: 'script-v1', what: '第1部 脚本の行（台詞の全文の照合）' },
] as const;
/** 完成とした版（直した版 finish-ep04-v2）を main に入れたコミット（PR #24 のマージ）。出版準備はここから作る。 */
export const READ_COMMIT_EP04 = 'd34fcab7f22d700c883172fe3acc255a2fecb95c';
/** はじめに通読した版。 */
export const FIRST_READ_EP04 = { finish: 'gm1-ep04-finish@finish-ep04-v1', commit: 'b7bc2633b4cc2c25c2bec6c4d5455840e5ea206f' };

export const FINDINGS_EP04: Finding[] = [
  {
    id: 'RV-e04-01',
    target: 'e04-p01-k2 e04-p08-k3',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '1-2・8-3 の皇帝の顔が濃いグレーで、ほかのコマ（3-2・4-1・8-2・9-1）の明るい顔と肌の色が違って見え、同じ人に見えにくい。',
    decision: '直す',
    reason: '作者の判断（2026-11-20「おすすめ通り直す」、提案どおり）：直す。仕上げで、この2コマの皇帝の顔のトーンを抜き、ほかのコマと同じ明るい顔にした（finish-mono.py の FACE_LIGHT、線画とラフはそのまま）。',
    fixedIn: 'gm1-ep04-finish@finish-ep04-v2',
  },
  {
    id: 'RV-e04-02',
    target: 'e04-p05-k1',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '5-1 でフリムナップがささやいている相手のボルゴラムが、部屋の反対側の遠くに立っていて、ささやきに見えない（ネームのメモ「ボルゴラムに顔を寄せてささやく」）。',
    decision: '直す',
    reason: '作者の判断（2026-11-20「おすすめ通り直す」、提案どおり）：直す。ラフから描き直した。二人を玉座の脇に並べ、フリムナップがボルゴラムの耳もとに顔を寄せてささやく。',
    fixedIn: 'gm1-ep04-finish@finish-ep04-v2（ラフ rough-ep04-v2、線画 ink-ep04-v2）',
  },
  {
    id: 'RV-e04-03',
    target: 'e04-p04-k2',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '4-2 のフリムナップとボルゴラムが離れて立ち、コマの上半分が何も無い白い壁で、「玉座の脇で目を見交わす」に見えにくい。',
    decision: '直す',
    reason: '作者の判断（2026-11-20「おすすめ通り直す」、提案どおり）：直す。ラフから描き直した。玉座の両脇で、二人が近くに立って目を見交わす。',
    fixedIn: 'gm1-ep04-finish@finish-ep04-v2（ラフ rough-ep04-v2、線画 ink-ep04-v2）',
  },
  {
    id: 'RV-e04-04',
    target: 'e04-p12-k1',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '12-1 で、ガリヴァーが窓の並ぶ大きな建物の上の細い通路に立っているように見え、建物がガリヴァーより大きく見える（二の庭の建物は 1.52 m で、彼の胸の下まで）。',
    decision: '直す',
    reason: '作者の判断（2026-11-20「おすすめ通り直す」、提案どおり）：直す。ラフから描き直した（線画だけでは下敷きの3Dの手前の壁に引っぱられるため）。ガリヴァーは庭の地面に立ち、その向こうの二の庭の低い建物の屋根が胸の下に来る。描き直しの1回目は前と同じ大きな壁になったので、手前の壁を描かない指示を足して描き直した。',
    fixedIn: 'gm1-ep04-finish@finish-ep04-v2（ラフ rough-ep04-v2、線画 ink-ep04-v2）',
  },
  {
    id: 'RV-e04-05',
    target: 'e04-p12-k2',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '12-2 で、奥のガリヴァーの靴（大きさの比べになる物）がナレーションの枠に隠れている。',
    decision: '直す',
    reason: '作者の判断（2026-11-20「おすすめ通り直す」、提案どおり）：直す。写植で、奥のガリヴァーの靴と脛を避ける点を足し（rough-assets.py の AVOID_EXTRA）、ナレーションの枠を左上へ動かした。',
    fixedIn: 'gm1-ep04-finish@finish-ep04-v2（ラフ rough-ep04-v2 の写植の避け）',
  },
  {
    id: 'RV-e04-06',
    target: 'e04-p15-k3',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '15-3 の皇后と二人の侍女がコマの下に小さく、右半分が何も無い壁。侍女が顔を覆う仕草も読みにくい。',
    decision: '直す',
    reason: '作者の判断（2026-11-20「おすすめ通り直す」、提案どおり）：直す。ラフから描き直した。背を向けて去る皇后と、顔を覆う二人の侍女を、コマの半分ほどの大きさで描く。',
    fixedIn: 'gm1-ep04-finish@finish-ep04-v2（ラフ rough-ep04-v2、線画 ink-ep04-v2）',
  },
  {
    id: 'RV-e04-07',
    target: 'e04-p16-k1',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '16-1 で、王宮の外の大通りにひざまずくガリヴァーの後ろの建物が彼より高く大きい。16-2 では王宮の囲いの壁（2フィート、0.61 m）は彼の膝ほどで、大きさが合わない。',
    decision: '直す',
    reason: '作者の判断（2026-11-20「おすすめ通り直す」、提案どおり）：直す。ラフから描き直した（仕上げのトーンがラフから来るため）。ひざまずくガリヴァーの後ろは低い町並みと焼けた屋根で、どれも彼の肩より低い。',
    fixedIn: 'gm1-ep04-finish@finish-ep04-v2（ラフ rough-ep04-v2、線画 ink-ep04-v2）',
  },
  {
    id: 'RV-e04-08',
    target: 'e04-p13-k1',
    by: 'AI',
    when: '2026-11-20 通読',
    text: '13-1 の夜空に、細かい白いしみ（ラフのむらから出たトーン）が散っていて、雲に見えにくい。',
    decision: '直す',
    reason: '作者の判断（2026-11-20「おすすめ通り直す」、提案どおり）：直す。仕上げで FLAT_BG にし、夜空を平らなグレーにした（線画の雲と煙の線は残す）。',
    fixedIn: 'gm1-ep04-finish@finish-ep04-v2',
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
  status: '完成',
  decidedBy: '作者（2026-11-20「マージして」「完成」）',
  proposal:
    '作者の判断（2026-11-20「おすすめ通り直す」）で RV-e04-01〜08 を直した版（finish-ep04-v2）を、直したページ（1・4・5・8・12・13・15・16）を中心に読み直した。12-1 は描き直しの1回目が前と同じ大きな壁の絵になったので、指示を足して描き直した。新しい指摘は無い。RV-e04-09・10 は意図として残す。指摘はすべて決まった。出版準備はこの版から作る。',
};

export const EP04_READ: ReadEpisode = {
  episode: 4,
  title: '火事',
  versions: READ_VERSIONS_EP04,
  readNote: `はじめの通読は ${FIRST_READ_EP04.finish}（コミット ${FIRST_READ_EP04.commit.slice(0, 8)}、PR #23 のマージ）を1ページ目から読み、指摘を直した版 ${READ_VERSIONS_EP04[0].version} を読み直した。ページは part1/finish/ep04/pages/page-01〜16.png。白黒の仕上げ。`,
  findings: FINDINGS_EP04,
  verdict: VERDICT_EP04,
};

const stamp = '2026-11-20T00:00:00.000Z';
const VERSION = 'read-ep04-v3';
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
