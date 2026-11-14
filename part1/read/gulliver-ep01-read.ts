/**
 * ガリヴァー旅行記 第1話「人の山」の通読（fiction-manga@1.3.0 通読、話ごと）。
 *
 * 成果物は「編集の記録」(editorial-record)：通読した固定した版、指摘ごとの対象・出し手・判断と理由、
 * 完成とするかの判断、意図して残した例外。指摘の表（gm1-ep01-read-findings）と文書（gm1-ep01-read）にする。
 * 指摘の判断（直す・直さない・意図として残す）と完成の判断は作者（read.approved）。AI の指摘は提案で、
 * 判断の欄は作者が決めるまで「作者の判断待ち」にしておく。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import { createDocument, type DocumentBlock } from '@editor-platform/document/model';
import type { StructuredData } from '@editor-platform/structured-data/model';

/** 通読した固定した版（read.fixed-version）。仕上げと写植の版を、そのまま通して読んだ。 */
export const READ_VERSIONS = [
  { artifact: 'gm1-ep01-finish', version: 'finish-ep01-v3', what: '第1話「人の山」仕上げ（16ページ、Design）' },
  { artifact: 'gm1-ep01-lettering', version: 'finish-ep01-v3', what: '第1話 写植の記録' },
  { artifact: 'gm1-script-lines', version: 'script-v1', what: '第1部 脚本の行（台詞の全文の照合）' },
] as const;
/** その版が入っている gulliver-manga のコミット（通読の指摘を直したコミット）。 */
export const READ_COMMIT = 'e0136eec628b83a5b8d53785347e6246efe6e12d';
/** はじめに通読した版（直す前）。 */
export const FIRST_READ = { finish: 'gm1-ep01-finish@finish-ep01-v2', commit: 'b520265b2e3d8c14353cb364eb3daefdd81fd921' };

export type Decision = '直す' | '直さない' | '意図として残す' | '作者の判断待ち';
export type Finding = {
  id: string;
  /** 対象：コマ（e01-p12-k5）、ページ（e01-p12）、シーン（SC-004）、台詞の行（SC-004.L12）。複数は空白で区切る。 */
  target: string;
  by: '作者' | 'AI';
  /** いつ・どの工程で出たか。 */
  when: string;
  text: string;
  decision: Decision;
  /** 判断の理由。作者の判断待ちのものは、AI の提案（直すなら何を、どの工程で）。 */
  reason: string;
  /** 直したときの、直した後の版（見直した版）。 */
  fixedIn?: string;
};

