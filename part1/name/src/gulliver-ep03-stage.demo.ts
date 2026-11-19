// ネーム 第3話の舞台（never committed to editor-platform; kept in gulliver-manga part1/name/src/).
// Stages every panel of episode 3 on the digital twin: the people (F107/F108 body plan) are rigged
// figures in one character document per set, the places are props (F106 the temple as a BIM version; the
// ground, the strait, the coasts, the port and the fleet of Blefuscu as CAD versions). Each panel is one
// moment of the set's action: the figures' places and poses and the action's camera are keyed at
// that tick. The spec looks through each panel's camera, saves the view, and writes stage.json
// (the model versions, every figure's place/facing/pose and every camera) for the ネーム build.
import { applyCadOperation, emptyCad, identityQuaternion, mm, position, type CadDocument } from '@editor-platform/cad-core';
import { createArtifact } from '@editor-platform/artifact-core';
import { boxMesh, encodeEpm, epmSha256, type EpmMesh } from '@editor-platform/geometry-mesh';
import {
  axisAngleQuat,
  characterAssetMediaTypes,
  emptyCharacter,
  identityTransform,
  multiplyQuat,
  type CharacterDocument,
  type CharacterTrack,
  type Quat,
} from '@editor-platform/character-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { f106Temple } from '../../scripts/fixtures/gulliver-lilliput';
import { addFigure, gulliverLook, lilliputLooks, type FigureLook, type PlacedFigure } from '../../scripts/fixtures/gulliver-people';
import { POSES, posePoint, poseRotations, type Pose } from './gulliver-stage-poses';
import { create, expect, nativeArtifact, save, test } from '../e2e/fixtures';

type V3 = [number, number, number];
const OUT = process.env.STAGE_OUT ?? '/tmp/claude-0/stage';
const ONLY = process.env.STAGE_SETS?.split(',');
const TPS = 240_000;
const STEP = TPS / 2; // one panel every half second of the set's action
const H = 1750; // Gulliver
const h = 146; // a Lilliputian
const inch = 25.4,
  foot = 304.8;
const hold = { type: 'hold' } as const;
const deg = Math.PI / 180;

// ---------------------------------------------------------------- the people and the panels
type Who = 'CH-01' | 'CH-02' | 'CH-05' | 'CH-06' | 'CH-30' | 'EX';
/** A figure in a panel: `at` is the ground point under its hip (the hip is at `at` + the pose's hip height; not the feet). */
type Place = { fig: string; at: V3; facing: number; pose: Pose; note?: string };
/** A movable model (the fleet, the cables): its own CAD version, placed per shot (hidden when a shot leaves it out and it has no home). */
type Vessel = { id: string; name: string; boxes: CadBox[]; home?: V3 };
type VesselAt = { at: V3; rot?: Quat };
type Shot = { panel: string; cam: V3; look: V3; stand?: string; places: Place[]; crowds?: string[]; noModel?: string; vessels?: Record<string, VesselAt> };
type Actor = { id: string; who: Who; name: string; height: number; look?: FigureLook; horse?: boolean };
type Crowd = { id: string; name: string; people: { at: V3; facing: number; height: number; look: FigureLook }[]; horses?: { at: V3; facing: number; withers: number }[] };
type SetDef = {
  id: string;
  name: string;
  scenes: string[];
  model: { cad: CadBox[]; bim?: 'temple'; reason?: string; vessels?: Vessel[] };
  /** Where figures and vessels left out of a shot wait (under the ground, inside the set's bounds). */
  hidden?: V3;
  actors: Actor[];
  crowds: Crowd[];
  shots: Shot[];
};
type CadBox = { id: string; name: string; color: string; at: V3; size: V3; cylinder?: { r: number; h: number; up?: boolean }; opacity?: number };

const G: Actor = { id: 'gulliver', who: 'CH-01', name: 'ガリヴァー', height: H, look: gulliverLook };
// SC-010 from the beach on: the coat, shoes and stockings off, a leather jerkin (本文).
const G_JERKIN: Actor = { id: 'gj', who: 'CH-01', name: 'ガリヴァー（革の胴着）', height: H, look: { ...gulliverLook, coat: '#6b4a2e', stockings: '#d8b08a', shoes: '#d8b08a' } };
const lil = (id: string, name: string, i: number, who: Who = 'CH-30'): Actor => ({ id, who, name, height: h, look: lilliputLooks[i % lilliputLooks.length] });
const EMPEROR: Actor = { id: 'emperor', who: 'CH-02', name: '皇帝', height: 158, look: { coat: '#2f5a3a', breeches: '#2f5a3a', stockings: '#efe7d6', shoes: '#2b2622', skin: '#e9c4a0', hair: '#2a2018' } };
const BOLGOLAM: Actor = { id: 'bolgolam', who: 'CH-06', name: 'ボルゴラム', height: 148, look: { coat: '#4a3b2a', breeches: '#3a3028', stockings: '#9a9078', shoes: '#2b2622', skin: '#d8b08a', hair: '#1f1a14' } };
const RELDRESAL: Actor = { id: 'reldresal', who: 'CH-05', name: 'レルドレサル', height: 150, look: { coat: '#5a4a6a', breeches: '#4a3d58', stockings: '#d8d0bd', shoes: '#2b2622', skin: '#e2c09c', hair: '#3a3024' } };
const PRINCE: Actor = { id: 'prince', who: 'CH-30', name: '皇太子', height: 150, look: { coat: '#8c6a2f', breeches: '#5c4a2a', stockings: '#efe7d6', shoes: '#2b2622', skin: '#ecc8a4', hair: '#4a3420' } };

/** A crowd standing on a grid inside a rectangle, facing `facing`. */
function grid(x0: number, y0: number, x1: number, y1: number, step: number, z: number, facing: number, seed = 1, height = h) {
  const out: Crowd['people'] = [];
  let r = seed;
  const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  for (let x = x0; x <= x1; x += step)
    for (let y = y0; y <= y1; y += step)
      out.push({ at: [x + (rnd() - 0.5) * step * 0.6, y + (rnd() - 0.5) * step * 0.6, z], facing: facing + (rnd() - 0.5) * 0.8, height: height * (0.94 + rnd() * 0.1), look: lilliputLooks[Math.floor(rnd() * 4)]! });
  return out;
}

// SC-009 at Gulliver's house (F106, its north wall on y = 0, the gate in its middle): he lies face down north of the
// gate, propped up, the right palm on the ground in front of his face (創作の配置). `at` is the hip.
const LIE: Place = { fig: 'gulliver', at: [0, 900, 0], facing: 0, pose: 'prone-palm' };
const PALM = posePoint('prone-palm', LIE.at, 0, H, 'palm.R'); // ≈ [245, 1877, 38]
const EYE = posePoint('prone-palm', LIE.at, 0, H, 'eye'); // ≈ [0, 1605, 357]
const HEAD = posePoint('prone-palm', LIE.at, 0, H, 'head');
const ON_PALM: V3 = [PALM[0], PALM[1], PALM[2] + 25];
const rel = (pose: Pose = 'orate', facing = Math.PI): Place => ({ fig: 'reldresal', at: ON_PALM, facing, pose });

