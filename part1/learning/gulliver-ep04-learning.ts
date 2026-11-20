/**
 * ガリヴァー旅行記 第4話「火事」の学び（fiction-manga@1.3.0 学び、話ごと）。
 *
 * 成果物は「学びの記録」(learning-record、表)：第4話の制作で分かったこと、どこで分かったか（指摘・工程）、
 * 次の話でどうするか。並べたのは AI の提案で、次の話に持ち込む学びを選ぶのは作者（learning.chosen）。
 * 第3話の学び（gulliver-ep03-learning.ts、作者が全部採った）を使って作り、新しく分かったことを並べた。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import type { StructuredData } from '@editor-platform/structured-data/model';

import type { Choice, Learning } from './gulliver-ep01-learning';

export const LEARNINGS_EP04: Learning[] = [
  {
    id: 'LN-e04-01', phase: 'ネーム・ラフ（建物との大きさ）',
    learned: '3D の舞台でカメラの近くにある壁や建物を、ラフと線画が「大きな建物」として写し、ガリヴァーが建物の上に立つ、建物が彼より大きい絵になった。ラフから描き直しても、1回目は 3D の手前の壁をまた写した。仕上げのトーンはラフから取るので、線画だけの描き直しでは合わない。',
    source: 'RV-e04-04（12-1）、RV-e04-07（16-1）、ラフ 12-1 の撮り直し',
    next: 'ネームで、ガリヴァーと建物が同じコマに入るときは、カメラの手前に壁を置かない。覚え書きに「建物の屋根は彼の胸の下」のように体のどこまでかを書く。大きさの直しは線画でなく、ラフから描き直す。',
  },
  {
    id: 'LN-e04-02', phase: 'ネーム（話す二人の間合い）',
    learned: '「ささやく」「目を見交わす」二人が、3D の舞台で離れて立っていたので、ラフでも部屋の反対側に描かれ、そう見えなかった。',
    source: 'RV-e04-02（5-1）、RV-e04-03（4-2）',
    next: 'ささやき・目配せ・手渡しのような近い仕草は、3D の舞台で二人を腕の届く間合い（1 m ほど、小人の大きさで）に置き、覚え書きに間合いを書く。',
  },
  {
    id: 'LN-e04-03', phase: 'ネーム・ラフ（人物の大きさ）',
    learned: '人物が去る・顔を覆うといった仕草のコマで、人物がコマの下に小さく、残りが何も無い壁になった。仕草が読めない。',
    source: 'RV-e04-06（15-3）',
    next: '仕草を見せるコマは、覚え書きに人物の大きさ（「コマの高さの半分ほど」）を書き、3D のカメラもその大きさに寄せる。',
  },
  {
    id: 'LN-e04-04', phase: '仕上げ（白黒、同じ人物の顔）',
    learned: '同じ皇帝の顔が、ラフの影の濃さのまま、コマによって濃いグレーになり、同じ人に見えにくかった。',
    source: 'RV-e04-01（1-2・8-3）',
    next: '仕上げのあと、主な人物の顔だけを話の中で並べて濃さを比べ、濃いコマは FACE_LIGHT で明るくしてから通読に出す。',
  },
  {
    id: 'LN-e04-05', phase: '写植（大きさの比べになる物）',
    learned: '吹き出しと枠は人物の頭を避けるが、大きさの比べになる物（奥のガリヴァーの靴と脛）は避けず、ナレーションの枠で隠れた。',
    source: 'RV-e04-05（12-2）',
    next: 'ネームの覚え書きで大きさの比べになる物を決め、写植で最初から避ける点（AVOID_EXTRA）にする。',
  },
  {
    id: 'LN-e04-06', phase: '仕上げ（白黒、夜空）',
    learned: '第3話の学び（LN-e03-04）で昼の空と海は最初から平らにしたが、夜空と煙の空はラフのむらが白いしみになった（11-1 は仕上げのとき、13-1 は通読で見つかった）。',
    source: 'RV-e04-08（13-1）、仕上げ 11-1',
    next: '仕上げの前に並べるコマに、夜空・煙の空も入れ、最初から FLAT_BG にする。',
  },
  {
    id: 'LN-e04-07', phase: '通読の直し（記録の参照）',
    learned: '第3話の学び（LN-e03-06）を採っていたのに、直した絵の記録がまた、前の絵のあるコミットを参照していた。ink-assets.py と finish-mono.py は渡したコミットをそのまま記録するので、直しの前のコミットを渡すと起きる。',
    source: 'PR #24 のレビュー（Codex）',
    next: '描き直した絵をコミットしてから、そのコミットを渡して記録を作り直す。push の前に、記録の参照すべてを git show（コミット:パス）の sha256 と照らすスクリプトを走らせる。',
  },
].map((l) => ({ ...l, choice: (l.id === 'LN-e04-06' ? '採らない' : '採る') as Choice }));
/** 作者の選択（learning.chosen）：2026-11-20「1,2,3,4,5,7」（LN-e04-06 は採らない）。第5話のネームから入れる。 */
export const CHOSEN_BY_EP04 = '作者（2026-11-20「1,2,3,4,5,7」）';

const stamp = '2026-11-20T00:00:00.000Z';
const VERSION = 'learning-ep04-v2';
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
        reason: 'ガリヴァー旅行記 第4話の学び（fiction-manga@1.3.0 学び：学びの記録。次の話に持ち込む学びを選ぶのは作者）',
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
    rows: LEARNINGS_EP04.map((l) => ({
      id: l.id,
      values: { 'ln.phase': l.phase, 'ln.learned': l.learned, 'ln.source': l.source, 'ln.next': l.next, 'ln.choice': l.choice },
    })),
  };
}

export async function buildGulliverEp04Learning() {
  return [await native('data', 'gm1-ep04-learning', '第4話 学びの記録', learningTable())];
}
