/**
 * ガリヴァー旅行記 第1話「人の山」の学び（fiction-manga@1.3.0 学び、話ごと）。
 *
 * 成果物は「学びの記録」(learning-record、表)：第1話の制作で分かったこと、どこで分かったか（指摘・工程）、
 * 次の話でどうするか。並べたのは AI の提案で、次の話に持ち込む学びを選ぶのは作者（learning.chosen）。
 * 選ぶまでは「作者の選択待ち」。次の話のネームの前に、選んだ学びを読む。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import type { StructuredData } from '@editor-platform/structured-data/model';

export type Choice = '作者の選択待ち' | '採る' | '採らない';
export type Learning = { id: string; learned: string; source: string; next: string; phase: string; choice: Choice };

export const LEARNINGS: Learning[] = [
  {
    id: 'LN-e01-01', phase: 'ネーム（舞台のカメラ）',
    learned: '小人の目の高さのカメラを小人のすぐ後ろに置くと、主役のはずの小人が枠の外になる。扉は描き直すまで弓の先しか写らなかった。',
    source: 'RV-e01-03（扉 1-1）',
    next: 'ネームの舞台の確認で、コマの主役（覚え書きに書いた人物）がカメラの絵の枠に入っているかを、コマごとに表で確かめる（rough-briefs の「outside the frame」を主役に出さない）。',
  },
  {
    id: 'LN-e01-02', phase: '線画（画像生成）',
    learned: '画像生成は小人を大きく描きがちで、「1/12」と書くだけでは守られない。「小人の全身はガリヴァーの顔ほど」「頭は目より小さい」と、絵の中の物どうしで大きさを書くと守られた。',
    source: 'RV-e01-04（12-3）、扉の描き直し',
    next: '大きさの違うコマ（小人と巨人、後の部ではブロブディンナグ）の指示に、絵の中の物どうしの大きさの比べを必ず入れる。',
  },
  {
    id: 'LN-e01-03', phase: '線画・仕上げ',
    learned: '背景の線の無いコマが、仕上げで白い地のまま残った（6コマ、あとで1コマ）。線画のページ表に「背景の線の無いコマ」は出ていたが、作者に見せたのは仕上げの後だった。',
    source: 'RV-e01-02、RV-e01-09',
    next: '線画の確認のときに、背景の線の無いコマを一覧で作者に見せ、描き足すかをその場で決める。寄りのコマにも空・地面・室内のどれかを描く。',
  },
  {
    id: 'LN-e01-04', phase: '線画（コマどうしのつながり）',
    learned: '鎖のような、コマをまたいで続く状態（左脚だけに鎖）が、コマごとの生成では崩れた。',
    source: 'RV-e01-07（15-2）',
    next: 'シーンごとに「続く状態」（鎖・縄・持ち物・傷・服の乱れ）を表にし、そのシーンのコマの指示に入れる。',
  },
  {
    id: 'LN-e01-05', phase: '仕上げ（塗り）',
    learned: '画像の生成に断られて人物の線だけで塗らせたコマ（8-1）は、背景の小物（杭）まで地の色になった。直すのに生成は要らず、線に囲まれた領域を決めて塗り直せた。',
    source: 'RV-e01-05（8-1）',
    next: '生成に断られたコマは、仕上げの確認で小物の色を先に見る。小物の色だけの直しは領域の塗り直し（REGION_FIX）でする。',
  },
  {
    id: 'LN-e01-06', phase: '通読',
    learned: '指摘でコマを「ページ-読む順」で書いたら、コマの ID（e01-p12-k3）と食い違った（12-2 と書いたのは 12-3）。',
    source: 'RV-e01-04',
    next: '指摘はコマの ID で書き、通読の表に縮めた絵を添えて取り違えを防ぐ。',
  },
  {
    id: 'LN-e01-07', phase: '出版準備',
    learned: '原稿の枠 800×1180 は企画の A4 縦より縦長。PDF に PNG のまま入れると 1話 110 MB になり、JPEG にして 24 MB になった。',
    source: '出版準備の試し書き出し（OR-e01-04）',
    next: '判型（A4 に合わせるか）を第2話のネームの前に作者が決める。PDF はページを JPEG で入れる。',
  },
  {
    id: 'LN-e01-08', phase: '進め方',
    learned: '作者の確認が工程の終わりに1度だと、前の工程に戻る直しが出る（扉はネームの舞台からやり直し）。',
    source: 'RV-e01-03、RV-e01-02',
    next: 'ネームの舞台とラフの段階で、扉と見開きの大きなコマだけは先に作者に見せる。',
  },
].map((l) => ({ ...l, choice: '作者の選択待ち' as Choice }));

const stamp = '2026-11-14T00:00:00.000Z';
const VERSION = 'learning-ep01-v1';
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
        reason: 'ガリヴァー旅行記 第1話の学び（fiction-manga@1.3.0 学び：学びの記録。次の話に持ち込む学びを選ぶのは作者）',
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

function learningTable(): StructuredData {
  return {
    schemaVersion: 2,
    columns: [
      { id: 'ln.phase', name: '工程', type: 'text', required: true },
      { id: 'ln.learned', name: '分かったこと', type: 'text', required: true },
      { id: 'ln.source', name: 'どこで（指摘・工程）', type: 'text', required: true },
      { id: 'ln.next', name: '次の話でどうする（AI の提案）', type: 'text', required: true },
      { id: 'ln.choice', name: '作者の選択', type: 'select', options: ['作者の選択待ち', '採る', '採らない'], required: true },
    ],
    rows: LEARNINGS.map((l) => ({
      id: l.id,
      values: { 'ln.phase': l.phase, 'ln.learned': l.learned, 'ln.source': l.source, 'ln.next': l.next, 'ln.choice': l.choice },
    })),
  };
}

export async function buildGulliverEp01Learning() {
  return [await native('data', 'gm1-ep01-learning', '第1話 学びの記録', learningTable())];
}