export const FINDINGS: Finding[] = [
  // ---- 作者の指摘（線画と仕上げの確認で出たもの。直して、直した後の版を見直した）
  {
    id: 'RV-e01-01',
    target: 'e01-p12-k5',
    by: '作者',
    when: '2026-11-14 線画の確認',
    text: '顔が切れていて不自然。',
    decision: '直す',
    reason: '片目だけが大きく枠で切れ、端に草があった。3D のカメラの絵に合わせ、両目・眉・鼻の付け根を、耳と髪まで枠に入れて描き直した。',
    fixedIn: 'gm1-ep01-ink@ink-ep01-v1（PR #8）',
  },
  {
    id: 'RV-e01-02',
    target: 'e01-p02-k2 e01-p03-k4 e01-p06-k1 e01-p08-k4 e01-p11-k5',
    by: '作者',
    when: '2026-11-14 仕上げの確認',
    text: '背景を描いて（背景が白いままのコマ）。',
    decision: '直す',
    reason: '背景の線を線画（LY-04）に描き足し、塗りと影を作り直した。人物の線と効果は変えていない。',
    fixedIn: 'gm1-ep01-finish@finish-ep01-v2（PR #9）',
  },
  // ---- AI の通読の指摘（固定した版を1ページ目から順に読んだもの）
  {
    id: 'RV-e01-03',
    target: 'e01-p01-k1',
    by: 'AI',
    when: '2026-11-14 通読',
    text: '扉：胸の上の小人が弓の先しか見えず、題のコマで大きさの違い（AR-05）が伝わらない。',
    decision: '直す',
    reason: '作者の判断（2026-11-14「おすすめです直して」、提案どおり）：直す。舞台のカメラを胸の上の小人の後ろの少し上（胸から 300 mm）へ引き、ラフ・線画・仕上げを描き直した。手前に弓を引く小人たちの背中、奥にガリヴァーの顔。',
    fixedIn: 'gm1-ep01-finish@finish-ep01-v3（線画 ink-ep01-v3、ラフ rough-ep01-v2）',
  },
  {
    id: 'RV-e01-04',
    target: 'e01-p09-k2 e01-p12-k3',
    by: 'AI',
    when: '2026-11-14 通読',
    text: '小人が大きすぎる：9-2 の弓を引く小人と、12-3 で顔の周りに集まる小人が、ガリヴァーの顔とほぼ同じ大きさに見える（AR-01：1/12）。',
    decision: '直す',
    reason: '作者の判断（2026-11-14「おすすめです直して」、提案どおり）：12ページ3コマ（胸の上で踊る小人たち）を直す。小人を実寸（1/12）で線画から描き直し、塗り直した。9-2 は手前の近さで説明できるので直していない。',
    fixedIn: 'gm1-ep01-finish@finish-ep01-v3（線画 ink-ep01-v3、ラフ rough-ep01-v2）',
  },
  {
    id: 'RV-e01-05',
    target: 'e01-p08-k1',
    by: 'AI',
    when: '2026-11-14 通読',
    text: '髪を留める杭が木の色でなく草の緑になっている。',
    decision: '直す',
    reason: '作者の判断（2026-11-14「おすすめです直して」、提案どおり）：直す。仕上げの塗りで、杭の中の小さな領域だけを木の茶色に塗り直した（finish-assets.py の REGION_FIX、線画はそのまま）。',
    fixedIn: 'gm1-ep01-finish@finish-ep01-v3（線画 ink-ep01-v3、ラフ rough-ep01-v2）',
  },
  {
    id: 'RV-e01-06',
    target: 'e01-p03-k1 e01-p11-k3',
    by: 'AI',
    when: '2026-11-14 仕上げ',
    text: '影がほとんど無いコマがある（仕上げのページ表の「影の無いコマ」）。',
    decision: '直さない',
    reason: '作者の判断（2026-11-14「おすすめです直して」、提案どおり）：直さない。昼の外の引きで、影が無くても読める。',
  },
  {
    id: 'RV-e01-07',
    target: 'e01-p15-k1 e01-p15-k2',
    by: 'AI',
    when: '2026-11-14 線画',
    text: '15-1 は左脚だけが鎖につながれているのに、15-2 では両脚に鎖がある。',
    decision: '直す',
    reason: '作者の判断（2026-11-14「おすすめです直して」、提案どおり）：直す。15-2 を線画から描き直し、鎖を左脚だけにして（南京錠つき）、塗り直した。',
    fixedIn: 'gm1-ep01-finish@finish-ep01-v3（線画 ink-ep01-v3、ラフ rough-ep01-v2）',
  },
  {
    id: 'RV-e01-08',
    target: 'e01-p16-k1',
    by: 'AI',
    when: '2026-11-14 通読',
    text: '神殿の門の前に立つガリヴァーが、門と同じくらいの背に見える。門は本文で高さ4フィート（1,219 mm）、ガリヴァーは 1,750 mm。',
    decision: '直さない',
    reason: '作者の判断（2026-11-14「おすすめです直して」、提案どおり）：直さない。カメラが塔の上で遠く、門はガリヴァーの胸ほどに見えている。',
  },
  {
    id: 'RV-e01-09',
    target: 'e01-p07-k2',
    by: 'AI',
    when: '2026-11-14 通読',
    text: '寝顔の大写しで、コマの右上が白い地のまま（背景を描き足した5コマと同じ様子）。',
    decision: '直す',
    reason: '作者の判断（2026-11-14「おすすめです直して」、提案どおり）：直す。夜空と星、草を線画（LY-04）に描き足し、夜の色で塗り直した。',
    fixedIn: 'gm1-ep01-finish@finish-ep01-v3（線画 ink-ep01-v3、ラフ rough-ep01-v2）',
  },
  {
    id: 'RV-e01-10',
    target: 'e01-p02-k2 e01-p02-k4',
    by: 'AI',
    when: '2026-11-14 仕上げ',
    text: '2-2 の馬の鼻先が栗毛、2-4 で男が向き合う馬は灰色。',
    decision: '意図として残す',
    reason: '二頭いる（灰と栗毛）。3D の舞台では栗毛の馬が手前で、2-2 はその鼻先。2-4 は灰の馬を正面から見る。',
  },
  {
    id: 'RV-e01-11',
    target: 'e01-p01-k2 e01-p02-k6',
    by: 'AI',
    when: '2026-11-14 通読',
    text: '序（SC-001）は約5年後の場面で、2ページの終わりから過去（1699年）へ戻る。時の飛びは手記の語り（2-6 のナレーション）だけで示している。',
    decision: '意図として残す',
    reason: '脚本どおりの語りの仕掛け（構成図 FS-01、第24話で同じシーンを再び出して閉じる）。めくりの頭（3ページ）で年号のナレーションが入る。',
  },
  // ---- 直した版（finish-ep01-v3）の見直し
  {
    id: 'RV-e01-12',
    target: 'e01-p12-k3',
    by: 'AI',
    when: '2026-11-14 直した版の見直し',
    text: '描き直した 12-3 で、ネームの覚え書きの「放り投げた樽」がコマの上の外に出て見えない。',
    decision: '作者の判断待ち',
    reason: '提案：直さない。台詞とナレーションは樽に触れておらず、前のコマ（12-2）で樽から飲んでいる。',
  },
];