// SC-009 the flashback (Reldresal's tale): three small 創作 sets side by side, all in Lilliput's scale (a man 146 mm,
// a table 60 mm). The breakfast room at x = 0, the square with the law at x = 3000, the rebellion by the sea at x = −3000.
const PAST_HIDDEN: V3 = [0, 0, -3000];
const TABLE_Z = 60; // the top of the breakfast table (a man's table is 0.43 of his height)
const EGG: CadBox[] = [
  // An egg in Lilliput's scale is about 5 mm long (a hen's egg ÷ 12). Two broken eggs: the big end cut (left), the small end cut (right).
  { id: 'egg-big-1', name: '卵（大きい端を割った）下', color: '#efe6d2', at: [-14, 300, TABLE_Z + 6], size: [4, 4, 2.2], cylinder: { r: 1.9, h: 2.2, up: true } },
  { id: 'egg-big-2', name: '卵（大きい端を割った）上', color: '#efe6d2', at: [-14, 300, TABLE_Z + 8.2], size: [5, 5, 1.6], cylinder: { r: 2.4, h: 1.6, up: true } },
  { id: 'egg-small-1', name: '卵（小さい端を割った）下', color: '#efe6d2', at: [14, 300, TABLE_Z + 6], size: [5, 5, 2.4], cylinder: { r: 2.4, h: 2.4, up: true } },
  { id: 'egg-small-2', name: '卵（小さい端を割った）上', color: '#efe6d2', at: [14, 300, TABLE_Z + 8.4], size: [4, 4, 1.2], cylinder: { r: 1.8, h: 1.2, up: true } },
  { id: 'egg-yolk', name: '卵の黄身', color: '#e8b830', at: [-14, 300, TABLE_Z + 9.7], size: [3, 3, 0.3], cylinder: { r: 1.6, h: 0.3, up: true } },
  { id: 'egg-cap', name: '割れた殻', color: '#efe6d2', at: [-6, 296, TABLE_Z + 6], size: [3, 3, 1], cylinder: { r: 1.5, h: 1, up: true } },
];
const TABLE: CadBox[] = [
  { id: 'table-top', name: '朝食の卓（天板）', color: '#7a5634', at: [-110, 240, TABLE_Z], size: [220, 120, 6] },
  { id: 'table-leg', name: '朝食の卓（脚）', color: '#5a3e24', at: [-20, 280, 0], size: [40, 40, TABLE_Z] },
  { id: 'cloth', name: '卓の白い布', color: '#ece8dc', at: [-60, 270, TABLE_Z + 6], size: [120, 60, 0.4] },
];

// SC-010/SC-011: the strait between Lilliput (south, y < 0) and Blefuscu (north). 本文: 800 yards across, 70 glumgluffs
// (about 6 ft) deep in the middle at high water; he swam about 30 yards in the middle. The steps of the bed are 創作.
const yd = 3 * foot;
const STRAIT = Math.round(800 * yd); // 731,520 mm
const BED: [number, number, number][] = [
  [0, 20_000, 300], [20_000, 100_000, 800], [100_000, 330_000, 1300], [330_000, 360_000, Math.round(6 * foot)],
  [360_000, 630_000, 1300], [630_000, 711_000, 800], [711_000, STRAIT, 300],
];
const depth = (y: number) => BED.find(([a, b]) => y >= a && y < b)?.[2] ?? 0;
const inSea = (y: number): number => -depth(y);
const HILL_TOP = 4000; // 創作: a hill on the north-east coast
const ON_HILL: V3 = [0, -21500, HILL_TOP];
// The fleet: about fifty men of war (本文), 5 ranks × 10, each 6 ft (創作 as in GV3b). Local frame: bows to −y, the
// leading bows on y = 0, the ranks across x; the waterline at z = 0.
const SHIP = { length: Math.round(6 * foot), beam: Math.round(18 * inch), depth: Math.round(14 * inch), draught: Math.round(8 * inch) };
const RANK = Math.round(4 * foot);
const ALONG = SHIP.length + Math.round(3 * foot);
/** One CAD version holds at most 256 features: the fleet is two versions (ranks 1–3 and 4–5) placed together. */
function fleetBoxes(ranks: number[]): CadBox[] {
  const out: CadBox[] = [];
  for (const r of ranks)
    for (let i = 0; i < 10; i++) {
      const cx = (r - 2) * RANK,
        y0 = i * ALONG,
        k = `${r}-${i}`;
      out.push({ id: `hull-${k}`, name: `軍艦 ${r + 1}-${i + 1} 船体`, color: '#5a4030', at: [cx - SHIP.beam / 2, y0, -SHIP.draught], size: [SHIP.beam, SHIP.length, SHIP.depth] });
      // A feature and its body's placement both count toward a version's 256 features: one mast and two sails per ship.
      out.push({ id: `mast-${k}`, name: `軍艦 ${r + 1}-${i + 1} 帆柱`, color: '#3a2a1a', at: [cx - 6, y0 + 0.5 * SHIP.length - 6, SHIP.depth - SHIP.draught], size: [12, 12, 1520] });
      [0.28, 0.6].forEach((f, m) => {
        out.push({ id: `sail-${k}-${m}`, name: `軍艦 ${r + 1}-${i + 1} 帆 ${m + 1}`, color: '#e8e0cc', at: [cx - 300, y0 + f * SHIP.length, SHIP.depth - SHIP.draught + 450], size: [600, 6, 700 - m * 120] });
      });
    }
  return out;
}
// The fifty cables gathered in his hand (本文: he tied all the cords together at the end): a bundle 3 m long toward the bows.
const CORDS = 3000;
const ANCHORED: V3 = [0, 699_300, 0];
const fleetAt = (y: number, x = 0): VesselAt => ({ at: [x, y, 0] });
/** Towing: the fleet's leading bows `CORDS` north of his right palm, the cords from the palm (facing south, π). */
function towing(y: number, pose: Pose = 'tow'): { place: Place; vessels: Record<string, VesselAt> } {
  const place: Place = { fig: 'gj', at: [0, y, inSea(y)], facing: Math.PI, pose };
  const palm = posePoint(pose, place.at, Math.PI, H, 'palm.R');
  return { place, vessels: { fleet: fleetAt(palm[1] + CORDS, palm[0]), cords: { at: [palm[0], palm[1], palm[2]] } } };
}
// The crews on the anchored fleet's decks (two per ship) and the men who leapt into the sea.
const crew: Crowd['people'] = [];
for (let r = 0; r < 5; r++)
  for (let i = 0; i < 10; i++)
    for (const dy of [500, 1300]) crew.push({ at: [ANCHORED[0] + (r - 2) * RANK + (dy === 500 ? -80 : 90), ANCHORED[1] + i * ALONG + dy, SHIP.depth - SHIP.draught], facing: Math.PI, height: h, look: lilliputLooks[(r + i) % 4]! });
// The royal port (創作の配置、Lilliput の北の岸): a quay 300 mm above the water, the emperor's dais on it.
const QUAY_Z = 300;
const DAIS_Z = QUAY_Z + 150;
const PORT_X = 40_000;
const KNEEL: Place = { fig: 'gj', at: [PORT_X + 6000, -2000, 0], facing: Math.PI / 2, pose: 'kneel' };
const EMP_DAIS: Place = { fig: 'emperor', at: [PORT_X + 4000, -2500, DAIS_Z], facing: -Math.PI / 2, pose: 'orate' };
const MOORED = fleetAt(2000, PORT_X - 2000);
// Bolgolam stands at the east edge of the quay crowd, apart (he does not clap).
const BOLG: Place = { fig: 'bolgolam', at: [PORT_X + 2900, -3900, QUAY_Z], facing: -0.6, pose: 'arms-crossed' };

