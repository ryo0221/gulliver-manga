/**
 * ガリヴァー旅行記 第3話「卵の端」の仕上げと写植。工程定義 fiction-manga@1.3.0 の「仕上げと写植」の成果物。
 *
 * 第1話（gulliver-ep01-finish.ts）と同じ作り（ページとコマ、レイヤーの重ね順、動かせる吹き出し、ページ表、写植の記録）。
 * 第2話から白黒（第3話も同じ）：画像を生成せず、採ったラフ（gm1-ep03-rough@rough-ep03-v2 の鉛筆の絵）を線画の位置へ合わせ、
 * 線の間の領域ごとにグレーのトーンと影にした（part1/finish/src/finish-mono.py）。採否と直しは作者（Ryo）。AI の提案。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import type { StageInput } from './gulliver-ep01-name';
import { EP03_NAME } from './gulliver-ep03-name';
import type { RoughInput } from './gulliver-ep01-rough';
import type { InkInput } from './gulliver-ep01-ink';
import { buildEpisodeFinish, letteringTable, pageTable, type FinishInput } from './gulliver-ep01-finish';

/** 線画の固定した版（仕上げのもと）。 */
export const INK_VERSION_EP03 = 'gm1-ep03-ink@ink-ep03-v2';

export function buildEpisode3Finish(stage: StageInput, rough: RoughInput, ink: InkInput, fin: FinishInput) {
  return buildEpisodeFinish(stage, rough, ink, fin, { episode: 3, name: EP03_NAME, inkVersion: INK_VERSION_EP03 });
}

const stamp = '2026-11-17T00:00:00.000Z';
const VERSION = 'finish-ep03-v2';
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
        reason: `ガリヴァー旅行記 第3話の仕上げと写植（白黒。fiction-manga@1.3.0 仕上げと写植、${INK_VERSION_EP03} から。AI の提案）`,
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

export async function buildGulliverEp03Finish(stage: StageInput, rough: RoughInput, ink: InkInput, fin: FinishInput) {
  const build = buildEpisode3Finish(stage, rough, ink, fin);
  return {
    build,
    artifacts: [
      await native('design', 'gm1-ep03-finish', '第3話「卵の端」仕上げ（白黒、16ページ）', build.content),
      await native('data', 'gm1-ep03-finish-pages', '第3話 仕上げのページ表（資料・レイヤー・もとの記録）', pageTable(build.records, fin.data, 3, INK_VERSION_EP03)),
      await native('data', 'gm1-ep03-lettering', '第3話 写植の記録（吹き出しと文字ごと）', letteringTable(build.records, build.placed, 3)),
    ],
  };
}
