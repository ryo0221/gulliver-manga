/**
 * ガリヴァー旅行記 第1話「人の山」の仕上げと写植。工程定義 fiction-manga@1.3.0 の「仕上げと写植」の成果物。
 *
 * - 線画（gm1-ep01-ink@ink-ep01-v3）と同じページとコマ（PN の ID はそのまま）の Design 原稿。コマごとに、画作りガイドの
 *   重ね順で LY-03 背景の塗り・LY-04 背景の線画・LY-05 人物の塗り・LY-06 影・LY-07 人物の線画・LY-08 効果・LY-10 文字の
 *   グループを作る。線は採った線画のまま。吹き出しとナレーションの枠（LY-09）は、一つずつエディタで動かせるグループ。
 * - 塗りは、線画を Codex の画像生成で塗らせた色の見本を、線画の位置へ合わせて、線の間の領域ごとに塗りと影に分けたもの。
 *   AI の提案で、採否と直しは作者（Ryo）。
 * - ページ表（finished-pages）と写植の記録（lettering-record：吹き出しや文字ごとに台詞とコマを引用）を作る。
 *
 * editor-platform の作業ツリーで apps/artifact-host/src/creative/story-board/ に置いて使う（commit しない）。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import type { StructuredData } from '@editor-platform/structured-data/model';
import {
  buildEpisodeName,
  EP01_NAME,
  BALLOON_LAYER,
  FINISH_LAYERS,
  GOTHIC,
  INK_LAYERS,
  LAYERS,
  MINCHO,
  type FinishImages,
  type PanelRecord,
  type Placed,
  type StageInput,
} from './gulliver-ep01-name';
import { SPEAKER_NAMES } from './gulliver-part1-script';
import type { RoughInput, RoughRef } from './gulliver-ep01-rough';
import { refText as inkRefText, type InkInput } from './gulliver-ep01-ink';

export { forExport } from './gulliver-ep01-rough';

export type FinishLayerFile = { image: string; bytes: number; share?: number };
export type FinishPanel = {
  layers: Record<'LY-03' | 'LY-05' | 'LY-06', FinishLayerFile>;
  /** 採った線画の線のレイヤーを、同じ画素のまま可逆の WebP にした写し（16 MB の上限のため）。 */
  lines: Record<'LY-04' | 'LY-07' | 'LY-08', { image: string; from: string; bytes: number }>;
  review: string;
  prompt: string;
  tool: string;
  codexModel: string | null;
  imageModel: string;
  codexSession: string | null;
  rawSha256: string;
  rawSize: [number, number];
  refs: RoughRef[];
};
export type EpisodeFinish = { schemaVersion: 1; episode: number; generatedAt: string; panels: Record<string, FinishPanel> };
/** 仕上げの記録と、コマの塗りと影の画像（data:image/webp の URI、`<コマ>/<LY>` ごと）。 */
export type FinishInput = { data: EpisodeFinish; images: Record<string, string> };

/** 線画の固定した版（仕上げのもと）。 */
export const INK_VERSION = 'gm1-ep01-ink@ink-ep01-v3';
/** 脚本の台詞の固定した版（写植で引用する）。 */
export const SCRIPT_LINES_VERSION = 'gm1-script-lines@script-v1';
/** 画作りガイドの決まりで、仕上げの段階に要るレイヤー。 */
export const FINISH_STAGE_LAYERS = ['LY-03', 'LY-04', 'LY-05', 'LY-06', 'LY-07', 'LY-08', 'LY-09', 'LY-10'] as const satisfies readonly string[];
const LICENSE = 'OpenAI の生成画像（Codex）。他の作品の絵は渡していない。利用条件は OpenAI の利用規約に従う';
const KEY = { bgFill: 'LY-03', figFill: 'LY-05', shadow: 'LY-06' } as const;
const WHAT = { bgFill: '背景の塗り', figFill: '人物の塗り', shadow: '影（人物と背景をまとめた一枚）' } as const;
const refText = (r: RoughRef) => (r.path.startsWith('part1/ink/') ? `${INK_VERSION} の線画 ${r.path} sha256:${r.sha256.slice(0, 12)}` : inkRefText(r));