const SETS: SetDef[] = [
  {
    id: 'house',
    name: 'ガリヴァーの家（古い神殿 F106）の前：レルドレサルの話',
    scenes: ['SC-009'],
    model: {
      bim: 'temple',
      cad: [
        { id: 'grass', name: '草地', color: '#6f8f4a', at: [-250000, -250000, -14], size: [500000, 500000, 12] },
      ],
    },
    actors: [G, RELDRESAL, PRINCE, lil('sv', 'レルドレサルの従者', 1), lil('hi1', 'かかとの高い廷臣1', 0), lil('hi2', 'かかとの高い廷臣2', 2), lil('lo1', 'かかとの低い廷臣1', 1), lil('lo2', 'かかとの低い廷臣2', 3)],
    crowds: [
      { id: 'court', name: '皇太子の後ろの廷臣（創作の人数）', people: grid(2200, 2900, 2900, 3200, 140, 0, Math.PI, 51) },
    ],
    shots: [
      { panel: 'e03-p01-k1', cam: [1700, 3700, 136], look: [120, 1500, 330], places: [LIE, rel()] },
      { panel: 'e03-p01-k2', cam: [1350, 2650, 136], look: [350, 2050, 260], places: [LIE, { fig: 'reldresal', at: [480, 2150, 0], facing: Math.PI + 0.4, pose: 'walk' }, { fig: 'sv', at: [640, 2300, 0], facing: Math.PI + 0.4, pose: 'walk' }] },
      { panel: 'e03-p02-k1', cam: [650, 2500, 160], look: [120, 1700, 300], places: [LIE, rel(), { fig: 'sv', at: [560, 2050, 0], facing: Math.PI, pose: 'stand' }] },
      { panel: 'e03-p02-k2', cam: [-85, 1498, 441], look: [ON_PALM[0], ON_PALM[1], 175], // RV-e03-01：引いて頭の上に余白（前は cam EYE、look z +80）
        places: [LIE, rel('point', Math.PI + 0.3)] },
      { panel: 'e03-p02-k3', cam: [3200, 2650, 70], look: [3200, 3000, 85], places: [
        { fig: 'hi1', at: [3020, 3000, 0], facing: -Math.PI / 2, pose: 'glare' }, { fig: 'hi2', at: [2960, 3080, 0], facing: -Math.PI / 2, pose: 'arms-crossed' },
        { fig: 'lo1', at: [3380, 3000, 0], facing: Math.PI / 2, pose: 'glare' }, { fig: 'lo2', at: [3440, 2930, 0], facing: Math.PI / 2, pose: 'arms-crossed' }] },
      { panel: 'e03-p03-k1', cam: [380, 2200, 150], look: [ON_PALM[0], ON_PALM[1], 140], places: [LIE, rel()] },
      { panel: 'e03-p03-k2', cam: [2700, 2650, 75], look: [2500, 2900, 80], places: [{ fig: 'prince', at: [2500, 2850, 0], facing: Math.PI / 2 + 0.3, pose: 'limp' }], crowds: ['court'] },
      { panel: 'e03-p03-k3', cam: [ON_PALM[0] + 20, ON_PALM[1] + 60, ON_PALM[2] + 136], look: [EYE[0], EYE[1], EYE[2] + 20], places: [LIE] },
      { panel: 'e03-p04-k1', cam: [950, 2350, 136], look: [130, 1700, 260], places: [LIE, rel('orate', Math.PI + 0.5)] },
      { panel: 'e03-p04-k2', cam: [440, 2200, 170], look: [ON_PALM[0] + 50, ON_PALM[1], 170], places: [LIE, rel('point')] },
      { panel: 'e03-p04-k3', cam: [260, 2100, 320], look: [HEAD[0], HEAD[1], HEAD[2]], places: [LIE, rel()] },
      { panel: 'e03-p06-k1', cam: [760, 2350, 200], look: [140, 1800, 225], // RV-e03-02：引いて、レルドレサルの全身と見下ろすガリヴァーの顔の全体を入れる（前は cam [470, 2080, 136]、look z 150）
        places: [LIE, rel('stand')] },
      { panel: 'e03-p06-k2', cam: [-260, 2080, 330], look: [HEAD[0], HEAD[1], HEAD[2]], places: [LIE, rel('stand')] },
      { panel: 'e03-p06-k3', cam: [640, 1900, 130], look: [ON_PALM[0], ON_PALM[1], 150], places: [LIE, rel('bow', Math.PI - 0.6)] },
      { panel: 'e03-p06-k4', cam: [-2300, 3900, 650], look: [0, 1200, 300], places: [LIE, rel('stand')] },
    ],
  },
  {
    id: 'past',
    name: '回想：昔の宮廷の朝食の間、法を読み上げる広場、海辺の反乱（創作）',
    scenes: ['SC-009'],
    hidden: PAST_HIDDEN,
    model: {
      reason: '再現（GV1〜GV7）に昔の場面の 3D は無い。本文（卵を割って指を切った皇子、小さい端から割る法、6度の反乱とブレフスキュへ逃げた者）から、創作の小さな舞台を置いた仮の3D。',
      cad: [
        { id: 'floor', name: '朝食の間の床', color: '#8a6a48', at: [-400, -200, -10], size: [800, 900, 10] },
        { id: 'wall', name: '朝食の間の奥の壁', color: '#d8cdb4', at: [-400, 620, 0], size: [800, 20, 260] },
        { id: 'wall-l', name: '朝食の間の左の壁', color: '#cfc3a8', at: [-420, -200, 0], size: [20, 840, 260] },
        { id: 'wall-r', name: '朝食の間の右の壁', color: '#cfc3a8', at: [400, -200, 0], size: [20, 840, 260] },
        { id: 'window', name: '奥の壁の窓', color: '#a9c4d8', at: [100, 615, 90], size: [80, 6, 110] },
        ...TABLE,
        ...EGG,
        { id: 'chair', name: '幼い皇子の椅子', color: '#6a4a2c', at: [-170, 170, 0], size: [50, 50, 32] },
        { id: 'square', name: '法を読み上げる広場', color: '#b9ae98', at: [2200, -900, -10], size: [1600, 1600, 10] },
        { id: 'palace', name: '王宮の正面', color: '#d2c3a0', at: [2200, 520, 0], size: [1600, 200, 520] },
        { id: 'palace-door', name: '王宮の扉', color: '#6a4a2c', at: [2930, 515, 0], size: [140, 6, 230] },
        { id: 'steps', name: '王宮の前の段', color: '#c4b48e', at: [2850, 380, 0], size: [300, 140, 60] },
        { id: 'board-post', name: '高札の柱', color: '#5a3e24', at: [3290, 140, 0], size: [8, 8, 210] },
        { id: 'board', name: '高札', color: '#e2d6b6', at: [3230, 136, 120], size: [130, 4, 80] },
        { id: 'rebel-ground', name: '反乱の広場', color: '#a89c84', at: [-3800, -1000, -10], size: [1600, 1400, 10] },
        { id: 'rebel-beach', name: '海辺の浜', color: '#cdbb8e', at: [-3800, 400, -8], size: [1600, 300, 8] },
        { id: 'rebel-sea', name: '海', color: '#4f7894', at: [-3800, 700, -12], size: [1600, 1300, 4] },
        { id: 'house-a', name: '燃える家', color: '#9a8a70', at: [-3700, -300, 0], size: [260, 220, 220] },
        { id: 'fire-a', name: '炎', color: '#e07a2a', at: [-3680, -280, 220], size: [200, 160, 120], opacity: 0.85 },
        { id: 'house-b', name: '燃える家（浜の近く）', color: '#9a8a70', at: [-2620, 60, 0], size: [220, 200, 200] },
        { id: 'fire-b', name: '炎', color: '#e0a02a', at: [-2600, 80, 200], size: [180, 160, 110], opacity: 0.85 },
        { id: 'boat-1', name: '逃げる小舟1', color: '#5a4030', at: [-3150, 900, -8], size: [70, 200, 22] },
        { id: 'boat-2', name: '逃げる小舟2', color: '#5a4030', at: [-2850, 1250, -8], size: [70, 200, 22] },
        { id: 'boat-3', name: '逃げる小舟3', color: '#5a4030', at: [-3350, 1500, -8], size: [70, 200, 22] },
        { id: 'boat-folk', name: '小舟の人々', color: '#3a3a4a', at: [-3140, 960, 14], size: [50, 80, 60] },
        { id: 'tower', name: '広場を見下ろす塔', color: '#8c8070', at: [-3080, -1000, 0], size: [160, 160, 364] },
      ],
    },
    actors: [
      { id: 'boy', who: 'EX', name: '幼い皇子（今の皇帝の祖父）', height: 95, look: { coat: '#b08a3a', breeches: '#6a5430', stockings: '#efe7d6', shoes: '#2b2622', skin: '#ecc8a4', hair: '#6a4a2c' } },
      lil('nurse', '給仕', 2, 'EX'),
      { id: 'oldemp', who: 'EX', name: '昔の皇帝（皇子の父）', height: 158, look: { coat: '#6a2f3a', breeches: '#4a2028', stockings: '#efe7d6', shoes: '#2b2622', skin: '#e2bc98', hair: '#c8c0b0' } },
      lil('herald', '布告役', 0, 'EX'),
      lil('r1', '剣を掲げる反乱の民1', 1, 'EX'), lil('r2', '剣を掲げる反乱の民2', 3, 'EX'), lil('r3', '反乱の民3', 0, 'EX'),
    ],
    crowds: [
      { id: 'folk', name: '法を見上げる民（創作の人数）', people: [...grid(2550, -560, 2860, -160, 130, 0, 0, 61), ...grid(3140, -560, 3450, -160, 130, 0, 0, 62)] },
      { id: 'rebels', name: '反乱の民（創作の人数）', people: grid(-3400, -500, -2700, 0, 120, 0, Math.PI / 2, 63) },
    ],
    shots: [
      { panel: 'e03-p04-k4', cam: [-200, 120, 120], look: [20, 300, 75], places: [
        { fig: 'boy', at: [-25, 215, 0], facing: 0, pose: 'read' }, { fig: 'nurse', at: [-200, 380, 0], facing: -0.6, pose: 'hands-together' }] },
      { panel: 'e03-p05-k1', cam: [3000, -820, 136], look: [3000, 400, 170], places: [
        { fig: 'oldemp', at: [3000, 450, 60], facing: Math.PI, pose: 'orate' }, { fig: 'herald', at: [3180, 330, 0], facing: Math.PI, pose: 'read' }], crowds: ['folk'] },
      { panel: 'e03-p05-k3', cam: [-3000, -920, 500], look: [-3050, 500, 40], stand: 'tower', places: [
        { fig: 'r1', at: [-3050, -150, 0], facing: Math.PI / 2, pose: 'sword-up' }, { fig: 'r2', at: [-2900, -250, 0], facing: Math.PI / 2, pose: 'sword-up' }, { fig: 'r3', at: [-3150, -300, 0], facing: Math.PI / 2, pose: 'point' }], crowds: ['rebels'] },
    ],
  },
  {
    id: 'eggs',
    name: '回想：卓の上の割られた二つの卵（創作）',
    scenes: ['SC-009'],
    model: {
      reason: '卵の寄り。朝食の卓（past と同じ寸法）と二つの卵だけの舞台（小さな物の寄りは、舞台が小さいほど手前で切れない）。',
      cad: [...TABLE, ...EGG],
    },
    // The character view is Ready only with a figure in it: the boy waits under the table, out of the shot.
    hidden: [0, 300, -200],
    actors: [{ id: 'boy', who: 'EX', name: '幼い皇子（今の皇帝の祖父）', height: 95, look: { coat: '#b08a3a', breeches: '#6a5430', stockings: '#efe7d6', shoes: '#2b2622', skin: '#ecc8a4', hair: '#6a4a2c' } }],
    crowds: [],
    shots: [{ panel: 'e03-p05-k2', cam: [0, 248, 70], look: [0, 300, 66], places: [] }],
  },
  {
    id: 'strait',
    name: '北東の岸と海峡（800ヤード）とブレフスキュの艦隊、王の港',
    scenes: ['SC-010', 'SC-011'],
    model: {
      reason: '再現（GV1〜GV7）の地図（SM-01）に海峡はあるが、海の深さと岸と港の 3D は無い。本文の幅と深さで海峡を、創作で岸・丘・港を置いた仮の3D。艦隊は GV3b の軍艦（6 フィート、創作）を箱にした。',
      cad: [
        { id: 'land-s', name: 'リリパットの草地', color: '#6f8f4a', at: [-300000, -300000, -12], size: [600000, 280000, 12] },
        { id: 'beach-s', name: 'リリパットの浜', color: '#cdbb8e', at: [-300000, -20000, -10], size: [600000, 20000, 10] },
        ...BED.map(([a, b, d], i): CadBox => ({ id: `bed-${i}`, name: `海峡の底（深さ ${d} mm）`, color: '#6f6450', at: [-300000, a, -d - 20], size: [600000, b - a, 20] })),
        { id: 'water', name: '海峡の海面', color: '#3d6f94', at: [-300000, 0, -12], size: [600000, STRAIT, 12], opacity: 0.55 },
        { id: 'beach-n', name: 'ブレフスキュの浜', color: '#cdbb8e', at: [-300000, STRAIT, -10], size: [600000, 20000, 10] },
        { id: 'land-n', name: 'ブレフスキュの草地', color: '#6f8f4a', at: [-300000, STRAIT + 20000, -12], size: [600000, 280000, 12] },
        { id: 'hill', name: '北東の岸の小山（創作：4,000 mm）', color: '#6f8a4e', at: [-6000, -26000, 0], size: [12000, 6000, HILL_TOP] },
        { id: 'cables', name: '太い綱と鉤の山（本文：50本と50個）', color: '#8a7350', at: [3300, -7700, 0], size: [500, 400, 120] },
        { id: 'clothes', name: '脱いだ上着と靴（創作の置き場所）', color: '#7a2f2f', at: [-450, -3200, 0], size: [400, 300, 60] },
        { id: 'quay', name: '王の港の岸壁（創作：高さ 300 mm）', color: '#9a8f7e', at: [PORT_X - 4000, -6000, 0], size: [9000, 6000, QUAY_Z] },
        { id: 'dais', name: '岸壁の上の皇帝の壇（創作：150 mm）', color: '#8c2f39', at: [PORT_X + 3700, -2800, QUAY_Z], size: [600, 600, 150] },
        { id: 'town-1', name: '港の家並み（創作）', color: '#c9b79a', at: [PORT_X - 4000, -9500, 0], size: [9000, 1500, 760] },
        { id: 'town-2', name: '港の家並み（創作）2', color: '#b8a98c', at: [PORT_X - 3000, -12000, 0], size: [7000, 1500, 900] },
        { id: 'blefuscu-town', name: 'ブレフスキュの港の家並み（創作）', color: '#b8a98c', at: [-6000, STRAIT + 3000, 0], size: [12000, 2000, 900] },
      ],
      vessels: [
        { id: 'fleet', name: 'ブレフスキュの艦隊 1〜3列（軍艦30隻、仮の3D）', boxes: fleetBoxes([0, 1, 2]) },
        { id: 'fleet2', name: 'ブレフスキュの艦隊 4〜5列（軍艦20隻、仮の3D）', boxes: fleetBoxes([3, 4]) },
        { id: 'cords', name: '一つにまとめた綱（仮の3D）', boxes: [{ id: 'cords', name: '綱の束', color: '#8a7350', at: [-40, 0, -30], size: [80, CORDS, 40] }] },
      ],
    },
    actors: [G, G_JERKIN, EMPEROR, BOLGOLAM, lil('s1', '水夫', 0), lil('b1', 'ブレフスキュの兵', 2)],
    crowds: [
      { id: 'seamen', name: '水夫たち（創作の人数）', people: grid(2300, -8400, 2650, -7600, 120, 0, -Math.PI / 2, 61) },
      { id: 'workers', name: '綱を運ぶ人々（創作の人数）', people: grid(3500, -8300, 4000, -7200, 130, 0, Math.PI / 2, 63) },
      { id: 'crew', name: '艦隊の乗組員（創作の人数）', people: crew },
      { id: 'jumpers', name: '海へ飛び込んだ兵（創作の人数）', people: grid(-2500, 698_900, 2500, 699_150, 400, -110, Math.PI, 65) },
      { id: 'blefuscans', name: 'ブレフスキュの浜の人々（創作の人数）', people: grid(-2500, STRAIT + 600, 2500, STRAIT + 1500, 160, 0, Math.PI, 67) },
      { id: 'court', name: '浜で待つ宮廷（創作の人数）', people: grid(-1800, -2600, 1800, -1300, 160, 0, 0, 69) },
      { id: 'port', name: '岸壁の群衆（創作の人数）', people: grid(PORT_X - 3500, -5500, PORT_X + 2500, -3300, 150, QUAY_Z, -0.4, 71) },
    ],
    shots: [], // filled below
  },
];

