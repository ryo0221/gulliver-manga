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
  { artifact: 'gm1-ep02-finish', version: 'finish-ep02-v3', what: '第2話「綱渡りの宮廷」仕上げ（白黒、16ページ、Design）' },
  { artifact: 'gm1-ep02-lettering', version: 'finish-ep02-v3', what: '第2話 写植の記録' },
  { artifact: 'gm1-script-lines', version: 'script-v1', what: '第1部 脚本の行（台詞の全文の照合）' },
] as const;
/** はじめに通読した版（直す前）。 */
export const FIRST_READ_EP02 = { finish: 'gm1-ep02-finish@finish-ep02-v1', commit: '2373f55c0e8249cd1ef21296bb1c45fa78c57c59' };

const WAIT = '作者の判断待ち' as const;
export const FINDINGS_EP02: Finding[] = [
  {
    id: 'RV-e02-01',
    target: 'e02-p03-k1',
    by: 'AI',
    when: '2026-11-15 通読',
    text: '3ページの大ゴマで、フリムナップが跳ぶ「地上12インチの細い糸」が、太い石の笠木（塀の上の縁）のように描かれていて、糸の上の芸に見えない。',
    decision: '直す',
    reason: '作者の判断（2026-11-15「これと提案の6件を直してください」、提案どおり）：直す。線画から描き直した（ink-briefs.py の INK_NOTES、INK_ONLY）。二本の細い柱のあいだの一本の細い糸の上高くを跳ぶ。',
    fixedIn: 'gm1-ep02-finish@finish-ep02-v3（線画 ink-ep02-v2）',
  },
  {
    id: 'RV-e02-02',
    target: 'e02-p07-k4',
    by: 'AI',
    when: '2026-11-15 通読',
    text: '7-4（引き：座るガリヴァーと、その前に立つボルゴラムの一行）で、ガリヴァーの頭が枠の上で切れている。顔を枠で切らない決まり（第1話の学び）に反する。',
    decision: '直す',
    reason: '作者の判断（2026-11-15「これと提案の6件を直してください」、提案どおり）：直す。舞台のカメラを後ろへ引いて少し上へ向けて撮り直し（stage の revised）、ラフ・線画・仕上げを描き直した。頭から靴まで枠に入る。',
    fixedIn: 'gm1-ep02-finish@finish-ep02-v3（線画 ink-ep02-v2、ラフ rough-ep02-v2）',
  },
  {
    id: 'RV-e02-03',
    target: 'e02-p06-k1 e02-p06-k3 e02-p07-k1',
    by: 'AI',
    when: '2026-11-15 通読',
    text: '評議の間の奥の壁と長い卓に、まだらのグレーの斑が出ている（白黒の仕上げで、ラフの鉛筆のむらが影として残った）。',
    decision: '直す',
    reason: '作者の判断（2026-11-15「これと提案の6件を直してください」、提案どおり）：直す。画像の生成は使わず、finish-mono.py の FLAT_BG で、背景と広い領域に影を付けず、トーンを強くぼかしたラフから取り、木目の小さな領域にもトーンを付けた。',
    fixedIn: 'gm1-ep02-finish@finish-ep02-v3',
  },
  {
    id: 'RV-e02-04',
    target: 'e02-p11-k1',
    by: 'AI',
    when: '2026-11-15 通読',
    text: '丘からの大引きで、城壁の奥の家々の屋根がガリヴァーの頭より高く見える。家はガリヴァーより遠いのに大きく、家の屋根が腿ほど（AR-01）という大きさの違いが伝わらない。',
    decision: '直す',
    reason: '作者の判断（2026-11-15「これと提案の6件を直してください」、提案どおり）：直す。線画の説明に大きさを足して描き直した。都は足もとの模型のように広がり、屋根は膝ほど。',
    fixedIn: 'gm1-ep02-finish@finish-ep02-v3（線画 ink-ep02-v2）',
  },
  {
    id: 'RV-e02-05',
    target: 'e02-p11-k2',
    by: 'AI',
    when: '2026-11-15 通読',
    text: '門へ近づくガリヴァーの脇の見張りの小人が、ガリヴァーの膝近くまである。小人は靴の長さほど（1/12）のはず。',
    decision: '直す',
    reason: '作者の判断（2026-11-15「これと提案の6件を直してください」、提案どおり）：直す。線画から、見張りの小人を靴の長さほどに描き直した。',
    fixedIn: 'gm1-ep02-finish@finish-ep02-v3（線画 ink-ep02-v2）',
  },
  {
    id: 'RV-e02-06',
    target: 'e02-p16-k2',
    by: 'AI',
    when: '2026-11-15 通読',
    text: '寝そべるガリヴァーの頭の横の宮殿の窓が、頭より大きい。本文と舞台では窓は 4 × 6 インチで、15ページでは目ほどの大きさに描いている。',
    decision: '直す',
    reason: '作者の判断（2026-11-15「これと提案の6件を直してください」、提案どおり）：直す。線画の説明に大きさを足して描き直した。窓は目ほどで、軒は頭のすぐ上。',
    fixedIn: 'gm1-ep02-finish@finish-ep02-v3（線画 ink-ep02-v2）',
  },
  {
    id: 'RV-e02-09',
    target: 'e02-p16-k1',
    by: '作者',
    when: '2026-11-15 通読',
    text: '16-1 コマ目、ガリバーの顔が鼻のみになっていて気持ち悪い。',
    decision: '直す',
    reason: '部屋の中から窓を撮っていたので、顔は窓いっぱいの鼻だけになっていた。窓の外の脇から撮り直し、ガリヴァーの横顔の全体と、窓から手を差し出す皇后を描き直した。あわせて、舞台のポーズの at は足ではなく腰で、寝そべるガリヴァーの頭が窓の壁から 1.1 m 南にあったので、このコマだけ腰を北へ寄せた。',
    fixedIn: 'gm1-ep02-finish@finish-ep02-v3（線画 ink-ep02-v2、ラフ rough-ep02-v2）',
  },
  {
    id: 'RV-e02-10',
    target: 'e02-p03-k1 e02-p11-k1 e02-p11-k2 e02-p16-k2',
    by: 'AI',
    when: '2026-11-15 直した版の見直し',
    text: '線画だけを描き直した4コマは、前のラフと構図が合わず、ラフからトーンを取ると灰色のむらが出た。線画の線と斜線の濃さからトーンを取ったので、他のコマより明るく、人物の輪郭に薄いグレーの縁が出る。',
    decision: WAIT,
    reason: '提案：このままでよい（読むのに差し支えない）。揃えるなら、4コマのラフを直した構図で描き直し（Codex で4枚）、ラフからトーンを取り直す。',
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
    'RV-e02-01〜06 と作者の指摘 RV-e02-09 を直した版（finish-ep02-v3）を、直したコマを中心に読み直した。完成とするかは作者の判断。',
};

export const EP02_READ: ReadEpisode = {
  episode: 2,
  title: '綱渡りの宮廷',
  versions: READ_VERSIONS_EP02,
  readNote: `はじめの通読は ${FIRST_READ_EP02.finish}（コミット ${FIRST_READ_EP02.commit.slice(0, 8)}、PR #13 のマージ）を読み、指摘を直した版を読み直した。ページは part1/finish/ep02/pages/page-01〜16.jpg。白黒の仕上げ。`,
  findings: FINDINGS_EP02,
  verdict: VERDICT_EP02,
};

const stamp = '2026-11-15T00:00:00.000Z';
const VERSION = 'read-ep02-v2';
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