function finishImages(fin: FinishInput): Record<string, FinishImages> {
  const out: Record<string, FinishImages> = {};
  for (const [id, p] of Object.entries(fin.data.panels)) {
    const one = (k: keyof typeof KEY) => ({
      src: fin.images[`${id}/${KEY[k]}`]!,
      alt: `${id} の${WHAT[k]}。採った線画を Codex に塗らせた色の見本を、線画の位置へ合わせて、線の間の領域ごとに分けたもの`,
      source: `${p.tool}、Codex のモデル ${p.codexModel ?? '不明'}（画像のモデルは出ない）。渡した参照：${p.refs.map(refText).join('、')}。生の出力 sha256:${p.rawSha256.slice(0, 12)}。色の見本を線画へ合わせ（オプティカルフロー）、${KEY[k]} を取り出した`,
      license: LICENSE,
    });
    out[id] = { bgFill: one('bgFill'), figFill: one('figFill'), shadow: one('shadow') };
  }
  return out;
}

export function buildEpisodeFinish(stage: StageInput, rough: RoughInput, ink: InkInput, fin: FinishInput) {
  // The lettering stays where the rough and the ink placed it (the rough's occupancy).
  const avoid = Object.fromEntries(Object.entries(rough.data.panels).map(([id, p]) => [id, p.occupancy]));
  const inkImgs = Object.fromEntries(
    Object.keys(ink.data.panels).map((id) => {
      const one = (ly: string, what: string) => {
        const p = ink.data.panels[id]!;
        return {
          src: ink.images[`${id}/${ly}`]!,
          alt: `${id} の${what}（${INK_VERSION}）`,
          source: `${INK_VERSION} の ${ly}（part1/ink/layers/${id}-${ly}.png を同じ画素のまま可逆の WebP にした写し part1/finish/lines/${id}-${ly}.webp。${p.tool}、生の出力 sha256:${p.rawSha256.slice(0, 12)}）`,
          license: LICENSE,
        };
      };
      return [id, { bg: one('LY-04', '背景の線画'), fig: one('LY-07', '人物の線画'), fx: one('LY-08', '効果') }];
    }),
  );
  return buildEpisodeName(1, EP01_NAME, stage, { avoid, ink: inkImgs, finish: finishImages(fin) });
}

// ---------------------------------------------------------------- 表

/** 影があると見なす、コマのうち影のある割合。 */
export const SHADOW_MIN_SHARE = 0.002;

