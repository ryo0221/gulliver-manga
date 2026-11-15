/**
 * ガリヴァー旅行記 第2話「綱渡りの宮廷」の線画。工程定義 fiction-manga@1.3.0 の「線画」（ページごと）の成果物。
 *
 * 第1話の線画（gulliver-ep01-ink.ts）と同じ作り：ラフ（gm1-ep02-rough@rough-ep02-v1）と同じページとコマの Design
 * 原稿に、隠して残す LY-01・LY-02 と、Codex に3色で描かせて色で分けた LY-04 背景・LY-07 人物・LY-08 効果。
 * 線・細部・人物の比率・コマどうしのつながりの確認（ink.approved）と直しは作者（Ryo）。これは AI の提案。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import type { StageInput } from './gulliver-ep01-name';
import { EP02_NAME } from './gulliver-ep02-name';
import type { RoughInput } from './gulliver-ep01-rough';
import { buildEpisodeInk, pageTable, type InkInput } from './gulliver-ep01-ink';

/** ラフの固定した版（線画のもと）。 */
export const ROUGH_VERSION_EP02 = 'gm1-ep02-rough@rough-ep02-v1';

export function buildEpisode2Ink(stage: StageInput, rough: RoughInput, ink: InkInput) {
  return buildEpisodeInk(stage, rough, ink, { episode: 2, name: EP02_NAME, roughVersion: ROUGH_VERSION_EP02 });
}

const stamp = '2026-11-15T00:00:00.000Z';
const VERSION = 'ink-ep02-v1';
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
        reason: `ガリヴァー旅行記 第2話の線画（fiction-manga@1.3.0 線画、${ROUGH_VERSION_EP02} から。AI の提案）`,
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

export async function buildGulliverEp02Ink(stage: StageInput, rough: RoughInput, ink: InkInput) {
  const build = buildEpisode2Ink(stage, rough, ink);
  return {
    build,
    artifacts: [
      await native('design', 'gm1-ep02-ink', '第2話「綱渡りの宮廷」線画（16ページ）', build.content),
      await native('data', 'gm1-ep02-ink-pages', '第2話 線画のページ表（資料・レイヤー・生成の記録）', pageTable(build.records, stage.data, ink.data, 2, ROUGH_VERSION_EP02)),
    ],
  };
}
