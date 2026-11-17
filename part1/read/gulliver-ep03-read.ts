/**
 * ガリヴァー旅行記 第3話「卵の端」の通読（fiction-manga@1.3.0 通読、話ごと）。
 *
 * 第1話・第2話と同じ作り：成果物は「編集の記録」(editorial-record)。仕上げた白黒の16ページを
 * 固定した版で1ページ目から読み、指摘を1件ずつ記録した。AI の指摘は提案で、判断は作者が決めるまで「作者の判断待ち」。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import { findingsTable, readDocument, type Finding, type ReadEpisode } from './gulliver-ep01-read';

/** 通読した固定した版（read.fixed-version）。 */
/** 通読した固定した版（read.fixed-version）。 */
export const READ_VERSIONS_EP03 = [
  { artifact: 'gm1-ep03-finish', version: 'finish-ep03-v1', what: '第3話「卵の端」仕上げ（白黒、16ページ、Design）' },
  { artifact: 'gm1-ep03-lettering', version: 'finish-ep03-v1', what: '第3話 写植の記録' },
  { artifact: 'gm1-script-lines', version: 'script-v1', what: '第1部 脚本の行（台詞の全文の照合）' },
] as const;
/** 通読した版を main に入れたコミット（PR #18 のマージ）。 */
export const READ_COMMIT_EP03 = '294641e2cf89cbac0ecba344f06fed2374bd4e88';

export const FINDINGS_EP03: Finding[] = [
  {
    id: 'RV-e03-01',
    target: 'e03-p02-k2',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '2-2 で話しているレルドレサル（「一つは内の党派…」）の頭が枠の上の外にあり、首から下だけが見える。話す人の顔が見えず、誰が話しているか分かりにくい（顔を枠で切らない決まり）。',
    decision: '作者の判断待ち',
    reason: '提案：直す。舞台のカメラを引いて少し上へ向け、手のひらとレルドレサルの全身（顔まで）を入れて撮り直し、ラフ・線画・仕上げを描き直す。',
  },
  {
    id: 'RV-e03-02',
    target: 'e03-p06-k1',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '6-1 で経典を引いて肩をすくめるレルドレサルも、頭が枠の上の外で、胸から下だけ。2-2 と同じく話す人の顔が無い。',
    decision: '作者の判断待ち',
    reason: '提案：直す（RV-e03-01 と同じやり方）。',
  },
  {
    id: 'RV-e03-03',
    target: 'e03-p04-k4',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '回想の 4-4 で指を切る「幼い王子（今の皇帝の祖父）」が、かつらと上着の大人の青年に見え、子どもに見えない。',
    decision: '作者の判断待ち',
    reason: '提案：直す。線画の説明に「6〜8歳ほどの子ども、背は大人の胸ほど、かつら無し」を足して線画から描き直す（舞台の人物は子どもの大きさ）。',
  },
  {
    id: 'RV-e03-04',
    target: 'e03-p12-k1',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '12-1 は、ネームでは「胸まで海につかって海峡を戻る」だが、水が脛ほどで、素足が水面の上に見え、海の上に立っているように見える。海峡の中ほどの深さ（約6フィート）とも合わない。',
    decision: '作者の判断待ち',
    reason: '提案：直す。線画の説明に「水面は胸の高さ、腰から下は水の中で見えない」を足して描き直す。',
  },
  {
    id: 'RV-e03-05',
    target: 'e03-p12-k1',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '12-1 の手から艦隊へのびる綱の束の間が、白とグレーのくさび形の面で塗られ、綱の束に見えない（細い領域の仕上げのむら）。',
    decision: '作者の判断待ち',
    reason: '提案：直す。仕上げで綱の間の細い領域を海のトーンにそろえる（RV-e03-04 で描き直すなら、その線画で作り直す）。',
  },
  {
    id: 'RV-e03-06',
    target: 'e03-p16-k1 e03-p16-k2',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '16-1・16-2 で皇帝が立つ岸壁の上の台が、模様の無い灰色の板（3D の置き物のまま）に見える。',
    decision: '作者の判断待ち',
    reason: '提案：直す。線画の説明に「石を敷いた低い壇、縁に石の目地」を足して線画から描き直す。',
  },
  {
    id: 'RV-e03-07',
    target: 'e03-p10-k2',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '効果音「ヒュンヒュンヒュン」が「ヒュンヒュンヒュ／ン」と折り返され、最後の「ン」だけが次の行にある。',
    decision: '作者の判断待ち',
    reason: '提案：直す。写植で効果音の幅を広げて1行にする（絵は変えない）。',
  },
  {
    id: 'RV-e03-08',
    target: 'e03-p11-k1',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '11-1 だけ、胴着の前がひも締め（交差したひも）で、ほかのコマのボタン留めの胴着と違う。',
    decision: '作者の判断待ち',
    reason: '提案：直す。線画の説明に「ほかのコマと同じボタン留めの胴着」を足して描き直す。小さな違いなので、このままでもよい。',
  },
  {
    id: 'RV-e03-09',
    target: 'e03-p15-k1 e03-p16-k3',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '空に、線の無いグレーのしみが出ている（15-1 左下の帆柱の近く、16-3 右上）。仕上げのトーンの取り違え。',
    decision: '作者の判断待ち',
    reason: '提案：直す。仕上げで、そのしみの領域を空と同じ白にする（絵は変えない）。',
  },
  {
    id: 'RV-e03-10',
    target: 'e03-p09-k2',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '9-2 はガリヴァーの頭が枠の上の外で、首から下だけ。',
    decision: '意図として残す',
    reason: '意図として残す（提案）：ネームのメモ「海に踏み込む大きな足。しぶき」のとおり、足としぶきの寄りで、顔を入れない構図。',
  },
  {
    id: 'RV-e03-11',
    target: 'e03-p05-k2',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '回想の 5-2 で、卓の上の卵が大きく、大きさを比べる物が無い。',
    decision: '意図として残す',
    reason: '意図として残す（提案）：小人の目の高さから卓の上の卵を見た寄りで、回想の中は小人の世界なので、ガリヴァーとの比べは要らない。',
  },
];

