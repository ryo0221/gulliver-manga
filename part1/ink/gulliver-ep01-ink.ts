/**
 * ガリヴァー旅行記 第1話「人の山」の線画。工程定義 fiction-manga@1.3.0 の「線画」（ページごと）の成果物。
 *
 * - ラフ（gm1-ep01-rough@rough-ep01-v1）と同じページとコマ（PN の ID はそのまま）の Design 原稿。
 *   コマごとに、画作りガイドのレイヤー LY-01 下絵（3D）・LY-02 アタリ（ラフ絵）を隠して残し、その上に
 *   LY-04 背景の線画・LY-07 人物の線画・LY-08 効果のグループを作る。吹き出しとナレーションの枠（LY-09）は
 *   ラフのまま、一つずつエディタで動かせるグループ。
 * - 線画は、採ったラフ絵と 3D の舞台のカメラの絵を Codex の画像生成に渡して、1コマを3色のペンで描かせ、
 *   色でレイヤーに分けたもの（黒＝人物、青＝背景、赤＝効果）。AI の提案で、採否と直しは作者（Ryo）。
 * - ページごとの使った資料・レイヤー・生成の記録の表を作る。
 *
 * editor-platform の作業ツリーで apps/artifact-host/src/creative/story-board/ に置いて使う（commit しない）。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import type { StructuredData } from '@editor-platform/structured-data/model';
import { buildEpisodeName, EP01_NAME, BALLOON_LAYER, INK_LAYERS, LAYERS, type EpisodeStage, type InkImages, type PanelRecord, type StageInput } from './gulliver-ep01-name';
import { ROUGH_UNDERLAY_OPACITY, type RoughInput, type RoughRef } from './gulliver-ep01-rough';

export { forExport } from './gulliver-ep01-rough';

export type InkLayerFile = { image: string; share: number; bytes: number };
export type InkPanel = {
  layers: Record<'LY-04' | 'LY-07' | 'LY-08', InkLayerFile>;
  review: string;
  prompt: string;
  tool: string;
  codexModel: string | null;
  imageModel: string;
  codexSession: string | null;
  /** The background drawn in after the author's finish review (bg-briefs.py → gen-bg.sh → bg-merge.py). */
  background?: { why: string; prompt: string; codexSession: string | null; kept: string };
  rawSha256: string;
  rawSize: [number, number];
  refs: RoughRef[];
};
export type EpisodeInk = { schemaVersion: 1; episode: number; generatedAt: string; panels: Record<string, InkPanel> };
/** 線画の記録と、コマのレイヤーの画像（data:image/png の URI、`<コマ>/<LY>` ごと）。 */
export type InkInput = { data: EpisodeInk; images: Record<string, string> };

/** ラフの固定した版（線画のもと）。 */
export const ROUGH_VERSION = 'gm1-ep01-rough@rough-ep01-v1';
/** 画作りガイドの決まりで、線画の段階に要るレイヤー。LY-01 と LY-02 は隠して残す。 */
export const INK_STAGE_LAYERS = ['LY-04', 'LY-07', 'LY-08'] as const satisfies readonly string[];
const LICENSE = 'OpenAI の生成画像（Codex）。他の作品の絵は渡していない。利用条件は OpenAI の利用規約に従う';
const KEY = { bg: 'LY-04', fig: 'LY-07', fx: 'LY-08' } as const;
const WHAT = { bg: '背景（建物・地面・海・船・小道具）の線', fig: '人物と動物の線', fx: '効果の線（集中線・動きの線）' } as const;

const REF_NAMES: Record<string, string> = {
  'ch01-gulliver-front': 'CH-01 ガリヴァーの設定画（正面）',
  'lilliputian-front': 'CH-30 小人の設定画（正面）',
  'ch02-emperor': 'CH-02 皇帝の設定画',
  'lo03-temple': 'LO-03 古い神殿の舞台の設定画',
  'lo04-mildendo': 'LO-04 都ミルドゥンドの舞台の設定画',
};
const refName = (r: RoughRef) =>
  r.path.startsWith('part1/rough/') ? `${ROUGH_VERSION} のラフ絵` : r.path.startsWith('part1/name/') ? '3D の舞台のカメラの絵' : (REF_NAMES[r.path.split('/')[2]!] ?? r.path);
export const refText = (r: RoughRef) => `${refName(r)}（gulliver-manga@${r.commit.slice(0, 8)} ${r.path} sha256:${r.sha256.slice(0, 12)}）`;

