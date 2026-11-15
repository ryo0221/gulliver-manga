/**
 * ガリヴァー旅行記 第2話「綱渡りの宮廷」の通読（fiction-manga@1.3.0 通読、話ごと）。
 *
 * 第1話（gulliver-ep01-read.ts）と同じ作り：成果物は「編集の記録」(editorial-record)。仕上げた白黒の16ページを
 * 固定した版で1ページ目から読み、指摘を1件ずつ記録した。AI の指摘は提案で、判断は作者が決めるまで「作者の判断待ち」。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import { findingsTable, readDocument, type Finding, type ReadEpisode } from './gulliver-ep01-read';

/** 通読した固定した版（read.fixed-version）。 */
export const READ_VERSIONS_EP02 = [
  { artifact: 'gm1-ep02-finish', version: 'finish-ep02-v1', what: '第2話「綱渡りの宮廷」仕上げ（白黒、16ページ、Design）' },
  { artifact: 'gm1-ep02-lettering', version: 'finish-ep02-v1', what: '第2話 写植の記録' },
  { artifact: 'gm1-script-lines', version: 'script-v1', what: '第1部 脚本の行（台詞の全文の照合）' },
] as const;
/** その版が入っている gulliver-manga のコミット（PR #13 のマージ）。 */
export const READ_COMMIT_EP02 = '2373f55c0e8249cd1ef21296bb1c45fa78c57c59';

const WAIT = '作者の判断待ち' as const;
export const FINDINGS_EP02: Finding[] = [
  {
    id: 'RV-e02-01',
    target: 'e02-p03-k1',
    by: 'AI',
    when: '2026-11-15 通読',
    text: '3ページの大ゴマで、フリムナップが跳ぶ「地上12インチの細い糸」が、太い石の笠木（塀の上の縁）のように描かれていて、糸の上の芸に見えない。',
    decision: WAIT,
    reason: '提案：直す。線画から描き直す（ink-briefs.py の INK_NOTES に「二本の柱のあいだに張った細い糸、下は草地」を足して INK_ONLY）。仕上げは finish-mono.py をそのコマだけに使う。',
  },
  {
    id: 'RV-e02-02',
    target: 'e02-p07-k4',
    by: 'AI',
    when: '2026-11-15 通読',
    text: '7-4（引き：座るガリヴァーと、その前に立つボルゴラムの一行）で、ガリヴァーの頭が枠の上で切れている。顔を枠で切らない決まり（第1話の学び）に反する。',
    decision: WAIT,
    reason: '提案：直す。舞台のカメラを引いて少し上を向け、頭まで枠に入れて撮り直し、ラフ・線画・仕上げをそのコマだけ描き直す。',
  },
  {
    id: 'RV-e02-03',
    target: 'e02-p06-k1 e02-p06-k3 e02-p07-k1',
    by: 'AI',
    when: '2026-11-15 通読',
    text: '評議の間の奥の壁と長い卓に、まだらのグレーの斑が出ている（白黒の仕上げで、ラフの鉛筆のむらが影として残った）。',
    decision: WAIT,
    reason: '提案：直す。画像の生成は使わず、finish-mono.py で背景（LY-03）の広い領域には影を付けず、トーンを一つの濃さにする決まりを足し、そのコマだけ作り直す。',
  },
  {
    id: 'RV-e02-04',
    target: 'e02-p11-k1',
    by: 'AI',
    when: '2026-11-15 通読',
    text: '丘からの大引きで、城壁の奥の家々の屋根がガリヴァーの頭より高く見える。家はガリヴァーより遠いのに大きく、家の屋根が腿ほど（AR-01）という大きさの違いが伝わらない。',
    decision: WAIT,
    reason: '提案：直す。線画の説明に「家と城壁はガリヴァーの腿の高さまで」を足して描き直す（舞台の 3D は正しい大きさ）。',
  },
  {
    id: 'RV-e02-05',
    target: 'e02-p11-k2',
    by: 'AI',
    when: '2026-11-15 通読',
    text: '門へ近づくガリヴァーの脇の見張りの小人が、ガリヴァーの膝近くまである。小人は靴の長さほど（1/12）のはず。',
    decision: WAIT,
    reason: '提案：直す。線画から、小人を靴の長さほどに描き直す（第1話 RV-e01-04 と同じ直し方）。',
  },
  {
    id: 'RV-e02-06',
    target: 'e02-p16-k2',
    by: 'AI',
    when: '2026-11-15 通読',
    text: '寝そべるガリヴァーの頭の横の宮殿の窓が、頭より大きい。本文と舞台では窓は 4 × 6 インチで、15ページでは目ほどの大きさに描いている。',
    decision: WAIT,
    reason: '提案：直す。線画の説明に「窓はガリヴァーの目ほどの大きさ、壁は寝そべった頭の少し上まで」を足して描き直す。',
  },
  {
    id: 'RV-e02-07',
    target: 'e02-p05-k2',
    by: 'AI',
    when: '2026-11-15 通読',
    text: '勝った廷臣たちの顔が枠の外にある。',
    decision: '意図として残す',
    reason: 'ネームの寄り（勝った廷臣たちの腰に巻いた絹糸）のとおりで、顔を枠で切っているのではなく、顔を入れない構図。',
  },
  {
    id: 'RV-e02-08',
    target: 'e02-p12-k2',
    by: 'AI',
    when: '2026-11-14 ラフ',
    text: 'ネームの絵のメモは「上着の裾を押さえ」だが、原作では都で上着を脱ぎ、短い胴着だけで歩く。',
    decision: '意図として残す',
    reason: '作者の判断（2026-11-15「上着を脱いだままでいい」）：原作どおり上着を脱いだ姿で描く。ナレーション「短い胴着だけになって歩いた」と合う。',
  },
];

export const VERDICT_EP02 = {
  status: WAIT,
  decidedBy: '作者が決める',
  proposal:
    'RV-e02-01〜06 を直してから、直したコマを読み直す（どれもコマ単位の作り直しで、仕上げは画像の生成なし）。直した版を出版準備のもとにする。',
};

export const EP02_READ: ReadEpisode = {
  episode: 2,
  title: '綱渡りの宮廷',
  versions: READ_VERSIONS_EP02,
  readNote: `gulliver-manga のコミット ${READ_COMMIT_EP02.slice(0, 8)}（PR #13 のマージ）。ページは part1/finish/ep02/pages/page-01〜16.jpg。白黒の仕上げ。`,
  findings: FINDINGS_EP02,
  verdict: VERDICT_EP02,
};

const stamp = '2026-11-15T00:00:00.000Z';
const VERSION = 'read-ep02-v1';
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
        reason: 'ガリヴァー旅行記 第2話の通読（fiction-manga@1.3.0 通読：編集の記録。指摘の判断と完成の判断は作者）',
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

export async function buildGulliverEp02Read() {
  return [
    await native('document', 'gm1-ep02-read', '第2話「綱渡りの宮廷」編集の記録（通読）', readDocument(EP02_READ)),
    await native('data', 'gm1-ep02-read-findings', '第2話 通読の指摘', findingsTable(FINDINGS_EP02)),
  ];
}