function pageTable(records: PanelRecord[], fin: EpisodeFinish): StructuredData {
  const pages = [...new Set(records.map((r) => r.page))];
  return {
    schemaVersion: 2,
    columns: [
      { id: 'fn.page', name: 'ページ', type: 'number', required: true },
      { id: 'fn.scene', name: 'シーン', type: 'text', required: true },
      { id: 'fn.panels', name: 'コマ（ネームと同じ ID）', type: 'text', required: true },
      { id: 'fn.method', name: '仕上げの方法', type: 'text', required: true },
      { id: 'fn.ink', name: 'もとにした線画（固定した版）', type: 'text', required: true },
      { id: 'fn.art', name: '渡した設定画（固定した版）', type: 'text', required: true },
      { id: 'fn.layers', name: 'レイヤー', type: 'text', required: true },
      { id: 'fn.layerNotes', name: '決まりに無いレイヤー・まとめたレイヤーの理由', type: 'text' },
      { id: 'fn.byHuman', name: '人が描いた・直したレイヤー', type: 'text' },
      { id: 'fn.byAi', name: 'AI の提案を採ったレイヤー', type: 'text', required: true },
      { id: 'fn.generated', name: 'AI の生成：道具と版・渡した参照・出典と利用条件', type: 'text', required: true },
      { id: 'fn.noShadow', name: '影の無いコマ', type: 'text' },
    ],
    rows: pages.map((page) => {
      const rs = records.filter((r) => r.page === page);
      const fp = rs.map((r) => fin.panels[r.id]!);
      const refs = [...new Map(fp.flatMap((p) => p.refs).map((r) => [r.path, r])).values()];
      const art = refs.filter((r) => r.path.startsWith('part1/codex/'));
      const tools = [...new Set(fp.map((p) => `${p.tool}、モデル ${p.codexModel ?? '不明'}`))];
      const noShadow = rs.filter((r) => (fin.panels[r.id]!.layers['LY-06'].share ?? 0) < SHADOW_MIN_SHARE).map((r) => r.id);
      return {
        id: `PG-e01-${String(page).padStart(2, '0')}`,
        values: {
          'fn.page': page,
          'fn.scene': rs[0]!.scene,
          'fn.panels': rs.map((r) => r.id).join(' '),
          'fn.method':
            '採った線画を Codex に塗らせて色の見本を作り、見本を線画の位置へ合わせて（線の画像どうしのオプティカルフロー）、線の間の領域ごとに塗り（人物と背景）と影に分けた。線は線画のまま',
          'fn.ink': `${INK_VERSION}：${refs.filter((r) => r.path.startsWith('part1/ink/')).length} 枚の線のレイヤー（part1/ink/layers/、sha256 は ep01-finish.json）`,
          'fn.art': art.length ? art.map(refText).join(' / ') : '無し：このページの人物と場所には採用した設定画が無い（CH-10 メアリー・馬・船員・英国の舞台は設定画をまだ作っていない）。線画と色の決まり（AR-04、AR-06）だけを渡した',
          'fn.layers': `${FINISH_LAYERS.bgFill}、${INK_LAYERS.bg}、${FINISH_LAYERS.figFill}、${FINISH_LAYERS.shadow}、${INK_LAYERS.fig}、${INK_LAYERS.fx}、${BALLOON_LAYER} 吹き出し（吹き出しと枠ごとのグループ）、${LAYERS.text}、${LAYERS.memo}`,
          'fn.layerNotes':
            'LY-01 下絵と LY-02 アタリは、画作りガイドで仕上げの段階に要らないので入れていない（ネーム・ラフ・線画の原稿に残っている）。' +
            'LY-06 影は、決まりのとおり人物と背景を一枚にまとめた。影は色の見本で同じ色のうち暗いところを取り出したもので、半透明の影の色を塗りの上に重ねる。' +
            'LY-10 文字の台詞とナレーションは、エディタで吹き出しや枠ごと動かせるよう、LY-09 の吹き出し・枠と一つのグループにまとめ、コマの直下に置いた（擬音と題だけ LY-10）。' +
            '擬音は、画作りガイドでは手書きで LY-08 に描く。作者が描くまで LY-10 の仮の文字のまま。' +
            '「メモ」はネームのタグと絵のメモで、決まりの外。書き出しでは隠す。',
          'fn.byHuman': 'まだ無い（作者が確かめて直す）',
          'fn.byAi': `${FINISH_LAYERS.bgFill}・${FINISH_LAYERS.figFill}・${FINISH_LAYERS.shadow}（画像生成）、${INK_LAYERS.bg}・${INK_LAYERS.fig}・${INK_LAYERS.fx}（線画、作者が採った）、${BALLOON_LAYER}・${LAYERS.text}（脚本の台詞を置いただけ）`,
          'fn.generated': `${tools.join(' / ')}。コマごとに、${INK_VERSION} の線（3枚を黒で重ねた絵）と上の設定画を渡した。プロンプトは part1/finish/prompts/。出典と利用条件：${LICENSE}`,
          'fn.noShadow': noShadow.length ? `${noShadow.join(' ')}：色の見本の影が、同じ色の暗いところとして取り出せなかった（影の色が別の色になっている）。影は塗りに残っている` : '',
        },
      };
    }),
  };
}

const KIND = { D: '台詞', N: 'ナレーション', S: '擬音', title: '題' } as const;
const isShout = (text: string) => /！$/.test(text) && text.length <= 12;

