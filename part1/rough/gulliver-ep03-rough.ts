/**
 * ガリヴァー旅行記 第3話「卵の端」のラフ。工程定義 fiction-manga@1.3.0 の「ラフ」（話ごと）の成果物。
 *
 * 第1話のラフ（gulliver-ep01-rough.ts）と同じ作り：ネーム（gm1-ep03-name@name-ep03-v1）と同じページとコマの
 * Design 原稿に、コマごとの LY-01 下絵（3D）・LY-02 アタリ（Codex のラフ絵）・LY-09 吹き出し（仮）・LY-10 文字（仮）。
 * ページ表と人物の絵の表は第1話と同じ列。ラフの採否と直しは作者（Ryo）。これは AI の提案。
 *
 * 第2話の学び（gm1-ep02-learning、作者 2026-11-17「全部いれてください」）を、ラフの説明（rough/src/episode-notes.py）に入れた：
 * LN-e02-01 頭の位置は 3D の舞台の FK（ポーズの at は腰）、LN-e02-02 顔の一部だけを見せない、LN-e02-03 大きさは 3D の数字、
 * LN-e02-04 細い物（綱・矢・鉤）は太さの比べと両端、LN-e02-05 巨人の頭の上に1割の余白。続く状態（上着を脱いだ革の胴着と裸足、眼鏡）も入れた。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import { buildEpisodeName, type StageInput } from './gulliver-ep01-name';
import { EP03_NAME } from './gulliver-ep03-name';
import { figureTable, pageTable, roughImages, ROUGH_UNDERLAY_OPACITY, type RoughInput } from './gulliver-ep01-rough';

/** ネームの固定した版（ラフのもと）。 */
export const NAME_VERSION_EP03 = 'gm1-ep03-name@name-ep03-v1';

/** 3D のカメラでは画角の外だが、ネームの絵のメモに合わせてラフに描いた人物の配置（第3話は無し）。 */
export const DRAWN_OUTSIDE_STAGE_EP03: Record<string, string> = {};

export function buildEpisode3Rough(stage: StageInput, rough: RoughInput) {
  const avoid = Object.fromEntries(Object.entries(rough.data.panels).map(([id, p]) => [id, p.occupancy]));
  return buildEpisodeName(3, EP03_NAME, stage, { rough: roughImages(rough, stage, NAME_VERSION_EP03), underlayOpacity: ROUGH_UNDERLAY_OPACITY, avoid });
}

const stamp = '2026-11-17T00:00:00.000Z';
const VERSION = 'rough-ep03-v1';
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
        reason: `ガリヴァー旅行記 第3話のラフ（fiction-manga@1.3.0 ラフ、${NAME_VERSION_EP03} から。AI の提案）`,
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

export async function buildGulliverEp03Rough(stage: StageInput, rough: RoughInput) {
  const build = buildEpisode3Rough(stage, rough);
  return {
    build,
    artifacts: [
      await native('design', 'gm1-ep03-rough', '第3話「卵の端」ラフ（16ページ）', build.content),
      await native('data', 'gm1-ep03-rough-pages', '第3話 ラフのページ表（資料・レイヤー・生成の記録）', pageTable(build.records, stage.data, rough.data, 3, NAME_VERSION_EP03)),
      await native('data', 'gm1-ep03-rough-figures', '第3話 ラフの人物の絵（FG ごと）', figureTable(build.records, stage.data, rough.data, DRAWN_OUTSIDE_STAGE_EP03)),
    ],
  };
}