// SC-010: the hill, the beach, the crossing, the fleet, the tow; SC-011: the port.
{
  const tow1 = towing(301_000);
  const tow2 = towing(690_000, 'tow');
  const head3 = towing(160_000, 'stand-in-water');
  const rise = towing(12_000, 'cheer');
  const atFleet: Place = { fig: 'gj', at: [0, 698_000, inSea(698_000)], facing: 0, pose: 'wade' };
  const hook: Place = { fig: 'gj', at: [0, ANCHORED[1] - 900, inSea(ANCHORED[1])], facing: 0, pose: 'tie' };
  const gHead = (p: Place) => posePoint(p.pose, p.at, p.facing, H, 'head');
  /** A camera before the face: `d` the offset across and along from the head, `z` the camera's height (the ネーム's eye height). */
  const face = (p: Place, d: [number, number], z: number): Pick<Shot, 'cam' | 'look'> => { const q = gHead(p); return { cam: [q[0] + d[0], q[1] + d[1], z], look: q }; };
  const WATER_EYE = 830;
  const DECK_EYE = 286;
  SETS.find((x) => x.id === 'strait')!.shots = [
    { panel: 'e03-p07-k1', cam: [-2600, -25600, 5300], look: [400, -14000, 4600], stand: 'hill', places: [{ fig: 'gulliver', at: ON_HILL, facing: 0, pose: 'telescope' }] },
    { panel: 'e03-p07-k2', cam: [-20_000, -250_000, 140_000], look: [0, 150_000, 0], places: [{ fig: 'gulliver', at: ON_HILL, facing: 0, pose: 'telescope' }], vessels: { fleet: { at: ANCHORED } } },
    { panel: 'e03-p07-k3', cam: [700, -6100, 136], look: [2900, -8000, 1000], places: [{ fig: 'gulliver', at: [3000, -8000, 0], facing: Math.PI / 2, pose: 'crouch' }, { fig: 's1', at: [2600, -7900, 0], facing: -Math.PI / 2, pose: 'point' }], crowds: ['seamen'] },
    { panel: 'e03-p08-k1', cam: [0, 690_000, 1500], look: [0, 712_000, 300], places: [], crowds: ['crew'], vessels: { fleet: { at: ANCHORED } } },
    { panel: 'e03-p08-k2', cam: [5500, -5800, 136], look: [3250, -7900, 950], places: [{ fig: 'gulliver', at: [3000, -8000, 0], facing: -Math.PI / 2, pose: 'crouch' }], crowds: ['workers'] },
    { panel: 'e03-p09-k1', cam: [2300, -700, 136], look: [0, -3000, 950], places: [{ fig: 'gj', at: [0, -3000, 0], facing: 0, pose: 'stand' }] },
    { panel: 'e03-p09-k2', cam: [1200, 11_500, 150], look: [0, 8000, 400], places: [{ fig: 'gj', at: [0, 8000, inSea(8000)], facing: 0, pose: 'wade' }] },
    { panel: 'e03-p09-k3', cam: [-60_000, 300_000, 40_000], look: [0, 345_000, -800], places: [{ fig: 'gj', at: [0, 345_000, 50], facing: 0, pose: 'swim' }], vessels: { fleet: { at: ANCHORED } } },
    { panel: 'e03-p10-k1', cam: [700, ANCHORED[1] + 3200, DECK_EYE], look: [0, 698_000, 900], stand: 'deck', places: [atFleet], crowds: ['crew', 'jumpers'], vessels: { fleet: { at: ANCHORED } } },
    { panel: 'e03-p10-k2', ...face({ ...atFleet, pose: 'hands-face' }, [350, 1100], WATER_EYE), places: [{ ...atFleet, pose: 'hands-face' }], vessels: { fleet: { at: ANCHORED } } },
    { panel: 'e03-p10-k3', ...face(atFleet, [-250, 600], WATER_EYE), places: [atFleet], vessels: { fleet: { at: ANCHORED } } },
    { panel: 'e03-p10-k4', ...face({ ...atFleet, pose: 'telescope' }, [300, 700], WATER_EYE), places: [{ ...atFleet, pose: 'telescope' }], vessels: { fleet: { at: ANCHORED } } },
    { panel: 'e03-p11-k1', ...face(atFleet, [120, 1100], WATER_EYE), places: [atFleet], vessels: { fleet: { at: ANCHORED } } },
    { panel: 'e03-p11-k2', cam: [1500, ANCHORED[1] + 1000, DECK_EYE], look: [0, ANCHORED[1] - 200, 450], stand: 'deck', places: [hook], crowds: ['jumpers'], vessels: { fleet: { at: ANCHORED } } },
    { panel: 'e03-p11-k3', cam: [700, 690_000 + 400, 600], look: [0, 690_500, 150], places: [tow2.place], vessels: tow2.vessels },
    { panel: 'e03-p12-k1', cam: [-9000, 287_000, 3000], look: [0, 305_000, 0], places: [tow1.place], vessels: tow1.vessels },
    { panel: 'e03-p12-k2', cam: [-1500, STRAIT + 1900, 136], look: [0, 700_000, 400], places: [tow2.place], crowds: ['blefuscans'], vessels: tow2.vessels },
    { panel: 'e03-p13-k1', cam: [250, -1900, 136], look: [0, 160_000, 300], places: [head3.place, { fig: 'emperor', at: [0, -900, 0], facing: 0, pose: 'stand' }], crowds: ['court'], vessels: head3.vessels },
    { panel: 'e03-p13-k2', cam: [150, -1500, 136], look: [0, 12_000, 1300], places: [rise.place, { fig: 'emperor', at: [0, -900, 0], facing: 0, pose: 'stand' }], crowds: ['court'], vessels: rise.vessels },
    // SC-011 the royal port: the fleet moored along the quay.
    { panel: 'e03-p14-k1', cam: [PORT_X - 3800, -8200, 1500], look: [PORT_X + 4500, -1000, 400], places: [KNEEL, EMP_DAIS, BOLG], crowds: ['port'], vessels: { fleet: MOORED } },
    { panel: 'e03-p14-k2', cam: [PORT_X + 4700, -2350, QUAY_Z + 136], look: [EMP_DAIS.at[0], EMP_DAIS.at[1], DAIS_Z + 120], stand: 'quay', places: [KNEEL, EMP_DAIS], vessels: { fleet: MOORED } },
    { panel: 'e03-p15-k1', cam: [PORT_X + 4500, -1500, QUAY_Z + 136], look: [KNEEL.at[0], KNEEL.at[1], 1350], stand: 'quay', places: [KNEEL, EMP_DAIS], vessels: { fleet: MOORED } },
    { panel: 'e03-p15-k2', cam: [PORT_X + 3600, -5200, QUAY_Z + 136], look: [PORT_X + 2200, -3700, QUAY_Z + 120], stand: 'quay', places: [BOLG], crowds: ['port'] },
    { panel: 'e03-p15-k3', cam: [PORT_X + 3400, -3750, QUAY_Z + 136], look: [PORT_X + 2900, -3900, QUAY_Z + 125], stand: 'quay', places: [BOLG], crowds: ['port'] },
    { panel: 'e03-p16-k1', cam: [PORT_X + 4150, -3300, DAIS_Z + 136], look: [PORT_X, 200_000, 0], stand: 'dais', places: [{ ...EMP_DAIS, facing: 0, pose: 'stand' }, KNEEL], vessels: { fleet: MOORED } },
    { panel: 'e03-p16-k2', cam: [PORT_X + 4000, -1800, DAIS_Z + 136], look: [EMP_DAIS.at[0], EMP_DAIS.at[1], DAIS_Z + 125], stand: 'dais', places: [{ ...EMP_DAIS, facing: 0, pose: 'point' }, KNEEL], vessels: { fleet: MOORED } },
    { panel: 'e03-p16-k3', ...face(KNEEL, [-700, -500], 1300), places: [KNEEL], vessels: { fleet: MOORED } },
  ];
  // Both halves of the fleet stand where the shot puts the fleet.
  for (const shot of SETS.find((x) => x.id === 'strait')!.shots) if (shot.vessels?.fleet) shot.vessels.fleet2 = shot.vessels.fleet;
  // The character view's near plane is 1/1000 of the whole scene's size: with the whole strait (1.3 km) it is 1.3 m and
  // every close shot is cut away. The close shots stand in two cut-outs of the same model (the same coordinates):
  // the Lilliput coast with the port, and the water around the fleet with the Blefuscu shore. The whole strait keeps
  // only the far shots.
  const whole = SETS.find((x) => x.id === 'strait')!;
  const clip = (win: [number, number, number, number]) =>
    whole.model.cad.flatMap((b): CadBox[] => {
      const x0 = Math.max(b.at[0], win[0]), y0 = Math.max(b.at[1], win[1]);
      const x1 = Math.min(b.at[0] + b.size[0], win[2]), y1 = Math.min(b.at[1] + b.size[1], win[3]);
      return x1 > x0 && y1 > y0 ? [{ ...b, at: [x0, y0, b.at[2]], size: [x1 - x0, y1 - y0, b.size[2]] }] : [];
    });
  const cut = (id: string, name: string, scenes: string[], win: [number, number, number, number], panels: string[], hidden: V3): SetDef => {
    const shots = whole.shots.filter((x) => panels.includes(x.panel));
    const used = new Set(shots.flatMap((x) => x.crowds ?? []));
    return { ...whole, id, name, scenes, hidden, model: { ...whole.model, cad: clip(win) }, crowds: whole.crowds.filter((c) => used.has(c.id)), shots };
  };
  const FAR = ['e03-p07-k1', 'e03-p07-k2', 'e03-p09-k3', 'e03-p12-k1'];
  const FLEET = ['e03-p08-k1', 'e03-p10-k1', 'e03-p10-k2', 'e03-p10-k3', 'e03-p10-k4', 'e03-p11-k1', 'e03-p11-k2', 'e03-p11-k3', 'e03-p12-k2'];
  const coast = cut('coast', 'リリパットの北東の岸と王の港（海峡の南の端、200 m）', ['SC-010', 'SC-011'], [-60_000, -40_000, 60_000, 200_000], whole.shots.map((x) => x.panel).filter((x) => !FAR.includes(x) && !FLEET.includes(x)), [0, -30_000, -5000]);
  const fleet = cut('fleet', 'ブレフスキュの艦隊のまわりの海とブレフスキュの浜（海峡の北の端）', ['SC-010'], [-40_000, 660_000, 40_000, STRAIT + 20_000], FLEET, [0, 690_000, -5000]);
  whole.shots = whole.shots.filter((x) => FAR.includes(x.panel));
  whole.crowds = [];
  whole.scenes = ['SC-010'];
  SETS.push(coast, fleet);
}