export const VERDICT_EP03 = {
  status: '作者の判断待ち',
  decidedBy: '作者',
  proposal:
    '話の流れ（二つの災い → 卵の端の由来 → 艦隊を奪う → ナルダック → 皇帝の欲）は16ページで通り、台詞・ナレーション・効果音はすべて脚本どおり。RV-e03-01〜09 を直してから完成とするのを勧める。RV-e03-07・09 は写植と仕上げだけで直せる。',
};

export const EP03_READ: ReadEpisode = {
  episode: 3,
  title: '卵の端',
  versions: READ_VERSIONS_EP03,
  readNote: `${READ_VERSIONS_EP03[0].artifact}@${READ_VERSIONS_EP03[0].version}（コミット ${READ_COMMIT_EP03.slice(0, 8)}、PR #18 のマージ）を1ページ目から読んだ。ページは part1/finish/ep03/pages/page-01〜16.png。白黒の仕上げ。`,
  findings: FINDINGS_EP03,
  verdict: VERDICT_EP03,
};

const stamp = '2026-11-17T00:00:00.000Z';
const VERSION = 'read-ep03-v1';
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
        reason: 'ガリヴァー旅行記 第3話の通読（fiction-manga@1.3.0 通読：編集の記録。指摘の判断と完成の判断は作者）',
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

export async function buildGulliverEp03Read() {
  return [
    await native('document', 'gm1-ep03-read', '第3話「卵の端」編集の記録（通読）', readDocument(EP03_READ)),
    await native('data', 'gm1-ep03-read-findings', '第3話 通読の指摘', findingsTable(FINDINGS_EP03)),
  ];
}
