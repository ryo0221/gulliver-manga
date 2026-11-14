/**
 * ガリヴァー旅行記 第1話「人の山」のラフ。工程定義 fiction-manga@1.2.0 の「ラフ」（話ごと）の成果物。
 *
 * - ネーム（gm1-ep01-name@name-ep01-v2）と同じページとコマ（PN の ID はそのまま）の Design 原稿。
 *   コマごとに、画作りガイドのラフのレイヤー LY-01 下絵（3D）・LY-02 アタリ・LY-09 吹き出し（仮）・LY-10 文字（仮）の
 *   グループを作る。LY-02 には、3D の舞台のカメラの絵を構図の型にして Codex の画像生成で描いたラフ絵を置く。
 * - ページごとの使った資料・レイヤー・生成の記録の表と、人物の配置（FG）ごとの絵の表を作る。
 * - ラフの採否と直しは作者（Ryo）。これは AI の提案。
 *
 * editor-platform の作業ツリーで apps/artifact-host/src/creative/story-board/ に置いて使う（commit しない）。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import type { DesignContent } from '@editor-platform/design/model';
import type { StructuredData } from '@editor-platform/structured-data/model';
import {
  buildEpisodeName,
  EP01_NAME,
  LAYERS,
  type EpisodeStage,
  type PanelRecord,
  type RoughImage,
  type StageInput,
} from './gulliver-ep01-name';

export type RoughRef = { path: string; commit: string; sha256: string };
export type RoughFigure = { fg: string; inFrame: boolean; where: string };
export type RoughPanel = {
  image: string;
  prompt: string;
  tool: string;
  codexModel: string | null;
  imageModel: string;
  codexSession: string | null;
  rawSha256: string;
  rawSize: [number, number];
  layout: string;
  refs: RoughRef[];
  figures: RoughFigure[];
};
export type EpisodeRough = { schemaVersion: 1; episode: number; generatedAt: string; panels: Record<string, RoughPanel> };
/** ラフの記録と、コマのラフ絵（data:image/jpeg の URI、コマの id ごと）。 */
export type RoughInput = { data: EpisodeRough; images: Record<string, string> };

/** ラフで下に敷く 3D の下絵の濃さ。ラフ絵の線を読みやすくするため、ネームより薄くする。 */
export const ROUGH_UNDERLAY_OPACITY = 0.25;
/** ネームの固定した版（ラフのもと）。 */
export const NAME_VERSION = 'gm1-ep01-name@name-ep01-v2';
/** 画作りガイドの決まりで、ラフの段階に要るレイヤー。 */
export const ROUGH_LAYERS = ['LY-01', 'LY-02', 'LY-09', 'LY-10'] as const;
const LICENSE = 'OpenAI の生成画像（Codex）。他の作品の絵は渡していない。利用条件は OpenAI の利用規約に従う';

const REF_NAMES: Record<string, string> = {
  'ch01-gulliver-front': 'CH-01 ガリヴァーの設定画（正面）',
  'lilliputian-front': 'CH-30 小人の設定画（正面）',
  'ch02-emperor': 'CH-02 皇帝の設定画',
  'lo03-temple': 'LO-03 古い神殿の舞台の設定画',
  'lo04-mildendo': 'LO-04 都ミルドゥンドの舞台の設定画',
};
const refName = (r: RoughRef) => REF_NAMES[r.path.split('/')[2]!] ?? r.path;
const refText = (r: RoughRef) => `${refName(r)}（gulliver-manga@${r.commit.slice(0, 8)} ${r.path} sha256:${r.sha256.slice(0, 12)}）`;

function roughImages(rough: RoughInput, stage: StageInput): Record<string, RoughImage> {
  const out: Record<string, RoughImage> = {};
  for (const [id, p] of Object.entries(rough.data.panels)) {
    const sp = stage.data.panels.find((x) => x.panel === id)!;
    out[id] = {
      src: rough.images[id]!,
      alt: `${id} のラフ絵。3D の舞台「${stage.data.sets[sp.set]!.name}」のカメラの絵を構図の型にして、Codex の画像生成で描いた鉛筆のラフ`,
      source: `${p.tool}、Codex のモデル ${p.codexModel ?? '不明'}（画像のモデルは出ない）。渡した参照：${NAME_VERSION} のカメラの絵 ${p.layout}、${p.refs.map(refText).join('、')}。生の出力 sha256:${p.rawSha256.slice(0, 12)}`,
      license: LICENSE,
    };
  }
  return out;
}