// ---------------------------------------------------------------- building the documents
/**
 * The boxes as a CAD document. A version holds at most 64 active bodies: with `grouped`, the boxes of one colour are
 * united into one body (the fleet's hulls, masts and sails), each box still its own feature.
 */
function cadDoc(kernel: { id: string; buildHash: string }, boxes: CadBox[], grouped = false): CadDocument {
  const features = boxes.map((b) =>
    b.cylinder
      ? { id: b.id, name: b.name, type: 'cylinder' as const, inputFeatureIds: [], args: { radius: mm(b.cylinder.r), height: mm(b.cylinder.h), origin: position(...b.at), orientation: (b.cylinder.up ? identityQuaternion() : axisAngleQuat([1, 0, 0], Math.PI / 2)) as never } }
      : { id: b.id, name: b.name, type: 'box' as const, inputFeatureIds: [], args: { size: [mm(b.size[0]), mm(b.size[1]), mm(b.size[2])], origin: position(...b.at), orientation: identityQuaternion() } },
  ) as unknown[];
  let bodies = boxes.map((b) => ({ id: `${b.id}-body`, name: b.name, sourceFeatureId: b.id, placementFeatureId: `${b.id}-body-placement`, appearance: { color: b.color, opacity: b.opacity ?? 1, roughness: 0.95, metalness: 0 } }));
  if (grouped) {
    const groups = new Map<string, CadBox[]>();
    for (const b of boxes) groups.set(b.color, [...(groups.get(b.color) ?? []), b]);
    bodies = [...groups.values()].map((g, i) => {
      const id = `group-${i}`;
      features.push({ id, name: g[0]!.name.replace(/ .*$/, ''), type: 'boolean', inputFeatureIds: g.map((b) => b.id), args: { mode: 'union' } });
      return { id: `${id}-body`, name: `${g[0]!.name.split(' ')[0]}（${g.length}）`, sourceFeatureId: id, placementFeatureId: `${id}-body-placement`, appearance: { color: g[0]!.color, opacity: g[0]!.opacity ?? 1, roughness: 0.95, metalness: 0 } };
    });
  }
  return applyCadOperation(emptyCad(kernel), { type: 'insertFeatures', features, bodies } as never);
}