function inkImages(ink: InkInput): Record<string, InkImages> {
  const out: Record<string, InkImages> = {};
  for (const [id, p] of Object.entries(ink.data.panels)) {
    const one = (k: keyof typeof KEY) => ({
      src: ink.images[`${id}/${KEY[k]}`]!,
      alt: `${id} の${WHAT[k]}。採ったラフ絵をなぞって Codex の画像生成で描いた線画を、色で分けたもの`,
      source: `${p.tool}、Codex のモデル ${p.codexModel ?? '不明'}（画像のモデルは出ない）。渡した参照：${p.refs.map(refText).join('、')}。生の出力 sha256:${p.rawSha256.slice(0, 12)}。3色で描かせ、${KEY[k]} の色の線だけを取り出した`,
      license: LICENSE,
    });
    out[id] = { bg: one('bg'), fig: one('fig'), fx: one('fx') };
  }
  return out;
}

export function buildEpisodeInk(stage: StageInput, rough: RoughInput, ink: InkInput) {
  const avoid = Object.fromEntries(Object.entries(rough.data.panels).map(([id, p]) => [id, p.occupancy]));
  const roughImages = Object.fromEntries(
    Object.entries(rough.data.panels).map(([id, p]) => [
      id,
      { src: rough.images[id]!, alt: `${id} のラフ絵（${ROUGH_VERSION}、線画では隠して残す）`, source: `${ROUGH_VERSION} のラフ絵 ${p.image} を長い辺 480 px に縮めた写し part1/ink/hidden/${id}-LY-02.jpg（${p.tool}）`, license: LICENSE },
    ]),
  );
  return buildEpisodeName(1, EP01_NAME, stage, { rough: roughImages, underlayOpacity: ROUGH_UNDERLAY_OPACITY, avoid, ink: inkImages(ink) });
}

// ---------------------------------------------------------------- 表

