/**
 * ガリヴァー旅行記 第1話「人の山」のネーム。工程定義 fiction-manga@1.1.0 の「ネーム」（話ごと）の成果物。
 *
 * - 漫画ワークスペースの Design 原稿（16ページ、左から右へ読む）。コマは連動コマ割り（分割木）で作り、
 *   脚本の台詞・ナレーション・擬音をコマへ置く。ト書きは文字にせず、コマの「絵」のメモに書く。
 * - コマごとの大きさ（引き・寄り）とカメラ（目の高さ、実寸の mm）は、ネームの表（Structured Data）に書く。
 * - fiction-manga@1.2.0（storyboard.staged）：コマごとに 3D の舞台（デジタルツイン）で人物（FG）の位置・向き・
 *   ポーズとカメラの位置・注視点を決め（stage/ep01-stage.json、src/gulliver-ep01-stage.demo.ts）、カメラの絵を
 *   コマの枠に切り抜いてコマの下に敷く（アタリ）。真上からの配置図は stage/plans/。
 * - 構図・間・めくりの採否は作者（Ryo）。これは AI の提案で、原稿は通常の Design として直接直せる。
 *
 * editor-platform の作業ツリーで apps/artifact-host/src/creative/story-board/ に置いて使う（commit しない）。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import { layoutDrawingText } from '@editor-platform/editor-core';
import {
  createDesign,
  insertElement,
  updateElement,
  type DesignContent,
  type DesignElement,
} from '@editor-platform/design/model';
import { designDivisionCommand, type DesignDivisionNode } from '@editor-platform/design/division';
import { insertDesignPage, setDesignPagination } from '@editor-platform/design/pagination';
import type { StructuredData } from '@editor-platform/structured-data/model';
import { PART1_SCRIPT, SPEAKER_NAMES, type Line } from './gulliver-part1-script';

// ---------------------------------------------------------------- 決まり

/** ページの大きさ（Design の単位）。B5 の縦長に近い比。 */
export const PAGE = { width: 800, height: 1180, gap: 60 } as const;
/** コマを置く範囲（ページの左上が原点）。 */
export const REGION = { x: 40, y: 56, width: 720, height: 1068 } as const;
/** コマとコマの間（Design の単位）。 */
export const GUTTER = 16;
/** 文字の大きさ（Design の単位）。最小を下回るとコマに収まらないとして止める。 */
export const FONT = {
  dialogue: { size: 19, min: 15 },
  shout: { size: 26, min: 18 },
  narration: { size: 17, min: 14 },
  sfx: { size: 30, min: 22 },
  memo: 12,
} as const;
export const GOTHIC = 'Noto Sans CJK JP, IPAGothic, sans-serif';
export const MINCHO = 'Noto Serif CJK JP, IPAMincho, serif';

export type Shot = '大引き' | '引き' | '中' | '寄り' | '大寄り';
/**
 * カメラの目。L は小人（リリパットの人）の目の高さ、G はガリヴァーの目の高さ、E は英国の人の目の高さ、
 * H は俯瞰（大きさの違いを見せないコマだけ）、W は水面すれすれか水の中。mm は実寸の地面（海では水面）からの高さで、3D の舞台のカメラの高さと同じ。
 */
export type Eye = 'L' | 'G' | 'E' | 'H' | 'W';
export const EYE_NAMES: Record<Eye, string> = {
  L: '小人の目の高さ',
  G: 'ガリヴァーの側（顔や手の近く）',
  E: '英国の人の目の高さ',
  H: '俯瞰',
  W: '水面すれすれ・水の中',
};
/** カメラの立つ台（地面より高いところ）。mm は台の上面の地面からの高さ。 */
export type Stand = { on: string; mm: number };
export type Camera = { eye: Eye; mm: number; look: string; stand?: Stand };
/** 小人の目の高さ（実寸）。ガリヴァーの目 1,630 mm の 1/12。 */
export const LILLIPUT_EYE = 136;
/** 小人の目。台の上に立つときは、台の高さに目の高さを足す。数を渡すと、地面すれすれの低いカメラ。 */
export const L = (look: string, at?: number | Stand): Camera =>
  typeof at === 'number'
    ? { eye: 'L', mm: at, look }
    : at
      ? { eye: 'L', mm: at.mm + LILLIPUT_EYE, look, stand: at }
      : { eye: 'L', mm: LILLIPUT_EYE, look };
export const CHEST: Stand = { on: '仰向けのガリヴァーの胸（3D の体 F107 で測った高さ：地面から 245 mm）', mm: 245 };
export const TURRET: Stand = { on: '神殿の向かいの塔の見晴らし台（本文：5フィート以上、1,524 mm）', mm: 1524 };
export const CITY_WALL: Stand = { on: '都の城壁（本文：2フィート半、762 mm）', mm: 762 };
const LOOKOUT: Stand = { on: '見張りの柱（創作：1,064 mm）', mm: 1064 };
const SMITH: Stand = { on: '鍛冶の足場（創作：100 mm）', mm: 100 };
export const G = (look: string, mm = 1630): Camera => ({ eye: 'G', mm, look });
export const E = (look: string, mm = 1600): Camera => ({ eye: 'E', mm, look });
export const H = (look: string, mm: number): Camera => ({ eye: 'H', mm, look });
export const W = (look: string, mm = 300): Camera => ({ eye: 'W', mm, look });

/** 3D の舞台（fiction-manga@1.2.0 storyboard.staged）。座標はモデルの版の座標（mm、z が上、北が +y）。 */
export type V3 = [number, number, number];
export type StageFigure = { fg: string; ch: string; name: string; fig: string; at: V3; facingDeg: number; pose: string; heightMm: number };
export type StagePanel = {
  panel: string;
  set: string;
  cam: V3;
  look: V3;
  stand?: string | null;
  hfovDeg: number;
  vfovDeg: number;
  figures: StageFigure[];
  crowds: string[];
  /** 3D のモデルが無いコマの理由（地図と本文で描く）。 */
  noModel?: string | null;
  underlay?: string;
  plan: string;
};
export type StageProp = { name: string; kind: string; artifactId: string; versionId: string; contentHash: string };
export type StageSet = { name: string; scenes: string[]; reason: string | null; props: StageProp[]; crowds: { id: string; name: string; count: number }[] };
export type EpisodeStage = { schemaVersion: 1; episode: number; verticalFovDeg: number; sets: Record<string, StageSet>; panels: StagePanel[] };
/** 舞台と、コマに敷くカメラの絵（data:image/jpeg の URI、コマの id ごと）。 */
export type StageInput = { data: EpisodeStage; images: Record<string, string> };
/** 下に敷くカメラの絵の濃さ。 */
export const UNDERLAY_OPACITY = 0.5;

export type NamePanel = {
  /** 脚本のこのシーンから、順に何行を受け持つか。0 は台詞の無い絵だけのコマ。 */
  take: number;
  shot: Shot;
  cam: Camera;
  /** 絵のメモ（ト書きを縮めたもの、AI の提案）。 */
  art: string;
  /** 大きさの違い（ガリヴァーと小人）を見せるコマ。AR-05 でカメラは小人の目の高さ。 */
  size?: boolean;
  /** 段の中での幅の比。既定は 1。 */
  w?: number;
  /** ページの題（扉だけ）。 */
  title?: string;
};
export type NameTier = { h: number; slant?: number; panels: NamePanel[] };
export type NamePage = { scene: string; tiers: NameTier[]; turn?: string };

