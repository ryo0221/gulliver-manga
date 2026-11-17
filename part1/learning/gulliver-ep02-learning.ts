/**
 * ガリヴァー旅行記 第2話「綱渡りの宮廷」の学び（fiction-manga@1.3.0 学び、話ごと）。
 *
 * 成果物は「学びの記録」(learning-record、表)：第1話の制作で分かったこと、どこで分かったか（指摘・工程）、
 * 次の話でどうするか。並べたのは AI の提案で、次の話に持ち込む学びを選ぶのは作者（learning.chosen）。
 * 第1話の学び（gulliver-ep01-learning.ts）を持ち込んで作り、新しく分かったことを並べた。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import type { StructuredData } from '@editor-platform/structured-data/model';

import type { Choice, Learning } from './gulliver-ep01-learning';

export const LEARNINGS_EP02: Learning[] = [
  {
    id: 'LN-e02-01', phase: 'ネーム（3D の舞台）',
    learned: 'ポーズの置き場所 at は足ではなく腰で、寝そべる体は頭が at から約 0.9 m 先にある。足のつもりで置いたので、窓を覗くはずのガリヴァーの頭が窓から 1.1 m 離れ、15〜16ページの舞台の絵に顔が写らなかった。',
    source: 'RV-e02-09（16-1）',
    next: '舞台の確認で、コマの主役の頭の位置（3D の座標）を、覗く窓・手・相手など狙った物との距離で表にし、離れていたら置き直してから撮る。',
  },
  {
    id: 'LN-e02-02', phase: 'ネーム・ラフ（顔の見せ方）',
    learned: '窓や枠の縁で顔の一部だけ（鼻と口だけ）が見えるコマは、読む人に気持ち悪く見える。ネームの覚え書きに「窓には唇・鼻・顎だけ」と書いたことが、そのまま絵になった。',
    source: 'RV-e02-09（16-1、作者の指摘）',
    next: '顔は「目を含めて見せる」か「見せない（後ろ姿・影）」のどちらかにする。顔の一部だけを覗かせる構図は使わない。覚え書きにも書かない。',
  },
  {
    id: 'LN-e02-03', phase: 'ネーム（大きさの比べ）',
    learned: '絵の中の物どうしの大きさを書いても（LN-e01-02）、都の家・見張りの小人・宮殿の窓がガリヴァーに比べて大きく描かれた。言葉の比べだけでは足りず、描き直しでは 3D の絵の上の大きさ（家の高さはガリヴァーの膝まで、など）を書いて守られた。',
    source: 'RV-e02-04（11-1）、RV-e02-05（11-2）、RV-e02-06（16-2）',
    next: '大きさの違うコマは、3D の舞台の絵から「巨人の体のどこまで」で小人・家・窓の大きさを測り、ラフと線画の指示に数字で入れる。',
  },
  {
    id: 'LN-e02-04', phase: 'ラフ・線画（細い物）',
    learned: '「地上12インチの細い糸」が太い石の縁のように描かれ、糸の上の芸に見えなかった。3D の舞台の糸は細すぎて絵に写らず、画像の生成は手近な太い物に置き換えた。',
    source: 'RV-e02-01（3-1）',
    next: '糸・綱・鎖・矢のような細い物は、指示に「指より細い」「人物の腕より細い」と太さの比べを書き、両端の支え（柱・手）を必ず描かせる。',
  },
  {
    id: 'LN-e02-05', phase: 'ネーム（カメラの引き）',
    learned: '座った巨人や立った巨人を引きで撮っても、頭が枠の上で切れた（7-4）。カメラの絵では切れていなかったが、ラフで体が大きく描かれた。',
    source: 'RV-e02-02（7-4）',
    next: '巨人の全身を見せるコマは、カメラの絵で頭の上にコマの1割の余白を残して撮る。',
  },
  {
    id: 'LN-e02-06', phase: '仕上げ（白黒）',
    learned: '白黒の仕上げは、ラフの濃淡を線画に合わせてトーンにした。広い壁や卓はむらになり（FLAT_BG で平らにした）、線画だけ描き直したコマは前のラフと合わず、線画の斜線からトーンを取ったので少し明るくなった。',
    source: 'RV-e02-03（6-1・6-3・7-1）、RV-e02-10',
    next: '広い室内のコマは最初から FLAT_BG にする。線画を描き直すときは、構図が変わるならラフも描き直してからトーンを取る。',
  },
].map((l) => ({ ...l, choice: '作者の選択待ち' as Choice }));
/** 作者の選択（learning.chosen）：まだ。第3話のネームでは提案として使い、作者の選択で外す。 */
export const CHOSEN_BY_EP02 = '作者の選択待ち';

const stamp = '2026-11-17T00:00:00.000Z';
const VERSION = 'learning-ep02-v1';
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
        reason: 'ガリヴァー旅行記 第2話の学び（fiction-manga@1.3.0 学び：学びの記録。次の話に持ち込む学びを選ぶのは作者）',
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
    rows: LEARNINGS_EP02.map((l) => ({
      id: l.id,
      values: { 'ln.phase': l.phase, 'ln.learned': l.learned, 'ln.source': l.source, 'ln.next': l.next, 'ln.choice': l.choice },
    })),
  };
}

export async function buildGulliverEp02Learning() {
  return [await native('data', 'gm1-ep02-learning', '第2話 学びの記録', learningTable())];
}
