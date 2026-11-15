/**
 * ガリヴァー旅行記 第2話「綱渡りの宮廷」の仕上げと写植。工程定義 fiction-manga@1.3.0 の「仕上げと写植」の成果物。
 *
 * 第1話（gulliver-ep01-finish.ts）と同じ作り（ページとコマ、レイヤーの重ね順、動かせる吹き出し、ページ表、写植の記録）。
 * 第2話から白黒：画像を生成せず、採ったラフ（gm1-ep02-rough@rough-ep02-v2 の鉛筆の絵）を線画の位置へ合わせ、
 * 線の間の領域ごとにグレーのトーンと影にした（part1/finish/src/finish-mono.py）。採否と直しは作者（Ryo）。AI の提案。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import type { StageInput } from './gulliver-ep01-name';
import { EP02_NAME } from './gulliver-ep02-name';
import type { RoughInput } from './gulliver-ep01-rough';
import type { InkInput } from './gulliver-ep01-ink';
import { buildEpisodeFinish, letteringTable, pageTable, type FinishInput } from './gulliver-ep01-finish';

/** 線画の固定した版（仕上げのもと）。 */
export const INK_VERSION_EP02 = 'gm1-ep02-ink@ink-ep02-v2';

export function buildEpisode2Finish(stage: StageInput, rough: RoughInput, ink: InkInput, fin: FinishInput) {
  return buildEpisodeFinish(stage, rough, ink, fin, { episode: 2, name: EP02_NAME, inkVersion: INK_VERSION_EP02 });
}

const stamp = '2026-11-15T00:00:00.000Z';
const VERSION = 'finish-ep02-v3';
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
        reason: `ガリヴァー旅行記 第2話の仕上げと写植（白黒。fiction-manga@1.3.0 仕上げと写植、${INK_VERSION_EP02} から。AI の提案）`,
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

export async function buildGulliverEp02Finish(stage: StageInput, rough: RoughInput, ink: InkInput, fin: FinishInput) {
  const build = buildEpisode2Finish(stage, rough, ink, fin);
  return {
    build,
    artifacts: [
      await native('design', 'gm1-ep02-finish', '第2話「綱渡りの宮廷」仕上げ（白黒、16ページ）', build.content),
      await native('data', 'gm1-ep02-finish-pages', '第2話 仕上げのページ表（資料・レイヤー・もとの記録）', pageTable(build.records, fin.data, 2, INK_VERSION_EP02)),
      await native('data', 'gm1-ep02-lettering', '第2話 写植の記録（吹き出しと文字ごと）', letteringTable(build.records, build.placed, 2)),
    ],
  };
}