// ---------------------------------------------------------------- 第1話のネーム

export const EP01_NAME: NamePage[] = [
  // SC-001 序（2ページ）
  {
    scene: 'SC-001',
    turn: '扉。題と、大きさの違う両者を最初に見せる（AR-05）。',
    tiers: [
      {
        h: 7,
        panels: [
          {
            take: 1,
            shot: '大引き',
            cam: L('胸の上の小人の後ろから、横たわるガリヴァーの顎と顔を見上げる。手前に小人の背中と弓', CHEST),
            art: '扉。浜に縛られて横たわるガリヴァーと、胸の上に立つ小人たち。',
            size: true,
            title: 'ガリヴァー旅行記　第1話「人の山」',
          },
        ],
      },
      {
        h: 3,
        panels: [
          {
            take: 1,
            shot: '引き',
            cam: E('夕方の田舎家と厩を、道から見る'),
            art: '約5年後。英国の田舎家と厩。',
          },
        ],
      },
    ],
  },
  {
    scene: 'SC-001',
    tiers: [
      {
        h: 4,
        panels: [
          {
            take: 3,
            shot: '中',
            cam: E('厩の戸口の内側から、馬と男を横から'),
            art: '厩の中。二頭の若い馬に低い声で語りかける痩せた中年の男。戸口に妻メアリー。',
            w: 1.35,
          },
          { take: 2, shot: '寄り', cam: E('馬の鼻先', 1550), art: '馬が鼻を鳴らす。男が嬉しそうに頷く。', w: 0.65 },
        ],
      },
      {
        h: 3,
        panels: [
          { take: 1, shot: '中', cam: E('厩の中から戸口を'), art: '戸口に立つメアリー。中へは入らない。' },
          { take: 1, shot: '寄り', cam: E('男の肩越しに馬を', 1680), art: '戸口に背を向けたままの男。' },
        ],
      },
      {
        h: 3,
        panels: [
          { take: 1, shot: '中', cam: E('戸口の外から'), art: '目を伏せて去るメアリー。', w: 0.8 },
          {
            take: 2,
            shot: '引き',
            cam: E('厩の奥から、夕日の差す戸口を背に', 2000),
            art: '男と馬の後ろ姿。手記の語りが始まる。',
            w: 1.2,
          },
        ],
      },
    ],
  },
  // SC-002 出航（2ページ）
  {
    scene: 'SC-002',
    turn: 'めくると時が戻る（1699年）。',
    tiers: [
      {
        h: 5,
        panels: [
          {
            take: 2,
            shot: '大引き',
            cam: H('ブリストルの港と停泊するアンテロープ号を、帆柱の高さから', 12000),
            art: '1699年5月4日、ブリストルの港。アンテロープ号。',
          },
        ],
      },
      {
        h: 5,
        panels: [
          {
            take: 1,
            shot: '中',
            cam: E('岸壁から'),
            art: '若いガリヴァー（青い上着、真鍮のボタン、金の縁取りなし）が荷を担ぐ。',
          },
          { take: 1, shot: '寄り', cam: E('ガリヴァーの肩越しに', 1650), art: 'メアリー。' },
          { take: 1, shot: '寄り', cam: E('メアリーの肩越しに', 1580), art: 'ガリヴァー。' },
        ],
      },
    ],
  },
  {
    scene: 'SC-002',
    tiers: [
      {
        h: 4,
        panels: [
          { take: 1, shot: '寄り', cam: E('正面', 1520), art: 'メアリーの顔。口元だけ笑っている。', w: 0.8 },
          {
            take: 1,
            shot: '中',
            cam: E('岸壁の人垣の後ろから'),
            art: 'メアリーは笑うが目は笑っていない。ガリヴァーは帽子を振って船に乗る。',
            w: 1.2,
          },
        ],
      },
      {
        h: 6,
        panels: [
          {
            take: 0,
            shot: '大引き',
            cam: H('港の外の丘から、出ていく船を', 30000),
            art: '台詞の無いコマ。港を出ていくアンテロープ号。',
          },
        ],
      },
    ],
  },
  // SC-003 難破（3ページ）
  {
    scene: 'SC-003',
    turn: 'めくると嵐。',
    tiers: [
      {
        h: 5,
        slant: 0.08,
        panels: [{ take: 2, shot: '大引き', cam: W('波頭の高さから、岩に乗り上げる船を', 2000), art: '嵐の海。船が岩に乗り上げる。' }],
      },
      {
        h: 5,
        panels: [
          { take: 1, shot: '寄り', cam: W('甲板の高さ', 3000), art: '船首が砕ける。' },
          { take: 1, shot: '中', cam: W('波間から'), art: '6人の乗った小舟が転覆する。' },
        ],
      },
    ],
  },
  {
    scene: 'SC-003',
    tiers: [
      { h: 5, panels: [{ take: 1, shot: '中', cam: W('波間から、ひとり浮かぶ頭を'), art: '波間にひとり浮かぶガリヴァー。' }] },
      {
        h: 5,
        panels: [
          { take: 1, shot: '中', cam: W('水中から', -700), art: '泳ぐ。やがて足が底に着く。' },
          { take: 1, shot: '引き', cam: W('浅瀬の先から、陸へ歩く背中を', 600), art: '夕暮れの浅瀬を、1マイル近く歩く。' },
        ],
      },
    ],
  },
  {
    scene: 'SC-003',
    tiers: [
      { h: 4, panels: [{ take: 1, shot: '引き', cam: G('浜の高さから、草地に倒れ込む姿を', 450), art: '夜の浜。人家も人影もない。草の上に倒れ込む。' }] },
      {
        h: 6,
        panels: [
          {
            take: 1,
            shot: '大寄り',
            cam: L('草の根元から、眠る頬を', 30),
            art: '頬のそばの短い柔らかな草。草の丈が低い。眠るガリヴァー。',
          },
        ],
      },
    ],
  },
  // SC-004 目覚め（5ページ）
  {
    scene: 'SC-004',
    turn: '朝。動けない（見開きの右）。',
    tiers: [
      { h: 4, panels: [{ take: 1, shot: '大寄り', cam: G('目の真上から', 520), art: '仰向けのガリヴァーの目が開く。空。' }] },
      {
        h: 3,
        panels: [
          { take: 1, shot: '中', cam: G('胸の高さから顔へ', 300), art: '起き上がろうとして、身動き一つできない。' },
          { take: 2, shot: '寄り', cam: L('地面から、杭と糸を'), art: '細い糸で地面に縫い止められた腕と脚、髪。' },
        ],
      },
      { h: 3, panels: [{ take: 1, shot: '寄り', cam: L('脚の脇の地面から'), art: '左脚の上で、何かが動く。' }] },
    ],
  },
  {
    scene: 'SC-004',
    turn: '小人の初めての姿。ページの大ゴマ。',
    tiers: [
      { h: 2.5, panels: [{ take: 1, shot: '寄り', cam: G('顎の下から目へ', 250), art: '何かが胸の上まで来る。目だけで見下ろすガリヴァー。' }] },
      {
        h: 5.5,
        panels: [
          {
            take: 1,
            shot: '大引き',
            cam: L('胸の上の小人の後ろ、その目の高さから、山のような顎を見上げる', CHEST),
            art: '身長6インチに満たない人間。弓矢と矢筒。後ろに40人ほど（AR-05）。',
            size: true,
          },
        ],
      },
      { h: 2, panels: [{ take: 1, shot: '寄り', cam: G('正面', 760), art: '叫ぶガリヴァーの口。' }] },
    ],
  },
  {
    scene: 'SC-004',
    tiers: [
      {
        h: 3,
        slant: 0.07,
        panels: [{ take: 2, shot: '中', cam: L('脇腹の横の地面から'), art: '驚いて胸から転げ落ちる小人たち。', size: true }],
      },
      {
        h: 3,
        panels: [
          { take: 2, shot: '寄り', cam: G('左腕の脇から', 200), art: 'もがいて、左腕の紐を引きちぎる。' },
          { take: 1, shot: '中', cam: L('隊の後ろから、指揮する小人を'), art: '剣を振り上げて号令する小人の隊長。' },
        ],
      },
      {
        h: 4,
        panels: [
          {
            take: 2,
            shot: '大引き',
            cam: L('弓隊の列の中から、巨大な左手を'),
            art: '百本を超える矢が、自由になった左手へ放たれる。',
            size: true,
          },
        ],
      },
    ],
  },
  {
    scene: 'SC-004',
    tiers: [
      {
        h: 3,
        panels: [
          { take: 1, shot: '寄り', cam: G('手の甲の上から', 300), art: '針のような矢の刺さった左手。' },
          { take: 1, shot: '中', cam: G('顔の横から', 300), art: 'じっと横たわり、夜を待つと決めるガリヴァー。' },
        ],
      },
      {
        h: 4,
        panels: [
          {
            take: 1,
            shot: '引き',
            cam: L('足場の下の群衆の中から、演説する貴人と、その奥の耳を'),
            art: '耳の脇に足場が組まれ、身分の高そうな小人が長い演説をする。',
            size: true,
          },
        ],
      },
      {
        h: 3,
        panels: [
          { take: 1, shot: '寄り', cam: G('口元', 360), art: '指で口を差すガリヴァー。', w: 0.8 },
          {
            take: 1,
            shot: '引き',
            cam: L('梯子の下から、胸へ上る運び手の列を'),
            art: '胸に掛けた梯子。肉とパンの籠が運ばれる。',
            size: true,
            w: 1.2,
          },
        ],
      },
    ],
  },
  {
    scene: 'SC-004',
    tiers: [
      {
        h: 3,
        panels: [
          { take: 1, shot: '寄り', cam: G('口の前', 260), art: '雲雀の翼より小さな肉を、二つ三つずつ摘む指。' },
          { take: 2, shot: '中', cam: L('胸の上から、傾く樽と喉を', CHEST), art: '樽を一息で飲み干す。', size: true },
        ],
      },
      {
        h: 2.6,
        panels: [{ take: 2, shot: '引き', cam: L('胸の上で踊る群れの中から', CHEST), art: '放り投げた樽。胸の上で踊る小人たち。', size: true }],
      },
      {
        h: 2.6,
        panels: [{ take: 2, shot: '中', cam: G('胸の上の群れを、自由になった左手越しに', 420), art: '群れの上で止まるガリヴァーの手。' }],
      },
      { h: 1.8, panels: [{ take: 1, shot: '大寄り', cam: G('目の真上から', 520), art: '薬入りの酒で、目が重くなる。' }] },
    ],
  },
  // SC-005 運搬と神殿（4ページ）
  {
    scene: 'SC-005',
    turn: 'めくると夜。眠ったまま運ばれる。',
    tiers: [
      { h: 3, panels: [{ take: 2, shot: '引き', cam: L('道の脇から'), art: '夜。長さ7フィート、車輪22の木の運搬機が引かれてくる。', size: true }] },
      {
        h: 5,
        panels: [
          {
            take: 2,
            shot: '大引き',
            cam: L('柱の上の見張りの目から、900人の滑車と1,500頭の馬を', LOOKOUT),
            art: '900人が滑車で持ち上げ、1,500頭の馬が引く。',
            size: true,
          },
        ],
      },
      { h: 2, panels: [{ take: 1, shot: '寄り', cam: L('車輪の脇から', 40), art: '軋む22の車輪。' }] },
    ],
  },
  {
    scene: 'SC-005',
    tiers: [
      {
        h: 5,
        panels: [
          {
            take: 2,
            shot: '引き',
            cam: L('神殿の前の広場から'),
            art: '都の外の古い神殿。門は高さ4フィート、幅2フィート。中に横たわるガリヴァー。',
            size: true,
          },
        ],
      },
      {
        h: 5,
        panels: [
          { take: 1, shot: '中', cam: L('鍛冶の足場から、鎖と錠を', SMITH), art: '左脚に91本の鎖、36個の錠。', size: true },
          { take: 1, shot: '大寄り', cam: L('錠の前から', 60), art: '錠が閉まる。' },
        ],
      },
    ],
  },
  {
    scene: 'SC-005',
    turn: 'めくると立ち上がる。この話の大ゴマ。',
    tiers: [
      {
        h: 7,
        panels: [
          {
            take: 1,
            shot: '大引き',
            cam: L('足元の群衆の中から、立ち上がる人の山を見上げる'),
            art: '神殿の前で立ち上がるガリヴァー。足元の群衆（AR-05）。',
            size: true,
          },
        ],
      },
      { h: 3, panels: [{ take: 1, shot: '中', cam: L('群衆の中から'), art: 'どよめく群衆。' }] },
    ],
  },
  {
    scene: 'SC-005',
    tiers: [
      {
        h: 3,
        panels: [
          {
            take: 1,
            shot: '引き',
            cam: L('塔の上の貴人たちの後ろから、20フィート先のガリヴァーを', TURRET),
            art: '塔の上の一団の貴人。中央に、ほかより爪の幅ほど背の高い皇帝。',
            size: true,
            w: 1.2,
          },
          { take: 1, shot: '寄り', cam: L('塔の上で、皇帝の正面', TURRET), art: '皇帝。', w: 0.8 },
        ],
      },
      { h: 3, panels: [{ take: 1, shot: '寄り', cam: L('塔の上で、皇帝の横顔を', TURRET), art: '名を与える皇帝。' }] },
      {
        h: 4,
        panels: [
          {
            take: 1,
            shot: '大引き',
            cam: L('都の城壁の上から、200ヤード先の神殿を', CITY_WALL),
            art: '神殿の門に鎖で繋がれて座るガリヴァー。リリパットの囚人になる。',
            size: true,
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------- 組み立て

export type PanelRecord = {
  id: string;
  page: number;
  order: number;
  scene: string;
  lines: { id: string; line: Line }[];
  panel: NamePanel;
};

/** 脚本の行を、コマへ順に割り当てる。足りない・余るときは止める。 */
export function assignLines(episode = 1, pages = EP01_NAME): PanelRecord[] {
  const script = PART1_SCRIPT.find((e) => e.n === episode)!;
  const cursor = new Map(script.scenes.map((s) => [s.scene, 0]));
  const records: PanelRecord[] = [];
  pages.forEach((page, pi) => {
    const scene = script.scenes.find((s) => s.scene === page.scene);
    if (!scene) throw Error(`第${episode}話に ${page.scene} が無い`);
    let order = 0;
    for (const tier of page.tiers)
      for (const panel of tier.panels) {
        const start = cursor.get(page.scene)!;
        const lines = scene.lines.slice(start, start + panel.take).map((line, i) => ({
          id: `${scene.scene}.L${String(start + i + 1).padStart(2, '0')}`,
          line,
        }));
        if (lines.length !== panel.take) throw Error(`${page.scene} の行が足りない（${pi + 1}ページ）`);
        cursor.set(page.scene, start + panel.take);
        order++;
        records.push({ id: panelId(episode, pi + 1, order), page: pi + 1, order, scene: page.scene, lines, panel });
      }
  });
  return records;
}
export const panelId = (episode: number, page: number, order: number) =>
  `e${String(episode).padStart(2, '0')}-p${String(page).padStart(2, '0')}-k${order}`;
export const pageId = (episode: number, page: number) =>
  `e${String(episode).padStart(2, '0')}-p${String(page).padStart(2, '0')}`;

/** 段と段の境、段の中のコマとコマの境を、分割木にする（上・左が a）。 */
function divisionTree(episode: number, page: number, tiers: NameTier[]): DesignDivisionNode {
  const total = tiers.reduce((n, t) => n + t.h, 0);
  const cx = REGION.x + REGION.width / 2;
  let order = 0;
  let top = REGION.y;
  const tierNodes = tiers.map((tier, ti) => {
    const height = (REGION.height * tier.h) / total;
    const mid = top + height / 2;
    const weights = tier.panels.map((p) => p.w ?? 1);
    const sum = weights.reduce((a, b) => a + b, 0);
    let left = REGION.x;
    const leaves = tier.panels.map(() => ({ panelId: panelId(episode, page, ++order) }));
    const cuts = weights.slice(0, -1).map((w) => (left += (REGION.width * w) / sum));
    const row = (i: number): DesignDivisionNode =>
      i === leaves.length - 1
        ? leaves[i]
        : {
            dividerId: `${pageId(episode, page)}-t${ti + 1}v${i + 1}`,
            line: { nx: 1, ny: 0, offset: cuts[i] },
            gap: GUTTER,
            a: leaves[i],
            b: row(i + 1),
          };
    top += height;
    return { node: row(0), bottom: top, slant: tier.slant ?? 0, mid };
  });
  const chain = (i: number): DesignDivisionNode => {
    if (i === tierNodes.length - 1) return tierNodes[i].node;
    const s = tierNodes[i].slant;
    const ny = Math.sqrt(1 - s * s);
    return {
      dividerId: `${pageId(episode, page)}-h${i + 1}`,
      line: { nx: s, ny, offset: s * cx + ny * tierNodes[i].bottom },
      gap: GUTTER,
      a: tierNodes[i].node,
      b: chain(i + 1),
    };
  };
  return chain(0);
}

type Rect = { x: number; y: number; width: number; height: number };
type Pt = { x: number; y: number };

/** コマの多角形（世界座標）。 */
export function panelPolygon(e: DesignElement): Pt[] {
  const b = e.bounds;
  return e.panelGeometry!.polygon.map((p) => ({ x: b.x + p.x * b.width, y: b.y + p.y * b.height }));
}
/** 凸多角形の内側に、各辺から margin 以上離れて入っているか。 */
export function insidePolygon(points: Pt[], polygon: Pt[], margin: number) {
  const n = polygon.length;
  const area = polygon.reduce((s, p, i) => s + p.x * polygon[(i + 1) % n].y - polygon[(i + 1) % n].x * p.y, 0);
  const sign = Math.sign(area);
  return points.every((q) =>
    polygon.every((a, i) => {
      const b = polygon[(i + 1) % n];
      const cross = (b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x);
      return (sign * cross) / Math.hypot(b.x - a.x, b.y - a.y) >= margin;
    }),
  );
}
export const corners = (r: Rect): Pt[] => [
  { x: r.x, y: r.y },
  { x: r.x + r.width, y: r.y },
  { x: r.x + r.width, y: r.y + r.height },
  { x: r.x, y: r.y + r.height },
];
/** 多角形の中で使える矩形。外接矩形から、はみ出した角の側を少しずつ縮める。 */
function innerRect(polygon: Pt[], margin: number): Rect {
  const xs = polygon.map((p) => p.x),
    ys = polygon.map((p) => p.y);
  let r = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  for (let i = 0; i < 400 && !insidePolygon(corners(r), polygon, margin); i++) {
    const [tl, tr, br, bl] = corners(r).map((c) => insidePolygon([c], polygon, margin));
    if (!tl || !tr) r = { ...r, y: r.y + 2, height: r.height - 2 };
    if (!bl || !br) r = { ...r, height: r.height - 2 };
    if (!tl || !bl) r = { ...r, x: r.x + 2, width: r.width - 2 };
    if (!tr || !br) r = { ...r, width: r.width - 2 };
  }
  return r;
}

type Item = {
  line?: { id: string; line: Line };
  kind: 'title' | 'tag' | 'memo' | 'N' | 'D' | 'S';
  text: string;
  font: number;
  min: number;
  maxWidth: number;
};
function textHeight(text: string, width: number, font: number, family: string, lineHeight: number, bold = false) {
  const layout = layoutDrawingText({
    id: 'measure',
    kind: 'text',
    text,
    bounds: { x: 0, y: 0, width, height: 100000 },
    fill: '#000',
    typography: { fontSize: font, fontFamily: family, padding: 0, lineHeight, bold },
  } as never);
  return { height: layout.totalHeight, lines: layout.lines.length };
}
const tagText = (r: PanelRecord) =>
  `${r.order}　${r.panel.shot}｜${EYE_NAMES[r.panel.cam.eye]} ${r.panel.cam.mm.toLocaleString('en-US')} mm`;
const isShout = (l: Line) => l.k === 'D' && /！$/.test(l.text) && l.text.length <= 12;

/** 置いた要素の記録。検査で使う。 */
export type Placed = { panelId: string; lineId?: string; kind: Item['kind']; textBox: Rect; outline: Rect; font: number };

/** コマの中に、タグ・ナレーション・台詞・擬音・絵のメモを上から順に置く（左から右、ジグザグ）。 */
function layoutPanel(panel: DesignElement, record: PanelRecord): { placed: Placed[]; ok: boolean } {
  const polygon = panelPolygon(panel);
  const inner = innerRect(polygon, 10);
  const p = record.panel;
  const memo = `絵：${p.art}`;
  const tag = tagText(record);
  for (let shrink = 0; shrink <= 8; shrink++) {
    const items: Item[] = [];
    if (p.title) items.push({ kind: 'title', text: p.title, font: 30, min: 30, maxWidth: inner.width });
    for (const l of record.lines) {
      const { line } = l;
      if (line.k === 'T') continue;
      const base = line.k === 'N' ? FONT.narration : line.k === 'S' ? FONT.sfx : isShout(line) ? FONT.shout : FONT.dialogue;
      let font = Math.max(base.min, base.size - shrink);
      // 擬音は1行に収める：長い擬音（第3話 10-2「ヒュンヒュンヒュン」、RV-e03-07）は、折り返す代わりに字を小さくする。
      if (line.k === 'S') font = Math.max(base.min, Math.min(font, Math.floor(Math.min(260, inner.width) / (line.text.length + 1))));
      items.push({
        line: l,
        kind: line.k,
        text: line.text,
        font,
        min: base.min,
        maxWidth: line.k === 'N' ? Math.min(330, inner.width) : line.k === 'S' ? Math.min(260, inner.width) : Math.min(font * 11.5 / 0.72, inner.width * 0.62, 320),
      });
    }
    const placed: Placed[] = [];
    const tagH = textHeight(tag, inner.width, FONT.memo, GOTHIC, 1.2, true).height;
    const memoH = textHeight(memo, inner.width, FONT.memo, GOTHIC, 1.3).height;
    let y = inner.y + tagH + 4;
    const bottom = inner.y + inner.height - memoH - 4;
    let side = 0;
    let ok = true;
    for (const item of items) {
      let box: Rect, outline: Rect;
      if (item.kind === 'D') {
        // 楕円の吹き出し。文字は内接する矩形（幅・高さの 72%）に入れる。
        const chars = Math.max(...item.text.split('\n').map((s) => s.length));
        const tw = Math.min(item.maxWidth * 0.72, Math.max(item.font * 3, item.font * 1.1 * Math.min(chars, 11) + item.font * 0.6));
        const th = textHeight(item.text, tw, item.font, GOTHIC, 1.25, isShout(item.line!.line)).height;
        const ow = tw / 0.72,
          oh = Math.max(th / 0.66, item.font * 2.4);
        const x = side % 2 === 0 ? inner.x : inner.x + inner.width - ow;
        outline = { x, y, width: ow, height: oh };
        box = { x: x + (ow - tw) / 2, y: y + (oh - th) / 2, width: tw, height: th };
        y += oh + 14; // 尻尾の分
        side++;
      } else if (item.kind === 'N') {
        const tw = item.maxWidth - 16;
        const th = textHeight(item.text, tw, item.font, MINCHO, 1.35).height;
        const x = side % 2 === 0 ? inner.x : inner.x + inner.width - item.maxWidth;
        outline = { x, y, width: item.maxWidth, height: th + 16 };
        box = { x: x + 8, y: y + 8, width: tw, height: th };
        y += th + 16 + 8;
        side++;
      } else {
        // 擬音と題：枠の無い文字。
        const family = GOTHIC;
        const tw = item.kind === 'S' ? Math.min(item.maxWidth, item.font * (item.text.length + 1)) : item.maxWidth;
        const th = textHeight(item.text, tw, item.font, family, 1.15).height;
        const x = item.kind === 'S' ? (side % 2 === 0 ? inner.x + inner.width - tw : inner.x) : inner.x;
        outline = box = { x, y, width: tw, height: th };
        y += th + 8;
      }
      if (y - 8 > bottom) ok = false;
      placed.push({ panelId: panel.id, lineId: item.line?.id, kind: item.kind, textBox: box, outline, font: item.font });
    }
    placed.unshift({ panelId: panel.id, kind: 'tag', textBox: { x: inner.x, y: inner.y, width: inner.width, height: tagH }, outline: { x: inner.x, y: inner.y, width: inner.width, height: tagH }, font: FONT.memo });
    const memoBox = { x: inner.x, y: inner.y + inner.height - memoH, width: inner.width, height: memoH };
    placed.push({ panelId: panel.id, kind: 'memo', textBox: memoBox, outline: memoBox, font: FONT.memo });
    if (ok || shrink === 8) {
      const fonts = placed.filter((q) => q.lineId);
      return { placed, ok: ok && fonts.every((q, i) => q.font >= items.filter((it) => it.line)[i].min) };
    }
  }
  throw Error('unreachable');
}

/**
 * 台詞・ナレーション・擬音・題を、読む順（上から、同じ高さなら左から右）を保ったまま、コマの絵の濃いところと
 * 人物の頭を避ける位置へ動かす。タグと絵のメモは動かさない。どこにも置けないときは元の位置のまま。
 */
export function avoidFigures(panel: DesignElement, placed: Placed[], occ: Occupancy): Placed[] {
  const polygon = panelPolygon(panel);
  const b = panel.bounds;
  const tag = placed.find((q) => q.kind === 'tag')!;
  const memo = placed.find((q) => q.kind === 'memo')!;
  const top = tag.outline.y + tag.outline.height + 4;
  const bottom = memo.outline.y - 4;
  const cw = b.width / occ.cols,
    ch = b.height / occ.rows;
  const cost = (r: Rect) => {
    let c = 0;
    const i0 = Math.max(0, Math.floor((r.x - b.x) / cw)),
      i1 = Math.min(occ.cols - 1, Math.floor((r.x + r.width - b.x) / cw));
    const j0 = Math.max(0, Math.floor((r.y - b.y) / ch)),
      j1 = Math.min(occ.rows - 1, Math.floor((r.y + r.height - b.y) / ch));
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const ox = Math.min(r.x + r.width, b.x + (i + 1) * cw) - Math.max(r.x, b.x + i * cw);
        const oy = Math.min(r.y + r.height, b.y + (j + 1) * ch) - Math.max(r.y, b.y + j * ch);
        if (ox > 0 && oy > 0) c += (occ.cells[j * occ.cols + i]! * ox * oy) / (cw * ch);
      }
    return c;
  };
  const overlaps = (a: Rect, q: Rect, m: number) =>
    a.x < q.x + q.width + m && q.x < a.x + a.width + m && a.y < q.y + q.height + m && q.y < a.y + a.height + m;
  const out: Placed[] = [];
  const done: Rect[] = [];
  let prev: Rect | null = null;
  for (const q of placed) {
    if (q.kind === 'tag' || q.kind === 'memo') {
      out.push(q);
      continue;
    }
    const tail = q.kind === 'D' ? 14 : 0;
    const box = { ...q.outline, height: q.outline.height + tail };
    let best: { x: number; y: number; c: number } | null = null;
    for (let y = top; y + box.height <= bottom; y += 6)
      for (let x = b.x; x + box.width <= b.x + b.width; x += 6) {
        const r = { x, y, width: box.width, height: box.height };
        // 読む順：前の文字より下か、同じ段で右。
        if (prev && !(y >= prev.y + prev.height + 4 || (y >= prev.y - 2 && x >= prev.x + prev.width + 6))) continue;
        if (!insidePolygon(corners(r), polygon, 8)) continue;
        if (done.some((d) => overlaps(r, d, 6))) continue;
        const onHead = (occ.heads ?? []).filter((h) => {
          const hx = b.x + h.x * b.width,
            hy = b.y + h.y * b.height;
          return hx >= r.x && hx <= r.x + r.width && hy >= r.y && hy <= r.y + r.height;
        }).length;
        const c = cost(r) + onHead * 1000 + (y - top) * 0.004 + Math.abs(x - q.outline.x) * 0.001;
        if (!best || c < best.c) best = { x, y, c };
      }
    if (!best) {
      out.push(q);
      done.push(box);
      prev = box;
      continue;
    }
    const dx = best.x - q.outline.x,
      dy = best.y - q.outline.y;
    const moved: Placed = {
      ...q,
      outline: { ...q.outline, x: q.outline.x + dx, y: q.outline.y + dy },
      textBox: { ...q.textBox, x: q.textBox.x + dx, y: q.textBox.y + dy },
    };
    const nb = { ...box, x: best.x, y: best.y };
    out.push(moved);
    done.push(nb);
    prev = nb;
  }
  return out;
}

/** ラフ（fiction-manga ラフ）でコマのアタリの層に敷く絵。 */
export type RoughImage = { src: string; alt: string; source: string; license: string };
/**
 * レイヤー分け（画作りガイドのレイヤーの決まり）。ラフでは、コマごとに LY-01 下絵（3D）・LY-02 アタリ・
 * LY-09 吹き出し・LY-10 文字のグループを作り、コマの中身をそこへ入れる。
 */
export type LayerOptions = {
  rough?: Record<string, RoughImage>;
  underlayOpacity?: number;
  avoid?: Record<string, Occupancy>;
  /**
   * 線画：コマごとの LY-04 背景の線画・LY-07 人物の線画・LY-08 効果の画像。あると、LY-02 アタリの上に
   * 3つのグループを作り、LY-01 と LY-02 を隠す（画作りガイド：線画からは隠して残す）。
   */
  ink?: Record<string, InkImages>;
  /**
   * 仕上げ：コマごとの LY-03 背景の塗り・LY-05 人物の塗り・LY-06 影の画像（線画と一緒に使う）。あると、レイヤーを
   * 画作りガイドの重ね順 LY-03〜LY-08 で作り、LY-01 下絵と LY-02 アタリは作らない（仕上げの段階には要らない）。
   */
  finish?: Record<string, FinishImages>;
};
export type FinishImages = { bgFill: RoughImage; figFill: RoughImage; shadow: RoughImage };
/** 仕上げの塗りと影のレイヤー（画作りガイドのレイヤーの決まりの名前）。 */
export const FINISH_LAYERS = {
  bgFill: 'LY-03 背景の塗り',
  figFill: 'LY-05 人物の塗り',
  shadow: 'LY-06 影',
} as const;
export type InkImages = { bg: RoughImage; fig: RoughImage; fx: RoughImage };
/** 線画のレイヤー（画作りガイドのレイヤーの決まりの名前）。重ね順は LY-04、LY-07、LY-08。 */
export const INK_LAYERS = {
  bg: 'LY-04 背景の線画',
  fig: 'LY-07 人物の線画',
  fx: 'LY-08 効果',
} as const;
/**
 * 文字を置きたくないところ（コマの絵の上の格子、行優先、0〜1）。ラフ絵の線の濃さと、3D のカメラに写る人物の頭。
 * 格子はコマの外接矩形（絵を敷いた範囲）を cols×rows に分ける。
 */
export type Occupancy = { cols: number; rows: number; cells: number[]; heads?: { x: number; y: number }[] };
export const LAYERS = {
  underlay: 'LY-01 下絵（3D）',
  atari: 'LY-02 アタリ',
  text: 'LY-10 文字（仮。擬音と題）',
  memo: 'メモ（ラフの指示。レイヤーの決まりの外、書き出しでは隠す）',
} as const;
/**
 * LY-09 吹き出し（仮）。エディタで一つずつ動かせるよう、吹き出し・ナレーションの枠ごとに、台詞の文字と一緒の
 * グループにしてコマの直下（レイヤーのグループの上）に置き、名前を LY-09 で始める。
 */
export const BALLOON_LAYER = 'LY-09';
/** 動かさないレイヤー（ラフ絵と下絵を、吹き出しを動かすときに一緒に動かさない）。 */
const LOCKED_LAYERS = new Set<keyof typeof LAYERS>(['underlay', 'atari', 'memo']);

export type NameBuild = {
  content: DesignContent;
  records: PanelRecord[];
  placed: Placed[];
  overflow: string[];
  memos: Map<string, string>;
};

/** 第1話のネームを Design 原稿にする。 */
export function buildEpisodeName(episode = 1, pages = EP01_NAME, stage?: StageInput, layers?: LayerOptions): NameBuild {
  const records = assignLines(episode, pages);
  let d = createDesign();
  pages.forEach((page, pi) => {
    const id = pageId(episode, pi + 1);
    d = insertDesignPage({ x: pi * (PAGE.width + PAGE.gap), y: 0, width: PAGE.width, height: PAGE.height }, id).apply(d);
    d = updateElement(id, { fill: '#ffffff', strokeWidth: 0, name: `${pi + 1}ページ（${page.scene}）` }).apply(d);
    d = designDivisionCommand({ type: 'startDivision', pageId: id, region: { ...REGION }, root: divisionTree(episode, pi + 1, page.tiers) }).apply(d);
    // 読み順は上の段から、段の中は左から右（分割木の葉の順と同じ）。
    const order = records.filter((r) => r.page === pi + 1).map((r) => r.id);
    d = setDesignPagination({
      ...d.pagination!,
      pages: d.pagination!.pages.map((p) => (p.frameId === id ? { ...p, panelIds: order } : p)),
    }).apply(d);
  });
  d = setDesignPagination({ ...d.pagination!, direction: 'ltr' }).apply(d);

  const placed: Placed[] = [];
  const overflow: string[] = [];
  const memos = new Map<string, string>();
  let n = 0;
  const nid = (kind: string) => `${kind}-${String(++n).padStart(4, '0')}`;
  const toLock: string[] = [];
  const toHide: string[] = [];
  const text = (parentId: string, box: Rect, value: string, name: string, typography: Record<string, unknown>, fill = '#111111') => {
    const id = nid('tx');
    d = insertElement('text', { id, parentId, bounds: box }).apply(d);
    d = updateElement(id, { name, text: value, fill, typography: { padding: 0, ...typography } as never }).apply(d);
    return id;
  };
  /**
   * 色の上でも読める文字（仕上げの題と擬音）：白い縁取り（8方向にずらした白い文字）を下に敷き、黒い文字を重ねる。
   * 縁取りと文字は一つのグループ（エディタで一緒に動く）。
   */
  const haloText = (parentId: string, box: Rect, value: string, name: string, typography: Record<string, unknown>) => {
    const gid = nid('halo-group');
    d = insertElement('group', { id: gid, parentId, bounds: { ...box } }).apply(d);
    d = updateElement(gid, { name: `${name}（白い縁取り付き）` }).apply(d);
    const w = Math.max(1.5, Number(typography.fontSize) / 12);
    for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] as const)
      text(gid, { ...box, x: box.x + dx * w, y: box.y + dy * w }, value, `${name} の縁取り`, typography, '#ffffff');
    return text(gid, box, value, name, typography);
  };
  for (const r of records) {
    const panel = d.elements.find((e) => e.id === r.id)!;
    const p = r.panel;
    d = updateElement(r.id, { name: `${r.page}-${r.order} ${p.shot}：${p.art}`.slice(0, 200), strokeWidth: 3, stroke: '#111111', fill: '#ffffff' }).apply(d);
    // レイヤー（ラフ）：コマの中に、重ね順のとおりグループを作る。
    type LayerKey = keyof typeof LAYERS | keyof typeof INK_LAYERS | keyof typeof FINISH_LAYERS;
    const layer: Record<LayerKey | 'balloon', string> = {
      underlay: r.id, atari: r.id, bg: r.id, fig: r.id, fx: r.id, bgFill: r.id, figFill: r.id, shadow: r.id, balloon: r.id, text: r.id, memo: r.id,
    };
    const ink = layers?.ink?.[r.id];
    const fin = ink ? layers?.finish?.[r.id] : undefined;
    const layerName = (k: LayerKey) =>
      k in LAYERS ? LAYERS[k as keyof typeof LAYERS] : k in INK_LAYERS ? INK_LAYERS[k as keyof typeof INK_LAYERS] : FINISH_LAYERS[k as keyof typeof FINISH_LAYERS];
    if (layers) {
      const keys: LayerKey[] = fin
        ? ['bgFill', 'bg', 'figFill', 'shadow', 'fig', 'fx', 'text', 'memo']
        : ['underlay', 'atari', ...(ink ? (['bg', 'fig', 'fx'] as const) : []), 'text', 'memo'];
      for (const k of keys) {
        const gid = nid(`layer-${k}`);
        d = insertElement('group', { id: gid, parentId: r.id, bounds: { ...panel.bounds } }).apply(d);
        d = updateElement(gid, { name: layerName(k) }).apply(d);
        // 線画では、絵のレイヤーも固定する（吹き出しを動かすときに一緒に動かさない）。下絵とアタリは隠して残す。
        if (LOCKED_LAYERS.has(k as keyof typeof LAYERS) || (ink && (k in INK_LAYERS || k in FINISH_LAYERS))) toLock.push(gid);
        if (ink && (k === 'underlay' || k === 'atari')) toHide.push(gid);
        layer[k] = gid;
      }
    }
    const lyName = (name: string) => (layers ? `${BALLOON_LAYER} ${name}` : name);
    // アタリ：3D の舞台のカメラの絵をコマの枠に切り抜いたもの。コマの一番下に敷く（ラフでは LY-01 下絵（3D））。
    const sp = stage?.data.panels.find((x) => x.panel === r.id);
    if (sp?.underlay && !fin) {
      const set = stage!.data.sets[sp.set]!;
      const iid = nid('underlay');
      d = insertElement('image', { id: iid, parentId: layer.underlay, bounds: { ...panel.bounds }, src: stage!.images[r.id] }).apply(d);
      d = updateElement(iid, { name: layers ? `下絵（3D のカメラの絵 ${r.id}）` : `アタリ（3D のカメラの絵 ${r.id}）`, imageFit: 'fill', opacity: layers?.underlayOpacity ?? UNDERLAY_OPACITY, alt: `3D の舞台「${set.name}」をカメラ (${sp.cam.join(', ')}) mm から注視点 (${sp.look.join(', ')}) mm へ見た絵` }).apply(d);
      d = setDesignPagination({
        ...d.pagination!,
        images: [
          ...d.pagination!.images,
          {
            elementId: iid,
            source: `3D の舞台「${set.name}」のカメラの絵（${sp.panel}、横 ${sp.hfovDeg}°×縦 ${sp.vfovDeg}°）。モデル：${set.props.map((p) => `${p.name} ${p.artifactId}@${p.versionId}`).join('、')}`,
            license: 'gulliver-manga の自作（Editor Platform で描いた 3D の下絵）',
          },
        ],
      }).apply(d);
    }
    const rough = layers?.rough?.[r.id];
    if (rough && !fin) {
      const iid = nid('rough');
      d = insertElement('image', { id: iid, parentId: layer.atari, bounds: { ...panel.bounds }, src: rough.src }).apply(d);
      d = updateElement(iid, { name: `ラフ絵 ${r.id}`, imageFit: 'fill', opacity: 1, alt: rough.alt }).apply(d);
      d = setDesignPagination({ ...d.pagination!, images: [...d.pagination!.images, { elementId: iid, source: rough.source, license: rough.license }] }).apply(d);
    }
    if (fin) {
      for (const k of ['bgFill', 'figFill', 'shadow'] as const) {
        const iid = nid(`finish-${k}`);
        d = insertElement('image', { id: iid, parentId: layer[k], bounds: { ...panel.bounds }, src: fin[k].src }).apply(d);
        d = updateElement(iid, { name: `${FINISH_LAYERS[k].slice(6)} ${r.id}`, imageFit: 'fill', opacity: 1, alt: fin[k].alt }).apply(d);
        d = setDesignPagination({ ...d.pagination!, images: [...d.pagination!.images, { elementId: iid, source: fin[k].source, license: fin[k].license }] }).apply(d);
      }
    }
    if (ink) {
      for (const k of ['bg', 'fig', 'fx'] as const) {
        const iid = nid(`ink-${k}`);
        d = insertElement('image', { id: iid, parentId: layer[k], bounds: { ...panel.bounds }, src: ink[k].src }).apply(d);
        d = updateElement(iid, { name: `${INK_LAYERS[k].slice(6)} ${r.id}`, imageFit: 'fill', opacity: 1, alt: ink[k].alt }).apply(d);
        d = setDesignPagination({ ...d.pagination!, images: [...d.pagination!.images, { elementId: iid, source: ink[k].source, license: ink[k].license }] }).apply(d);
      }
    }
    const laid = layoutPanel(panel, r);
    const ok = laid.ok;
    const avoid = layers?.avoid?.[r.id];
    const items = avoid ? avoidFigures(panel, laid.placed, avoid) : laid.placed;
    if (!ok) overflow.push(r.id);
    const memo = `絵：${p.art}`;
    memos.set(r.id, memo);
    for (const it of items) {
      placed.push(it);
      if (it.kind === 'tag')
        text(layer.memo, it.textBox, tagText(r), 'コマのタグ（ネームのメモ）', { fontFamily: GOTHIC, fontSize: FONT.memo, bold: true, lineHeight: 1.2 }, '#2563eb');
      else if (it.kind === 'memo')
        text(layer.memo, it.textBox, memo, '絵のメモ（ト書き）', { fontFamily: GOTHIC, fontSize: FONT.memo, lineHeight: 1.3 }, '#6b7280');
      else if (it.kind === 'title') {
        const ty = { fontFamily: MINCHO, fontSize: it.font, bold: true, lineHeight: 1.15 };
        if (fin) haloText(layer.text, it.textBox, p.title!, '題', ty);
        else text(layer.text, it.textBox, p.title!, '題', ty);
      }
      else {
        const line = r.lines.find((l) => l.id === it.lineId)!.line;
        if (it.kind === 'D') {
          const gid = nid('balloon');
          const speaker = SPEAKER_NAMES[line.who!];
          d = insertElement('group', { id: gid, parentId: layer.balloon, bounds: { ...it.outline, height: it.outline.height + 14 } }).apply(d);
          d = updateElement(gid, { name: lyName(`台詞 ${it.lineId} ${line.who} ${speaker}`) }).apply(d);
          const oid = nid('outline');
          d = insertElement('shape', { id: oid, parentId: gid, bounds: it.outline }).apply(d);
          d = updateElement(oid, { name: '吹き出し（仮、LY-09）', shape: 'ellipse', fill: '#ffffff', stroke: '#111111', strokeWidth: 2 }).apply(d);
          const tail = nid('tail');
          const tx = it.outline.x + it.outline.width * (it.outline.x > panel.bounds.x + panel.bounds.width / 2 - it.outline.width / 2 ? 0.3 : 0.6);
          d = insertElement('shape', { id: tail, parentId: gid, bounds: { x: tx, y: it.outline.y + it.outline.height - 3, width: 16, height: 17 } }).apply(d);
          d = updateElement(tail, { name: `尻尾（${speaker}へ）`, shape: 'triangle', flipY: true, fill: '#ffffff', stroke: '#111111', strokeWidth: 2 }).apply(d);
          text(gid, it.textBox, line.text, `台詞の文 ${it.lineId}`, { fontFamily: GOTHIC, fontSize: it.font, bold: isShout(line), align: 'center', verticalAlign: 'middle', lineHeight: 1.25 });
        } else if (it.kind === 'N') {
          let holder: string = r.id;
          if (layers) {
            holder = nid('narration-group');
            d = insertElement('group', { id: holder, parentId: layer.balloon, bounds: { ...it.outline } }).apply(d);
            d = updateElement(holder, { name: lyName(`ナレーション ${it.lineId}（枠と文字）`) }).apply(d);
          }
          const bid = nid('narration');
          d = insertElement('rectangle', { id: bid, parentId: holder, bounds: it.outline }).apply(d);
          d = updateElement(bid, { name: `ナレーションの枠 ${it.lineId}`, fill: '#ffffff', stroke: '#111111', strokeWidth: 1.5 }).apply(d);
          text(holder, it.textBox, line.text, `ナレーション ${it.lineId} CH-01`, { fontFamily: MINCHO, fontSize: it.font, lineHeight: 1.35 });
        } else if (it.kind === 'S') {
          const ty = { fontFamily: GOTHIC, fontSize: it.font, bold: true, lineHeight: 1.15 };
          if (fin) haloText(layer.text, it.textBox, line.text, `擬音 ${it.lineId}（仮、手描きは LY-08）`, ty);
          else text(layer.text, it.textBox, line.text, `擬音 ${it.lineId}（仮、手描きは LY-08）`, ty, '#9ca3af');
        }
      }
    }
  }
  // ノンブル（ページ番号）。
  pages.forEach((_, pi) => {
    const id = pageId(episode, pi + 1);
    const x = pi * (PAGE.width + PAGE.gap);
    text(id, { x: x + PAGE.width / 2 - 30, y: PAGE.height - 40, width: 60, height: 20 }, String(pi + 1).padStart(2, '0'), 'ノンブル', { fontFamily: GOTHIC, fontSize: 14, align: 'center' }, '#6b7280');
  });
  // 中身を入れ終えてから、動かさないレイヤーを固定する。
  // 隠すレイヤー（線画の LY-01・LY-02）は、隠すのと固定するのを一度にする（隠したものは編集できない）。
  for (const id of toLock) d = updateElement(id, toHide.includes(id) ? { locked: true, hidden: true } : { locked: true }).apply(d);
  return { content: d, records, placed, overflow, memos };
}

// ---------------------------------------------------------------- 資料

const stamp = '2026-11-14T00:00:00.000Z';
const VERSION = 'name-ep01-v2';
export async function native(kind: string, id: string, name: string, content: unknown, version = VERSION, reason = 'ガリヴァー旅行記 第1話のネーム（fiction-manga@1.2.0 ネーム、3D の舞台で組んだ AI の提案）') {
  const artifact: Artifact<unknown> = {
    schemaVersion: 1,
    id,
    name,
    kind,
    provenance: { source: 'created' },
    draft: { baseVersionId: version, updatedAt: stamp, content: structuredClone(content) },
    versions: [
      {
        artifactId: id,
        versionId: version,
        parentVersionId: null,
        schemaVersion: 1,
        createdAt: stamp,
        createdBy: null,
        reason,
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

const xyz = (v: V3) => `(${v.map((n) => Math.round(n)).join(', ')})`;
export function panelTable(records: PanelRecord[], pages: NamePage[], stage?: EpisodeStage): StructuredData {
  const staged = (id: string) => stage?.panels.find((x) => x.panel === id);
  const kinds = { N: 'ナレーション', D: '台詞', T: 'ト書き', S: '擬音' } as const;
  return {
    schemaVersion: 2,
    columns: [
      { id: 'nm.page', name: 'ページ', type: 'number', required: true },
      { id: 'nm.order', name: 'コマ', type: 'number', required: true },
      { id: 'nm.scene', name: 'シーン', type: 'text', required: true },
      { id: 'nm.shot', name: '大きさ', type: 'select', options: ['大引き', '引き', '中', '寄り', '大寄り'], required: true },
      { id: 'nm.eye', name: 'カメラの目', type: 'select', options: Object.values(EYE_NAMES), required: true },
      { id: 'nm.mm', name: '目の高さ（地面・水面から、mm、実寸。3D の舞台のカメラの高さ）', type: 'number', required: true },
      { id: 'nm.stand', name: 'カメラの立つ台', type: 'text' },
      { id: 'nm.look', name: 'カメラの向き', type: 'text' },
      { id: 'nm.size', name: '大きさの違いを見せる', type: 'boolean' },
      { id: 'nm.art', name: '絵', type: 'text', required: true },
      { id: 'nm.lines', name: '脚本の行', type: 'text' },
      { id: 'nm.text', name: '文字にする行', type: 'text' },
      { id: 'nm.turn', name: 'めくり', type: 'text' },
      { id: 'st.set', name: '3D の舞台', type: 'text' },
      { id: 'st.cam', name: 'カメラの位置（モデルの座標、mm）', type: 'text' },
      { id: 'st.look', name: 'カメラの注視点（モデルの座標、mm）', type: 'text' },
      { id: 'st.fov', name: '画角（コマの枠）', type: 'text' },
      { id: 'st.figures', name: '人物（FG・人物表・位置・向き・ポーズ）', type: 'text' },
      { id: 'st.crowds', name: '群衆', type: 'text' },
      { id: 'st.models', name: 'モデルの版', type: 'text' },
      { id: 'st.underlay', name: 'コマに敷いたカメラの絵', type: 'text' },
      { id: 'st.plan', name: '真上からの配置図', type: 'text' },
    ],
    rows: records.map((r) => ({
      id: r.id,
      values: {
        'nm.page': r.page,
        'nm.order': r.order,
        'nm.scene': r.scene,
        'nm.shot': r.panel.shot,
        'nm.eye': EYE_NAMES[r.panel.cam.eye],
        'nm.mm': r.panel.cam.mm,
        'nm.stand': r.panel.cam.stand?.on ?? '',
        'nm.look': r.panel.cam.look,
        'nm.size': !!r.panel.size,
        'nm.art': r.panel.art,
        'nm.lines': r.lines.map((l) => l.id).join(' '),
        'nm.text': r.lines
          .filter((l) => l.line.k !== 'T')
          .map((l) => `${kinds[l.line.k]}${l.line.who ? `（${SPEAKER_NAMES[l.line.who]}）` : ''}：${l.line.text}`)
          .join(' / '),
        'nm.turn': r.order === 1 ? (pages[r.page - 1].turn ?? '') : '',
        ...stageValues(staged(r.id), stage),
      },
    })),
  };
}

function stageValues(sp: StagePanel | undefined, stage: EpisodeStage | undefined) {
  if (!sp || !stage) return {};
  const set = stage.sets[sp.set]!;
  return {
    'st.set': `${sp.set}：${set.name}`,
    'st.cam': `${xyz(sp.cam)}${sp.stand ? `（${sp.stand} の上）` : ''}`,
    'st.look': xyz(sp.look),
    'st.fov': `横 ${sp.hfovDeg}° × 縦 ${sp.vfovDeg}°`,
    'st.figures': sp.figures.map((f) => `${f.fg} ${f.ch} ${f.name} ${xyz(f.at)} 向き ${f.facingDeg}° ${f.pose}`).join(' / '),
    'st.crowds': sp.crowds.map((c) => set.crowds.find((x) => x.id === c)).filter(Boolean).map((c) => `${c!.name}（${c!.count}）`).join('、'),
    'st.models': set.props.map((p) => `${p.name}（${p.kind} ${p.artifactId}@${p.versionId} ${p.contentHash}）`).join(' / '),
    'st.underlay': sp.underlay ?? `無し：${sp.noModel ?? ''}`,
    'st.plan': sp.plan,
  };
}

export async function buildGulliverEp01Name(stage?: StageInput) {
  const build = buildEpisodeName(1, EP01_NAME, stage);
  return {
    build,
    artifacts: [
      await native('design', 'gm1-ep01-name', '第1話「人の山」ネーム（16ページ）', build.content),
      await native('data', 'gm1-ep01-name-panels', '第1話 ネームのコマ表', panelTable(build.records, EP01_NAME, stage?.data)),
    ],
  };
}
