/**
 * ガリヴァー旅行記 第2話「綱渡りの宮廷」のラフ。工程定義 fiction-manga@1.3.0 の「ラフ」（話ごと）の成果物。
 *
 * 第1話のラフ（gulliver-ep01-rough.ts）と同じ作り：ネーム（gm1-ep02-name@name-ep02-v1）と同じページとコマの
 * Design 原稿に、コマごとの LY-01 下絵（3D）・LY-02 アタリ（Codex のラフ絵）・LY-09 吹き出し（仮）・LY-10 文字（仮）。
 * ページ表と人物の絵の表は第1話と同じ列。ラフの採否と直しは作者（Ryo）。これは AI の提案。
 *
 * 第1話の学び（gm1-ep01-learning）を、ラフの説明（rough/src/episode-notes.py）に入れた：
 * LN-e01-01 主役が枠に入っているか、LN-e01-02 絵の中の物どうしの大きさの比べ、LN-e01-03 寄りのコマにも背景、
 * LN-e01-04 シーンをまたいで続く状態（左足首の鎖、都では短い胴着）、LN-e01-08 扉を先に作者に見せる。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import { buildEpisodeName, type StageInput } from './gulliver-ep01-name';
import { EP02_NAME } from './gulliver-ep02-name';
import { figureTable, pageTable, roughImages, ROUGH_UNDERLAY_OPACITY, type RoughInput } from './gulliver-ep01-rough';

/** ネームの固定した版（ラフのもと）。 */
export const NAME_VERSION_EP02 = 'gm1-ep02-name@name-ep02-v1';

/** 3D のカメラでは画角の外だが、ネームの絵のメモに合わせてラフに描いた人物の配置（第2話は無し）。 */
export const DRAWN_OUTSIDE_STAGE_EP02: Record<string, string> = {};

export function buildEpisode2Rough(stage: StageInput, rough: RoughInput) {
  const avoid = Object.fromEntries(Object.entries(rough.data.panels).map(([id, p]) => [id, p.occupancy]));
  return buildEpisodeName(2, EP02_NAME, stage, { rough: roughImages(rough, stage, NAME_VERSION_EP02), underlayOpacity: ROUGH_UNDERLAY_OPACITY, avoid });
}

const stamp = '2026-11-14T00:00:00.000Z';
const VERSION = 'rough-ep02-v2';
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
        reason: `ガリヴァー旅行記 第2話のラフ（fiction-manga@1.3.0 ラフ、${NAME_VERSION_EP02} から。AI の提案）`,
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

export async function buildGulliverEp02Rough(stage: StageInput, rough: RoughInput) {
  const build = buildEpisode2Rough(stage, rough);
  return {
    build,
    artifacts: [
      await native('design', 'gm1-ep02-rough', '第2話「綱渡りの宮廷」ラフ（16ページ）', build.content),
      await native('data', 'gm1-ep02-rough-pages', '第2話 ラフのページ表（資料・レイヤー・生成の記録）', pageTable(build.records, stage.data, rough.data, 2, NAME_VERSION_EP02)),
      await native('data', 'gm1-ep02-rough-figures', '第2話 ラフの人物の絵（FG ごと）', figureTable(build.records, stage.data, rough.data, DRAWN_OUTSIDE_STAGE_EP02)),
    ],
  };
}