function pageTable(records: PanelRecord[], stage: EpisodeStage, ink: EpisodeInk): StructuredData {
  const pages = [...new Set(records.map((r) => r.page))];
  return {
    schemaVersion: 2,
    columns: [
      { id: 'ik.page', name: 'ページ', type: 'number', required: true },
      { id: 'ik.scene', name: 'シーン', type: 'text', required: true },
      { id: 'ik.panels', name: 'コマ（ネームと同じ ID）', type: 'text', required: true },
      { id: 'ik.method', name: '作画の方法', type: 'text', required: true },
      { id: 'ik.rough', name: 'もとにしたラフ（固定した版）', type: 'text', required: true },
      { id: 'ik.art', name: '渡した設定画（固定した版）', type: 'text', required: true },
      { id: 'ik.layers', name: 'レイヤー', type: 'text', required: true },
      { id: 'ik.layerNotes', name: '決まりに無いレイヤー・まとめたレイヤーの理由', type: 'text' },
      { id: 'ik.byHuman', name: '人が描いた・直したレイヤー', type: 'text' },
      { id: 'ik.byAi', name: 'AI の提案を採ったレイヤー', type: 'text', required: true },
      { id: 'ik.generated', name: 'AI の生成：道具と版・渡した参照・出典と利用条件', type: 'text', required: true },
      { id: 'ik.fx', name: '効果の線のあるコマ', type: 'text' },
      { id: 'ik.noBg', name: '背景の線の無いコマ（LY-04 は空）', type: 'text' },
    ],
    rows: pages.map((page) => {
      const rs = records.filter((r) => r.page === page);
      const ip = rs.map((r) => ink.panels[r.id]!);
      const refs = [...new Map(ip.flatMap((p) => p.refs).map((r) => [r.path, r])).values()];
      const art = refs.filter((r) => r.path.startsWith('part1/codex/'));
      const sets = [...new Set(rs.map((r) => stage.panels.find((x) => x.panel === r.id)!.set))];
      const models = sets.flatMap((s) => stage.sets[s]!.props.map((p) => `${p.name} ${p.artifactId}@${p.versionId}`));
      const tools = [...new Set(ip.map((p) => `${p.tool}、モデル ${p.codexModel ?? '不明'}`))];
      const noBg = rs.filter((r) => ink.panels[r.id]!.layers['LY-04'].share < BG_MIN_SHARE).map((r) => r.id);
      const bgAdded = rs.filter((r) => ink.panels[r.id]!.background);
      const fx = rs.filter((r) => ink.panels[r.id]!.layers['LY-08'].share >= FX_MIN_SHARE).map((r) => r.id);
      return {
        id: `PG-e01-${String(page).padStart(2, '0')}`,
        values: {
          'ik.page': page,
          'ik.scene': rs[0]!.scene,
          'ik.panels': rs.map((r) => r.id).join(' '),
          'ik.method': 'ラフ絵をなぞる AI の画像生成（Codex）。構図・人物の位置と大きさは、ラフと 3D の舞台で決めたまま',
          'ik.rough': `${ROUGH_VERSION}：${refs.filter((r) => r.path.startsWith('part1/rough/')).map((r) => `${r.path} sha256:${r.sha256.slice(0, 12)}`).join('、')}。3D の舞台：${models.join('、')}`,
          'ik.art': art.length ? art.map(refText).join(' / ') : '無し：このページの人物と場所には採用した設定画が無い（CH-10 メアリー・馬・船員・英国の舞台は設定画をまだ作っていない）。ラフ絵と 3D の舞台だけを渡した',
          'ik.layers': `${LAYERS.underlay}（隠す）、${LAYERS.atari}（ラフ絵、隠す）、${INK_LAYERS.bg}、${INK_LAYERS.fig}、${INK_LAYERS.fx}、${BALLOON_LAYER} 吹き出し（仮、吹き出しと枠ごとのグループ）、${LAYERS.text}、${LAYERS.memo}`,
          'ik.layerNotes':
            'LY-01 と LY-02 は、画作りガイドの決まりのとおり線画では隠して残した。Playground の読み込みの上限（16 MB）に収めるため、どちらも長い辺 480 px に縮めた写し（part1/ink/hidden/）にした。元はネームとラフの資料にある。' +
            'LY-04・LY-07・LY-08 は、Codex が1コマを1枚で描くので、黒（人物）・青（背景）・赤（効果）の3色で描かせ、色で分けた。人物の手に持つ物・体に付いた鎖と縄は人物（LY-07）に入る。色が混ざったところ（人物と背景の境目）は、どちらかに入っていることがある。' +
            'LY-08 効果は、画作りガイドでは人の描くレイヤー。ここに入れた効果の線は AI の提案で、作者が採るか描き直す。手書きの擬音は作者が LY-08 に描く。それまで擬音は LY-10 の仮の文字のまま。' +
            '吹き出しとナレーションの枠は、ラフと同じく LY-09 の文字と一つのグループでコマの直下に置き、エディタで一つずつ動かせる。絵のレイヤー（LY-01・LY-02・LY-04・LY-07・LY-08）とメモは固定した。' +
            '「メモ」はネームのタグと絵のメモで、決まりの外。書き出しでは隠す。',
          'ik.byHuman': 'まだ無い（作者が確かめて直す）',
          'ik.byAi': `${INK_LAYERS.bg}・${INK_LAYERS.fig}・${INK_LAYERS.fx}（画像生成）、${BALLOON_LAYER} 吹き出し・${LAYERS.text}（脚本の台詞を置いただけ）`,
          'ik.generated':
            `${tools.join(' / ')}。コマごとに、${ROUGH_VERSION} のラフ絵（part1/rough/panels/）、ネームの 3D の舞台のカメラの絵（part1/name/stage/underlay/）と上の設定画を渡した。プロンプトは part1/ink/prompts/。出典と利用条件：${LICENSE}` +
            (bgAdded.length
              ? `。背景を描き足したコマ（仕上げで作者「背景を描いて」、2026-11-14）：${bgAdded.map((r) => `${r.id}（${ink.panels[r.id]!.background!.kept}、part1/ink/${ink.panels[r.id]!.background!.prompt}）`).join('、')}。人物の線（LY-07）と効果（LY-08）は変えていない`
              : ''),
          'ik.fx': fx.join(' ') || '無し',
          'ik.noBg': noBg.length
            ? `${noBg.join(' ')}：人物だけの寄りか、ガリヴァーの体が地面になるコマで、背景を描いていない。LY-04 のグループは空の線の画像のまま残した`
            : '',
        },
      };
    }),
  };
}

/** 背景の線があると見なす、コマの線のうちの青い線の割合。 */
export const BG_MIN_SHARE = 0.01;
/** 効果の線があると見なす、コマの線のうちの赤い線の割合。 */
export const FX_MIN_SHARE = 0.005;

// ---------------------------------------------------------------- 資料

const stamp = '2026-11-14T00:00:00.000Z';
const VERSION = 'ink-ep01-v2';
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
        reason: `ガリヴァー旅行記 第1話の線画（fiction-manga@1.3.0 線画、${ROUGH_VERSION} から。AI の提案）`,
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

export async function buildGulliverEp01Ink(stage: StageInput, rough: RoughInput, ink: InkInput) {
  const build = buildEpisodeInk(stage, rough, ink);
  return {
    build,
    artifacts: [
      await native('design', 'gm1-ep01-ink', '第1話「人の山」線画（16ページ）', build.content),
      await native('data', 'gm1-ep01-ink-pages', '第1話 線画のページ表（資料・レイヤー・生成の記録）', pageTable(build.records, stage.data, ink.data)),
    ],
  };
}