export function buildEpisodeRough(stage: StageInput, rough: RoughInput) {
  return buildEpisodeName(1, EP01_NAME, stage, { rough: roughImages(rough, stage), underlayOpacity: ROUGH_UNDERLAY_OPACITY });
}

/** 書き出し用の写し：メモ（ネームのタグと絵のメモ）のグループを隠す。編集する原稿には残す。 */
export function forExport(content: DesignContent): DesignContent {
  return { ...content, elements: content.elements.map((e) => (e.name === LAYERS.memo ? { ...e, hidden: true } : e)) };
}

// ---------------------------------------------------------------- 表

function pageTable(records: PanelRecord[], stage: EpisodeStage, rough: EpisodeRough): StructuredData {
  const pages = [...new Set(records.map((r) => r.page))];
  return {
    schemaVersion: 2,
    columns: [
      { id: 'rf.page', name: 'ページ', type: 'number', required: true },
      { id: 'rf.scene', name: 'シーン', type: 'text', required: true },
      { id: 'rf.panels', name: 'コマ（ネームと同じ ID）', type: 'text', required: true },
      { id: 'rf.method', name: '作画の方法', type: 'text', required: true },
      { id: 'rf.art', name: 'もとにした設定画（固定した版）', type: 'text', required: true },
      { id: 'rf.samples', name: '採用見本（固定した版）', type: 'text', required: true },
      { id: 'rf.layers', name: 'レイヤー', type: 'text', required: true },
      { id: 'rf.layerNotes', name: '決まりに無いレイヤー・まとめたレイヤーの理由', type: 'text' },
      { id: 'rf.byHuman', name: '人が描いた・直したレイヤー', type: 'text' },
      { id: 'rf.byAi', name: 'AI の提案を採ったレイヤー', type: 'text', required: true },
      { id: 'rf.generated', name: 'AI の生成：道具と版・渡した参照・出典と利用条件', type: 'text', required: true },
    ],
    rows: pages.map((page) => {
      const rs = records.filter((r) => r.page === page);
      const rp = rs.map((r) => rough.panels[r.id]!);
      const refs = [...new Map(rp.flatMap((p) => p.refs).map((r) => [r.path, r])).values()];
      const sets = [...new Set(rs.map((r) => stage.panels.find((x) => x.panel === r.id)!.set))];
      const models = sets.flatMap((s) => stage.sets[s]!.props.map((p) => `${p.name} ${p.artifactId}@${p.versionId}`));
      const tools = [...new Set(rp.map((p) => `${p.tool}、モデル ${p.codexModel ?? '不明'}`))];
      return {
        id: `PG-e01-${String(page).padStart(2, '0')}`,
        values: {
          'rf.page': page,
          'rf.scene': rs[0]!.scene,
          'rf.panels': rs.map((r) => r.id).join(' '),
          'rf.method': '3D の下絵（ネームの舞台とカメラ）＋ AI の画像生成（Codex）。人物と背景の位置は 3D の舞台で決めたまま',
          'rf.art': refs.length
            ? refs.map(refText).join(' / ')
            : '無し：このページの人物と場所には採用した設定画が無い（CH-10 メアリー・馬・船員・英国の舞台は設定画をまだ作っていない）。人物表の外見の文と 3D の舞台で描いた',
          'rf.samples': `SM-03 実寸の建物と物・SM-04 人物と馬の体（main 40645e80 の見本）。3D の舞台：${models.join('、')}`,
          'rf.layers': `${LAYERS.underlay}、${LAYERS.atari}（ラフ絵）、${LAYERS.balloon}、${LAYERS.text}、${LAYERS.memo}`,
          'rf.layerNotes':
            'LY-02 アタリに、人物と背景の位置を一枚に描いたラフ絵を入れた（画作りガイドのラフのレイヤーに背景の位置の層が無く、Codex は 1 コマを 1 枚で描くため。線画で LY-04 と LY-07 に分ける）。' +
            '「メモ」はネームのタグと絵のメモで、決まりの外。ラフの指示として残し、書き出しでは隠す。',
          'rf.byHuman': 'まだ無い（作者が確かめて直す）',
          'rf.byAi': `${LAYERS.underlay}（3D の書き出し）、${LAYERS.atari}（画像生成）、${LAYERS.balloon}・${LAYERS.text}（脚本の台詞を置いただけ）`,
          'rf.generated': `${tools.join(' / ')}。コマごとに、${NAME_VERSION} のカメラの絵（part1/name/stage/underlay/）と上の設定画を渡した。プロンプトは part1/rough/prompts/。出典と利用条件：${LICENSE}`,
        },
      };
    }),
  };
}

