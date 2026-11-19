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
  { artifact: 'gm1-ep03-finish', version: 'finish-ep03-v2', what: '第3話「卵の端」仕上げ（白黒、16ページ、Design）' },
  { artifact: 'gm1-ep03-lettering', version: 'finish-ep03-v2', what: '第3話 写植の記録' },
  { artifact: 'gm1-script-lines', version: 'script-v1', what: '第1部 脚本の行（台詞の全文の照合）' },
] as const;
/** 完成とした版（直した版 finish-ep03-v2）を main に入れたコミット（PR #19 のマージ）。出版準備はここから作る。 */
export const READ_COMMIT_EP03 = '99527acc26d5a30027051f3463691a3191c773d6';
/** はじめに通読した版。 */
export const FIRST_READ_EP03 = { finish: 'gm1-ep03-finish@finish-ep03-v1', commit: '294641e2cf89cbac0ecba344f06fed2374bd4e88' };

export const FINDINGS_EP03: Finding[] = [
  {
    id: 'RV-e03-01',
    target: 'e03-p02-k2',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '2-2 で話しているレルドレサル（「一つは内の党派…」）の頭が枠の上の外にあり、首から下だけが見える。話す人の顔が見えず、誰が話しているか分かりにくい（顔を枠で切らない決まり）。',
    decision: '直す',
    reason: '作者の判断（2026-11-17「おすすめ通り直して」、提案どおり）：直す。舞台のカメラを引いて撮り直し（stage の revised）、ラフ・線画・仕上げを描き直した。コマは横に細く絵の上下が切れるので、ガリヴァーの顔は入れず（手のひらと袖だけ）、レルドレサルの全身と頭の上の余白を入れた。',
    fixedIn: 'gm1-ep03-finish@finish-ep03-v2（ラフ rough-ep03-v2、線画 ink-ep03-v2）',
  },
  {
    id: 'RV-e03-02',
    target: 'e03-p06-k1',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '6-1 で経典を引いて肩をすくめるレルドレサルも、頭が枠の上の外で、胸から下だけ。2-2 と同じく話す人の顔が無い。',
    decision: '直す',
    reason: '作者の判断（2026-11-17「おすすめ通り直して」、提案どおり）：直す。舞台のカメラを引いて撮り直し、ラフ・線画・仕上げを描き直した。ガリヴァーの頭は枠の上の外（胸と腕と手のひら）、レルドレサルの全身と頭の上の余白を入れた。',
    fixedIn: 'gm1-ep03-finish@finish-ep03-v2（ラフ rough-ep03-v2、線画 ink-ep03-v2）',
  },
  {
    id: 'RV-e03-03',
    target: 'e03-p04-k4',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '回想の 4-4 で指を切る「幼い王子（今の皇帝の祖父）」が、かつらと上着の大人の青年に見え、子どもに見えない。',
    decision: '直す',
    reason: '作者の判断（2026-11-17「おすすめ通り直して」、提案どおり）：直す。ラフの説明に「7歳ほどの子ども、かつら無し」を足してラフ・線画・仕上げを描き直した。',
    fixedIn: 'gm1-ep03-finish@finish-ep03-v2（ラフ rough-ep03-v2、線画 ink-ep03-v2）',
  },
  {
    id: 'RV-e03-04',
    target: 'e03-p12-k1',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '12-1 は、ネームでは「胸まで海につかって海峡を戻る」だが、水が脛ほどで、素足が水面の上に見え、海の上に立っているように見える。海峡の中ほどの深さ（約6フィート）とも合わない。',
    decision: '直す',
    reason: '作者の判断（2026-11-17「おすすめ通り直して」、提案どおり）：直す。ラフの説明に「水面は胸の高さ」を足してラフ・線画・仕上げを描き直した。',
    fixedIn: 'gm1-ep03-finish@finish-ep03-v2（ラフ rough-ep03-v2、線画 ink-ep03-v2）',
  },
  {
    id: 'RV-e03-05',
    target: 'e03-p12-k1',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '12-1 の手から艦隊へのびる綱の束の間が、白とグレーのくさび形の面で塗られ、綱の束に見えない（細い領域の仕上げのむら）。',
    decision: '直す',
    reason: '作者の判断（2026-11-17「おすすめ通り直して」、提案どおり）：直す。線画で綱を1本ずつの細い線にし、間を塗らないようにした（RV-e03-04 と一緒に描き直し）。',
    fixedIn: 'gm1-ep03-finish@finish-ep03-v2（線画 ink-ep03-v2）',
  },
  {
    id: 'RV-e03-06',
    target: 'e03-p16-k1 e03-p16-k2',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '16-1・16-2 で皇帝が立つ岸壁の上の台が、模様の無い灰色の板（3D の置き物のまま）に見える。',
    decision: '直す',
    reason: '作者の判断（2026-11-17「おすすめ通り直して」、提案どおり）：直す。線画の説明に「石を敷いた低い壇、縁に彫りのある石」を足して線画から描き直した（ラフはそのまま）。',
    fixedIn: 'gm1-ep03-finish@finish-ep03-v2（線画 ink-ep03-v2）',
  },
  {
    id: 'RV-e03-07',
    target: 'e03-p10-k2',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '効果音「ヒュンヒュンヒュン」が「ヒュンヒュンヒュ／ン」と折り返され、最後の「ン」だけが次の行にある。',
    decision: '直す',
    reason: '作者の判断（2026-11-17「おすすめ通り直して」、提案どおり）：直す。写植で、擬音は折り返さず1行に収まる大きさに字を小さくした（gulliver-ep01-name.ts。第1話・第2話の擬音は変わらない）。',
    fixedIn: 'gm1-ep03-finish@finish-ep03-v2',
  },
  {
    id: 'RV-e03-08',
    target: 'e03-p11-k1',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '11-1 だけ、胴着の前がひも締め（交差したひも）で、ほかのコマのボタン留めの胴着と違う。',
    decision: '直す',
    reason: '作者の判断（2026-11-17「おすすめ通り直して」、提案どおり）：直す。線画の説明に「ボタン留めの胴着」を足して線画から描き直した（ラフはそのまま）。',
    fixedIn: 'gm1-ep03-finish@finish-ep03-v2（線画 ink-ep03-v2）',
  },
  {
    id: 'RV-e03-09',
    target: 'e03-p15-k1 e03-p16-k3',
    by: 'AI',
    when: '2026-11-17 通読',
    text: '空に、線の無いグレーのしみが出ている（15-1 左下の帆柱の近く、16-3 右上）。仕上げのトーンの取り違え。',
    decision: '直す',
    reason: '作者の判断（2026-11-17「おすすめ通り直して」、提案どおり）：直す。仕上げ（finish-mono.py の SKY_WHITE）で、水平線より上の背景を白にした。',
    fixedIn: 'gm1-ep03-finish@finish-ep03-v2',
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
  status: '完成',
  decidedBy: '作者（2026-11-19「第3話を完成として、書き出しと学びも作りますか」に「完成として両方作る」）',
  proposal:
    '作者の判断（2026-11-17「おすすめ通り直して」）で RV-e03-01〜09 を直した版（finish-ep03-v2）を、直したページ（2・4・6・10・11・12・15・16）を中心に読み直した。2-2・6-1 で描き直しの1回目にガリヴァーの顔がコマの上で切れたので、顔を入れずに描き直した。RV-e03-10・11 は意図として残す。指摘はすべて決まった。出版準備はこの版から作る。',
};

export const EP03_READ: ReadEpisode = {
  episode: 3,
  title: '卵の端',
  versions: READ_VERSIONS_EP03,
  readNote: `はじめの通読は ${FIRST_READ_EP03.finish}（コミット ${FIRST_READ_EP03.commit.slice(0, 8)}、PR #18 のマージ）を1ページ目から読み、指摘を直した版 ${READ_VERSIONS_EP03[0].version} を読み直した。ページは part1/finish/ep03/pages/page-01〜16.png。白黒の仕上げ。`,
  findings: FINDINGS_EP03,
  verdict: VERDICT_EP03,
};

const stamp = '2026-11-17T00:00:00.000Z';
const VERSION = 'read-ep03-v3';
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
