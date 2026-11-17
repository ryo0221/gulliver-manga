/**
 * ガリヴァー旅行記 第3話「卵の端」の線画。工程定義 fiction-manga@1.3.0 の「線画」（ページごと）の成果物。
 *
 * 第1話・第2話の線画と同じ作り：ラフ（gm1-ep03-rough@rough-ep03-v2）と同じページとコマの Design
 * 原稿に、隠して残す LY-01・LY-02 と、Codex に3色で描かせて色で分けた LY-04 背景・LY-07 人物・LY-08 効果。
 * 線・細部・人物の比率・コマどうしのつながりの確認（ink.approved）と直しは作者（Ryo）。これは AI の提案。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import type { StageInput } from './gulliver-ep01-name';
import { EP03_NAME } from './gulliver-ep03-name';
import type { RoughInput } from './gulliver-ep01-rough';
import { buildEpisodeInk, pageTable, type InkInput } from './gulliver-ep01-ink';

/** ラフの固定した版（線画のもと）。 */
export const ROUGH_VERSION_EP03 = 'gm1-ep03-rough@rough-ep03-v2';

export function buildEpisode3Ink(stage: StageInput, rough: RoughInput, ink: InkInput) {
  return buildEpisodeInk(stage, rough, ink, { episode: 3, name: EP03_NAME, roughVersion: ROUGH_VERSION_EP03 });
}

const stamp = '2026-11-17T00:00:00.000Z';
const VERSION = 'ink-ep03-v2';
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
        reason: `ガリヴァー旅行記 第3話の線画（fiction-manga@1.3.0 線画、${ROUGH_VERSION_EP03} から。AI の提案）`,
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

export async function buildGulliverEp03Ink(stage: StageInput, rough: RoughInput, ink: InkInput) {
  const build = buildEpisode3Ink(stage, rough, ink);
  return {
    build,
    artifacts: [
      await native('design', 'gm1-ep03-ink', '第3話「卵の端」線画（16ページ）', build.content),
      await native('data', 'gm1-ep03-ink-pages', '第3話 線画のページ表（資料・レイヤー・生成の記録）', pageTable(build.records, stage.data, ink.data, 3, ROUGH_VERSION_EP03)),
    ],
  };
}