/**
 * 3D のカメラでは画角の外だが、ネームの絵のメモに合わせてラフに描いた人物の配置。ネームの舞台の直しが要る。
 */
export const DRAWN_OUTSIDE_STAGE: Record<string, string> = {
  'FG-e01-p02-k2-02':
    '3D のカメラ（注視点が馬の頭より左）では画角のわずかに外。ネームの絵のメモ「馬の鼻先」に合わせ、ラフでは灰の馬の鼻先を描いた。ネームの舞台のカメラを直す',
};

function figureTable(records: PanelRecord[], stage: EpisodeStage, rough: EpisodeRough): StructuredData {
  return {
    schemaVersion: 2,
    columns: [
      { id: 'rf.fg', name: '人物の配置（FG）', type: 'text', required: true },
      { id: 'rf.panel', name: 'コマ', type: 'text', required: true },
      { id: 'rf.ch', name: '人物表', type: 'text', required: true },
      { id: 'rf.name', name: '名前', type: 'text', required: true },
      { id: 'rf.pose', name: 'ポーズ（3D の舞台）', type: 'text', required: true },
      { id: 'rf.drawn', name: 'このコマ用に描いた', type: 'boolean', required: true },
      { id: 'rf.drawing', name: '絵', type: 'text' },
      { id: 'rf.where', name: 'コマの中の位置（3D のカメラから）', type: 'text' },
      { id: 'rf.note', name: '描かない理由・同じ絵を使う理由', type: 'text' },
    ],
    rows: records.flatMap((r) => {
      const sp = stage.panels.find((x) => x.panel === r.id)!;
      const rp = rough.panels[r.id]!;
      return sp.figures.map((f) => {
        const v = rp.figures.find((x) => x.fg === f.fg)!;
        const extra = DRAWN_OUTSIDE_STAGE[f.fg];
        const drawn = v.inFrame || !!extra;
        return {
          id: f.fg,
          values: {
            'rf.fg': f.fg,
            'rf.panel': r.id,
            'rf.ch': f.ch,
            'rf.name': f.name,
            'rf.pose': f.pose,
            'rf.drawn': drawn,
            'rf.drawing': drawn ? `ラフ絵 ${r.id}（${rp.image}）` : '',
            'rf.where': v.where,
            'rf.note': extra ?? (v.inFrame ? '' : '画角の外（3D のカメラで確かめた）。ネームで置いた位置のまま、このコマには描かない'),
          },
        };
      });
    }),
  };
}

// ---------------------------------------------------------------- 資料

const stamp = '2026-11-14T00:00:00.000Z';
const VERSION = 'rough-ep01-v1';
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
        reason: `ガリヴァー旅行記 第1話のラフ（fiction-manga@1.2.0 ラフ、${NAME_VERSION} から。AI の提案）`,
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

export async function buildGulliverEp01Rough(stage: StageInput, rough: RoughInput) {
  const build = buildEpisodeRough(stage, rough);
  return {
    build,
    artifacts: [
      await native('design', 'gm1-ep01-rough', '第1話「人の山」ラフ（16ページ）', build.content),
      await native('data', 'gm1-ep01-rough-pages', '第1話 ラフのページ表（資料・レイヤー・生成の記録）', pageTable(build.records, stage.data, rough.data)),
      await native('data', 'gm1-ep01-rough-figures', '第1話 ラフの人物の絵（FG ごと）', figureTable(build.records, stage.data, rough.data)),
    ],
  };
}