/** Static crowds: standing people (and horses) baked into one mesh, no skeleton. */
function addCrowd(doc: CharacterDocument, assets: Map<string, Uint8Array>, c: Crowd) {
  const colors: string[] = [];
  const slot = (color: string) => (colors.includes(color) ? colors.indexOf(color) : colors.push(color) - 1);
  const pos: number[] = [],
    sizes: number[] = [],
    idx: number[] = [],
    mats: number[] = [];
  const put = (at: V3, facing: number, size: V3, centre: V3, color: string) => {
    const b = boxMesh(size, [0, 0, 0]);
    const cs = Math.cos(facing),
      sn = Math.sin(facing);
    const base = pos.length / 3;
    for (let i = 0; i < 8; i++) {
      const x = b.positions[3 * i]! + centre[0],
        y = b.positions[3 * i + 1]! + centre[1],
        z = b.positions[3 * i + 2]! + centre[2];
      pos.push(at[0] + cs * x - sn * y, at[1] + sn * x + cs * y, at[2] + z);
    }
    sizes.push(...b.faceSizes);
    idx.push(...[...b.faceIndices].map((i) => i + base));
    const m = slot(color);
    mats.push(...[...b.faceMaterials].map(() => m));
  };
  for (const p of c.people) {
    const t = p.height;
    put(p.at, p.facing, [0.18 * t, 0.12 * t, 0.5 * t], [0, 0, 0.25 * t], p.look.breeches);
    put(p.at, p.facing, [0.24 * t, 0.14 * t, 0.3 * t], [0, 0, 0.67 * t], p.look.coat);
    put(p.at, p.facing, [0.09 * t, 0.1 * t, 0.12 * t], [0, 0, 0.9 * t], p.look.skin);
    put(p.at, p.facing, [0.095 * t, 0.105 * t, 0.03 * t], [0, 0, 0.975 * t], p.look.hair);
  }
  for (const hz of c.horses ?? []) {
    const w = hz.withers;
    put(hz.at, hz.facing, [0.35 * w, 1.1 * w, 0.4 * w], [0, 0, 0.8 * w], '#6b4a2e');
    put(hz.at, hz.facing, [0.3 * w, 0.9 * w, 0.6 * w], [0, 0, 0.3 * w], '#3d2a1a');
    put(hz.at, hz.facing, [0.18 * w, 0.4 * w, 0.5 * w], [0, 0.65 * w, 1.1 * w], '#6b4a2e');
  }
  const mesh: EpmMesh = {
    positions: new Float32Array(pos),
    faceSizes: new Uint32Array(sizes),
    faceIndices: new Uint32Array(idx),
    faceMaterials: new Uint16Array(mats),
    boneIds: [],
    morphs: [],
  };
  const bytes = encodeEpm(mesh);
  const id = `crowd-${c.id}`;
  doc.assets.push({ id: `${id}/mesh`, kind: 'mesh-epm', sha256: epmSha256(bytes), byteLength: bytes.length, mediaType: characterAssetMediaTypes['mesh-epm'] });
  assets.set(`${id}/mesh`, bytes);
  colors.forEach((color, i) => doc.materials.push({ id: `${id}/mat-${i}`, name: `${c.name} ${i}`, color, opacity: 1, roughness: 0.85, metalness: 0, maps: {}, doubleSided: false }));
  doc.parts.push({ id, name: c.name, parentId: null, transform: identityTransform(), mesh: `${id}/mesh`, materials: colors.map((_, i) => `${id}/mat-${i}`), visible: true });
  return id;
}