/** 写植の記録：吹き出し・ナレーションの枠・擬音・題ごとに1行。 */
export function letteringTable(records: PanelRecord[], placed: Placed[]): StructuredData {
  const rows = placed
    .filter((it) => it.kind === 'D' || it.kind === 'N' || it.kind === 'S' || it.kind === 'title')
    .map((it, i) => {
      const r = records.find((x) => x.id === it.panelId)!;
      const line = it.lineId ? r.lines.find((l) => l.id === it.lineId)!.line : null;
      const kind = it.kind as keyof typeof KIND;
      const text = line ? line.text : r.panel.title!;
      const shape =
        kind === 'D' ? `楕円の吹き出し、尾は話す人（${SPEAKER_NAMES[line!.who!]}）へ` : kind === 'N' ? '四角の枠（ナレーション）' : kind === 'S' ? '枠なしの文字に白い縁取り（仮。手書きは LY-08）' : '枠なしの文字に白い縁取り（題）';
      const font =
        kind === 'N' || kind === 'title' ? `明朝（${MINCHO.split(',')[0]}）${kind === 'title' ? '、太字' : ''}` : `ゴシック（${GOTHIC.split(',')[0]}）${kind === 'S' || isShout(text) ? '、太字' : ''}`;
      return {
        id: `LT-e01-${String(i + 1).padStart(3, '0')}`,
        values: {
          'lt.panel': it.panelId,
          'lt.line': line ? `${SCRIPT_LINES_VERSION} ${it.lineId}` : `${SCRIPT_LINES_VERSION}（題：${r.lines[0]!.id} のト書き）`,
          'lt.kind': KIND[kind],
          'lt.speaker': line?.who ? `${SPEAKER_NAMES[line.who]}（${line.who}）` : '',
          'lt.text': text,
          'lt.shape': shape,
          'lt.font': `${font}、${it.font} px`,
          'lt.direction': '横書き（左から右。Editor の漫画ワークスペースは縦書きを持たない）',
          'lt.where': `x ${Math.round(it.outline.x)}、y ${Math.round(it.outline.y)}、幅 ${Math.round(it.outline.width)}、高さ ${Math.round(it.outline.height)}（原稿の座標。エディタで動かせる）`,
          'lt.clear': '人物の頭（3D のカメラ）とラフの線の濃いところを避けて置いた。被せたところは無い',
        },
      };
    });
  return {
    schemaVersion: 2,
    columns: [
      { id: 'lt.panel', name: 'コマ', type: 'text', required: true },
      { id: 'lt.line', name: '入れる台詞（固定した版）', type: 'text', required: true },
      { id: 'lt.kind', name: '種類', type: 'text', required: true },
      { id: 'lt.speaker', name: '話す人', type: 'text' },
      { id: 'lt.text', name: '文字', type: 'text', required: true },
      { id: 'lt.shape', name: '吹き出しの形', type: 'text', required: true },
      { id: 'lt.font', name: '書体', type: 'text', required: true },
      { id: 'lt.direction', name: '縦書きか横書きか', type: 'text', required: true },
      { id: 'lt.where', name: '位置', type: 'text', required: true },
      { id: 'lt.clear', name: '顔と要所を避けたか・被せる意図', type: 'text', required: true },
    ],
    rows,
  };
}

// ---------------------------------------------------------------- 資料

const stamp = '2026-11-14T00:00:00.000Z';
const VERSION = 'finish-ep01-v3';
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
        reason: `ガリヴァー旅行記 第1話の仕上げと写植（fiction-manga@1.3.0 仕上げと写植、${INK_VERSION} から。AI の提案）`,
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

export async function buildGulliverEp01Finish(stage: StageInput, rough: RoughInput, ink: InkInput, fin: FinishInput) {
  const build = buildEpisodeFinish(stage, rough, ink, fin);
  return {
    build,
    artifacts: [
      await native('design', 'gm1-ep01-finish', '第1話「人の山」仕上げ（16ページ）', build.content),
      await native('data', 'gm1-ep01-finish-pages', '第1話 仕上げのページ表（資料・レイヤー・生成の記録）', pageTable(build.records, fin.data)),
      await native('data', 'gm1-ep01-lettering', '第1話 写植の記録（吹き出しと文字ごと）', letteringTable(build.records, build.placed)),
    ],
  };
}