/** 完成とするかの判断（作者）。作者が決めるまでは AI の見立てを書いておく。 */
export const VERDICT = {
  status: '作者の判断待ち',
  proposal:
    '提案：完成とする。RV-e01-03・04・05・07・09 を直した版（finish-ep01-v3）を1ページ目から読み直し、直した5コマで新しく気になったのは RV-e01-12 だけ（提案は直さない）。完成と決めるのは作者。',
};

// ---------------------------------------------------------------- 資料

const stamp = '2026-11-14T00:00:00.000Z';
const VERSION = 'read-ep01-v2';
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
        reason: 'ガリヴァー旅行記 第1話の通読（fiction-manga@1.3.0 通読：編集の記録。指摘の判断と完成の判断は作者）',
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

function findingsTable(): StructuredData {
  return {
    schemaVersion: 2,
    columns: [
      { id: 'rv.target', name: '対象（コマ・ページ・シーン・台詞の行）', type: 'text', required: true },
      { id: 'rv.by', name: '出し手', type: 'select', options: ['作者', 'AI'], required: true },
      { id: 'rv.when', name: 'いつ・どの工程で', type: 'text', required: true },
      { id: 'rv.text', name: '指摘', type: 'text', required: true },
      { id: 'rv.decision', name: '判断', type: 'select', options: ['直す', '直さない', '意図として残す', '作者の判断待ち'], required: true },
      { id: 'rv.reason', name: '理由（判断待ちは AI の提案）', type: 'text', required: true },
      { id: 'rv.fixedIn', name: '直した後の版', type: 'text' },
    ],
    rows: FINDINGS.map((f) => ({
      id: f.id,
      values: {
        'rv.target': f.target,
        'rv.by': f.by,
        'rv.when': f.when,
        'rv.text': f.text,
        'rv.decision': f.decision,
        'rv.reason': f.reason,
        'rv.fixedIn': f.fixedIn ?? '',
      },
    })),
  };
}

function readDocument() {
  const blocks: DocumentBlock[] = [];
  let n = 0;
  const id = () => `r1-${String(++n).padStart(4, '0')}`;
  const h = (level: number, text: string) => blocks.push({ ...createDocument().blocks[0], id: id(), type: 'heading', level, text });
  const p = (text: string) => blocks.push({ ...createDocument().blocks[1], id: id(), type: 'paragraph', text });
  h(1, 'ガリヴァー旅行記 第1話「人の山」編集の記録（通読）');
  p('工程定義 fiction-manga@1.3.0 の「通読」の成果物。指摘の判断と、完成とするかの判断は作者。AI の指摘は提案で、作者が決めるまで「作者の判断待ち」。');
  h(2, '通読した版');
  for (const v of READ_VERSIONS) p(`${v.what}：${v.artifact}@${v.version}`);
  p(`gulliver-manga のコミット ${READ_COMMIT.slice(0, 8)}（通読の指摘を直したコミット）。ページは part1/finish/pages/page-01〜16.jpg。はじめの通読は ${FIRST_READ.finish}（コミット ${FIRST_READ.commit.slice(0, 8)}）を読み、指摘を直した版を読み直した。`);
  h(2, '指摘');
  p('指摘ごとの表は gm1-ep01-read-findings（1指摘1行）。');
  for (const f of FINDINGS) {
    h(3, `${f.id}（${f.target}、${f.by}）`);
    p(f.text);
    p(`判断：${f.decision}。${f.reason}${f.fixedIn ? `直した後の版：${f.fixedIn}。` : ''}`);
  }
  h(2, '判断');
  p(`${VERDICT.status}。${VERDICT.proposal}`);
  h(2, '残した例外');
  for (const f of FINDINGS.filter((x) => x.decision === '意図として残す')) p(`${f.id}（${f.target}）：${f.text} ${f.reason}`);
  return { ...createDocument(), blocks };
}

export async function buildGulliverEp01Read() {
  return [
    await native('document', 'gm1-ep01-read', '第1話「人の山」編集の記録（通読）', readDocument()),
    await native('data', 'gm1-ep01-read-findings', '第1話 通読の指摘', findingsTable()),
  ];
}
