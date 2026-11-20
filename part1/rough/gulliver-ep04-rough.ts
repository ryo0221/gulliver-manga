/**
 * ガリヴァー旅行記 第4話「火事」のラフ。工程定義 fiction-manga@1.3.0 の「ラフ」（話ごと）の成果物。
 *
 * 第1話のラフ（gulliver-ep01-rough.ts）と同じ作り：ネーム（gm1-ep04-name@name-ep04-v1）と同じページとコマの
 * Design 原稿に、コマごとの LY-01 下絵（3D）・LY-02 アタリ（Codex のラフ絵）・LY-09 吹き出し（仮）・LY-10 文字（仮）。
 * ページ表と人物の絵の表は第1話と同じ列。ラフの採否と直しは作者（Ryo）。これは AI の提案。
 *
 * 第3話の学び（gm1-ep03-learning、作者 2026-11-19「採って」）を、ラフの説明（rough/src/episode-notes.py）に入れた：
 * LN-e03-01 細い段は上下が切れる（顔は縦の真ん中の帯へ）、LN-e03-02 脇役の年と背、LN-e03-05 着ている物の言い方をどこでも同じに
 * （1〜9ページは上着、10-2 から上着なしの白いシャツとボタン留めの淡い茶のチョッキ）。第2話までの学び（頭の位置は FK、顔の一部だけを
 * 見せない、大きさは 3D の数字、頭の上に1割の余白）と、夜（10〜14ページ、松明と炎）・朝（15〜16ページ）の明かりも入れた。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import { buildEpisodeName, type StageInput } from './gulliver-ep01-name';
import { EP04_NAME } from './gulliver-ep04-name';
import { figureTable, pageTable, roughImages, ROUGH_UNDERLAY_OPACITY, type RoughInput } from './gulliver-ep01-rough';

/** ネームの固定した版（ラフのもと）。 */
export const NAME_VERSION_EP04 = 'gm1-ep04-name@name-ep04-v1';

/** 3D のカメラでは画角の外だが、ネームの絵のメモに合わせてラフに描いた人物の配置（第4話は無し）。 */
export const DRAWN_OUTSIDE_STAGE_EP04: Record<string, string> = {};

export function buildEpisode4Rough(stage: StageInput, rough: RoughInput) {
  const avoid = Object.fromEntries(Object.entries(rough.data.panels).map(([id, p]) => [id, p.occupancy]));
  return buildEpisodeName(4, EP04_NAME, stage, { rough: roughImages(rough, stage, NAME_VERSION_EP04), underlayOpacity: ROUGH_UNDERLAY_OPACITY, avoid });
}

const stamp = '2026-11-19T00:00:00.000Z';
const VERSION = 'rough-ep04-v2';
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
        reason: `ガリヴァー旅行記 第4話のラフ（fiction-manga@1.3.0 ラフ、${NAME_VERSION_EP04} から。AI の提案）`,
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

export async function buildGulliverEp04Rough(stage: StageInput, rough: RoughInput) {
  const build = buildEpisode4Rough(stage, rough);
  return {
    build,
    artifacts: [
      await native('design', 'gm1-ep04-rough', '第4話「火事」ラフ（16ページ）', build.content),
      await native('data', 'gm1-ep04-rough-pages', '第4話 ラフのページ表（資料・レイヤー・生成の記録）', pageTable(build.records, stage.data, rough.data, 4, NAME_VERSION_EP04)),
      await native('data', 'gm1-ep04-rough-figures', '第4話 ラフの人物の絵（FG ごと）', figureTable(build.records, stage.data, rough.data, DRAWN_OUTSIDE_STAGE_EP04)),
    ],
  };
}