const HIDDEN_DEFAULT: V3 = [0, 0, -60_000];
const vesselName = (set: SetDef, v: Vessel) => `舞台 ${set.id} ${v.id}`;
function buildSet(set: SetDef, props: CharacterDocument['props']) {
  const HIDDEN = set.hidden ?? HIDDEN_DEFAULT;
  const doc = emptyCharacter(`第3話 舞台：${set.name}`);
  const assets = new Map<string, Uint8Array>();
  const figs = new Map<string, PlacedFigure>();
  for (const a of set.actors)
    figs.set(a.id, addFigure(doc, assets, { prefix: a.id, name: a.name, heightMm: a.height, at: [0, 0, 0], facingRad: 0, look: a.look! }));
  const crowdParts = new Map(set.crowds.map((c) => [c.id, addCrowd(doc, assets, c)]));
  doc.props = props;
  const tracks = new Map<string, CharacterTrack>();
  const key = (id: string, target: CharacterTrack['target'], tick: number, value: V3 | Quat) => {
    const t = tracks.get(id) ?? tracks.set(id, { id, target, keys: [] }).get(id)!;
    t.keys.push({ id: `${id}-${t.keys.length}`, tick, value, easing: hold });
  };
  set.shots.forEach((s, i) => {
    const tick = i * STEP;
    key('cam-pos', { kind: 'camera', property: 'position' }, tick, s.cam);
    key('cam-look', { kind: 'camera', property: 'target' }, tick, s.look);
    for (const a of set.actors) {
      const f = figs.get(a.id)!;
      const place = s.places.find((p) => p.fig === a.id);
      if (!place) {
        key(`${a.id}-hip-t`, { kind: 'bone', id: f.bone(a.horse ? 'pelvis' : 'hip'), property: 'translation' }, tick, HIDDEN);
        continue;
      }
      if (a.horse) {
        // A horse's root joint keeps its rest height; it is moved and turned only.
        const sk = doc.skeletons.find((x) => x.id === f.bone('rig'))!;
        const root = sk.bones.find((b) => b.parentId === null)!;
        const rest = root.rest.translation as V3;
        const c = Math.cos(place.facing), sn = Math.sin(place.facing);
        key(`${a.id}-hip-t`, { kind: 'bone', id: root.id, property: 'translation' }, tick, [place.at[0] + c * rest[0] - sn * rest[1], place.at[1] + sn * rest[0] + c * rest[1], place.at[2] + rest[2]]);
        key(`${a.id}-hip-r`, { kind: 'bone', id: root.id, property: 'rotation' }, tick, axisAngleQuat([0, 0, 1], place.facing));
        continue;
      }
      const p = POSES[place.pose];
      const rot = multiplyQuat(axisAngleQuat([0, 0, 1], place.facing), p.root ?? [0, 0, 0, 1]);
      key(`${a.id}-hip-t`, { kind: 'bone', id: f.bone('hip'), property: 'translation' }, tick, [place.at[0], place.at[1], place.at[2] + p.hip * a.height]);
      key(`${a.id}-hip-r`, { kind: 'bone', id: f.bone('hip'), property: 'rotation' }, tick, rot);
      const local = poseRotations(place.pose);
      for (const [b, q] of Object.entries(local)) key(`${a.id}-${b}`, { kind: 'bone', id: f.bone(b), property: 'rotation' }, tick, q);
    }
    for (const v of set.model.vessels ?? []) {
      const prop = props.find((x) => x.name === vesselName(set, v))!;
      const at = s.vessels?.[v.id] ?? (v.home ? { at: v.home } : { at: HIDDEN });
      key(`${v.id}-t`, { kind: 'prop', id: prop.id, property: 'translation' }, tick, at.at);
      key(`${v.id}-r`, { kind: 'prop', id: prop.id, property: 'rotation' }, tick, at.rot ?? [0, 0, 0, 1]);
    }
    for (const [cid, part] of crowdParts)
      key(`${part}-t`, { kind: 'part', id: part, property: 'translation' }, tick, (s.crowds ?? []).includes(cid) ? [0, 0, 0] : [0, 0, -5000]); // a crowd left out sinks under the ground where it stands
  });
  // Bones never keyed for a figure that is never placed keep their rest; fill every rotation track
  // at every tick so a hold never carries a pose into a shot that does not set it.
  doc.actions.push({ id: `stage-${set.id}`, name: `舞台 ${set.name}`, duration: Math.max(1, set.shots.length) * STEP, frameRate: { numerator: 2, denominator: 1 }, tracks: [...tracks.values()] });
  return { doc, assets };
}

async function importArtifact(page: Page, name: string, value: unknown) {
  const input = page.getByLabel('Import artifact', { exact: true });
  if (!(await input.isVisible())) await page.getByRole('button', { name: 'Toggle library', exact: true }).click();
  await input.setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
}
async function panel(page: Page, name: 'Parts' | 'Inspector') {
  const region = page.getByRole('complementary', { name, exact: true });
  if (!(await region.isVisible())) await page.getByRole('button', { name: `Toggle ${name}`, exact: true }).click();
  return region;
}

for (const set of SETS.filter((s) => !ONLY || ONLY.includes(s.id))) {
  test(`stage ${set.id}`, async ({ page }) => {
    test.setTimeout(2 * 3_600_000);
    mkdirSync(`${OUT}/${set.id}`, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 1300 });
    await page.goto('/');
    const propNames: string[] = [];
    const versions: Record<string, unknown> = {};
    if (set.model.bim) {
      const [label, content] = ['F106 古い神殿', f106Temple()];
      await importArtifact(page, `${set.model.bim}.json`, createArtifact('bim', label, content));
      await expect(page.getByTestId('bim-model-state')).toHaveText('Model up to date', { timeout: 1_800_000 });
      await save(page, 1);
      propNames.push(label);
      versions[set.model.bim] = await nativeArtifact(page);
    }
    await create(page, 'cad');
    const empty = await nativeArtifact(page);
    const kernel = (empty.draft.content as CadDocument).kernelProfile;
    const cadName = `舞台 ${set.id}`;
    await importArtifact(page, `${set.id}-cad.json`, { ...empty, name: cadName, draft: { ...empty.draft, content: cadDoc(kernel, set.model.cad) } });
    await expect(page.getByLabel('Artifact name')).toHaveValue(cadName);
    await expect(page.getByTestId('cad-geometry-state')).toHaveText('Shape up to date', { timeout: 600_000 });
    await save(page, 1);
    versions.cad = await nativeArtifact(page);
    propNames.push(cadName);
    for (const v of set.model.vessels ?? []) {
      await create(page, 'cad');
      const e = await nativeArtifact(page);
      const name = vesselName(set, v);
      await importArtifact(page, `${set.id}-${v.id}.json`, { ...e, name, draft: { ...e.draft, content: cadDoc(kernel, v.boxes, v.boxes.length > 60) } });
      await expect(page.getByLabel('Artifact name')).toHaveValue(name);
      await expect(page.getByTestId('cad-geometry-state')).toHaveText('Shape up to date', { timeout: 600_000 });
      await save(page, 1);
      versions[v.id] = await nativeArtifact(page);
      propNames.push(name);
    }

    await create(page, 'character');
    await expect(page.getByTestId('character-view-state')).toHaveText('Ready');
    const parts = await panel(page, 'Parts');
    for (const name of propNames) {
      await parts.getByLabel('Prop version').selectOption({ label: `${name} — v1 (Manual save)` });
      await parts.getByRole('button', { name: 'Add prop', exact: true }).click();
      await expect(parts.getByRole('button', { name, exact: true })).toBeVisible({ timeout: 1_200_000 });
    }
    const placed = await nativeArtifact(page);
    const props = structuredClone((placed.draft.content as CharacterDocument).props);
    // Every place stands in its own model coordinates: no prop is moved.
    for (const p of props) p.placement = { translation: [0, 0, 0], rotation: [0, 0, 0, 1] };
    const { doc, assets } = buildSet(set, props);
    const resources = doc.assets.map((ref) => ({ kind: ref.kind, sha256: ref.sha256, byteLength: ref.byteLength, mediaType: ref.mediaType, encoding: 'base64', bytes: Buffer.from(assets.get(ref.id)!).toString('base64') }));
    const characterJson = { ...placed, name: doc.name, draft: { ...placed.draft, content: doc }, cadResources: resources };
    writeFileSync(`${OUT}/${set.id}/character.json`, JSON.stringify(characterJson));
    for (const [k, v] of Object.entries(versions)) writeFileSync(`${OUT}/${set.id}/${k}.json`, JSON.stringify(v));
    await importArtifact(page, 'stage.json', characterJson);
    await expect(page.getByLabel('Artifact name')).toHaveValue(doc.name);
    await expect(page.getByTestId('character-view-state')).toHaveText('Ready', { timeout: 1_800_000 });
    await page.getByRole('combobox', { name: 'Action', exact: true }).selectOption({ label: doc.actions[0]!.name });
    const inspector = await panel(page, 'Inspector');
    // A large BIM prop (F105, the whole city) is still calculating when the view is Ready: wait until every prop is shown.
    await expect(inspector.getByText('Wait for the props to be shown.')).toHaveCount(0, { timeout: 3_600_000 });
    await inspector.getByRole('group', { name: 'Action camera' }).getByLabel('Look through the action’s camera').check();
    await page.addStyleTag({ content: '.character-bone-overlay, .character-ik-overlay, .character-canvas button { display: none !important; } [data-tooltip]::before, [data-tooltip]::after { display: none !important; }' });
    // Close the side panels so the view is as large as it gets.
    for (const name of ['Parts', 'Inspector'] as const) {
      const region = page.getByRole('complementary', { name, exact: true });
      if (await region.isVisible()) await page.getByRole('button', { name: `Toggle ${name}`, exact: true }).click();
    }
    await page.mouse.move(2, 600);
    const time = page.getByRole('group', { name: 'Playback', exact: true }).getByLabel('Time');
    const canvas = page.locator('.character-canvas');
    const box = await canvas.boundingBox();
    for (const [i, s] of set.shots.entries()) {
      if (s.noModel) continue;
      await time.fill(String(i * STEP));
      await time.press('Enter');
      await page.waitForTimeout(3500);
      await canvas.screenshot({ path: `${OUT}/${set.id}/${s.panel}.png` });
    }
    writeFileSync(`${OUT}/${set.id}/stage.json`, JSON.stringify({
      set: { id: set.id, name: set.name, scenes: set.scenes, reason: set.model.reason ?? null, cad: set.model.cad.map((b) => ({ id: b.id, name: b.name, at: b.at, size: b.size, cylinder: b.cylinder ?? null })), bim: set.model.bim ?? null, vessels: (set.model.vessels ?? []).map((v) => ({ id: v.id, name: v.name, home: v.home ?? null, boxes: v.boxes.map((b) => ({ id: b.id, name: b.name, at: b.at, size: b.size, cylinder: b.cylinder ?? null })) })) },
      props: props.map((p) => ({ name: p.name, source: p.source })),
      canvas: { width: box!.width, height: box!.height, verticalFovDeg: 35 },
      actors: set.actors.map((a) => ({ id: a.id, who: a.who, name: a.name, heightMm: a.height })),
      crowds: set.crowds.map((c) => ({ id: c.id, name: c.name, count: c.people.length + (c.horses?.length ?? 0), points: [...c.people.map((p) => p.at), ...(c.horses ?? []).map((x) => x.at)] })),
      shots: set.shots,
      // LN-e02-01: where the protagonist's head and palms are in each shot (posePoint), to check against what they should be near.
      points: set.shots.map((s) => ({ panel: s.panel, figures: s.places.filter((p) => set.actors.find((a) => a.id === p.fig)?.height === H).map((p) => ({ fig: p.fig, head: posePoint(p.pose, p.at, p.facing, H, 'head'), eye: posePoint(p.pose, p.at, p.facing, H, 'eye'), palmR: posePoint(p.pose, p.at, p.facing, H, 'palm.R'), palmL: posePoint(p.pose, p.at, p.facing, H, 'palm.L') })) })),
    }));
  });
}
