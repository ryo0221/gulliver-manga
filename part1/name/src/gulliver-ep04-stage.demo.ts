// ネーム 第4話の舞台（never committed to editor-platform; kept in gulliver-manga part1/name/src/).
// Stages every panel of episode 4 on the digital twin: the people (F107/F108 body plan) are rigged
// figures in one character document per set, the places are props (F106 the temple and F105 Mildendo with the
// palace as BIM versions; the throne room, the fire, the steam and the burnt roof as CAD versions). Each panel is one
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
import { f105Mildendo, f106Temple } from '../../scripts/fixtures/gulliver-lilliput';
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
type Who = 'CH-01' | 'CH-02' | 'CH-03' | 'CH-04' | 'CH-06' | 'CH-30' | 'CH-31' | 'EX';
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
  model: { cad: CadBox[]; bim?: 'temple' | 'mildendo'; reason?: string; vessels?: Vessel[] };
  /** Where figures and vessels left out of a shot wait (under the ground, inside the set's bounds). */
  hidden?: V3;
  actors: Actor[];
  crowds: Crowd[];
  shots: Shot[];
};
type CadBox = { id: string; name: string; color: string; at: V3; size: V3; cylinder?: { r: number; h: number; up?: boolean }; opacity?: number };

// ---------------------------------------------------------------- the people
const G: Actor = { id: 'gulliver', who: 'CH-01', name: 'ガリヴァー', height: H, look: gulliverLook };
// SC-014: 本文 "I had left my coat behind": the waistcoat only (the same look as episode 2's city).
const G_WAISTCOAT: Actor = { id: 'gw', who: 'CH-01', name: 'ガリヴァー（上着なし、チョッキ）', height: H, look: { ...gulliverLook, coat: '#b49a6a' } };
const lil = (id: string, name: string, i: number, who: Who = 'CH-30'): Actor => ({ id, who, name, height: h, look: lilliputLooks[i % lilliputLooks.length] });
const EMPEROR: Actor = { id: 'emperor', who: 'CH-02', name: '皇帝', height: 158, look: { coat: '#2f5a3a', breeches: '#2f5a3a', stockings: '#efe7d6', shoes: '#2b2622', skin: '#e9c4a0', hair: '#2a2018' } };
const EMPRESS: Actor = { id: 'empress', who: 'CH-03', name: '皇后', height: 140, look: { coat: '#6d8fb3', breeches: '#6d8fb3', stockings: '#6d8fb3', shoes: '#e8e2d2', skin: '#efd0b0', hair: '#3a2a1a' } };
const FLIMNAP: Actor = { id: 'flimnap', who: 'CH-04', name: 'フリムナップ', height: 156, look: { coat: '#2f3a4a', breeches: '#2f3a4a', stockings: '#d8d0bd', shoes: '#2b2622', skin: '#e0bc98', hair: '#d9d4c8' } };
const BOLGOLAM: Actor = { id: 'bolgolam', who: 'CH-06', name: 'ボルゴラム', height: 148, look: { coat: '#4a3b2a', breeches: '#3a3028', stockings: '#9a9078', shoes: '#2b2622', skin: '#d8b08a', hair: '#1f1a14' } };
// The envoys of Blefuscu (本文: six ambassadors, a train of about five hundred): CH-31 speaks for them.
const ENVOY_LOOK: FigureLook = { coat: '#7a2f2f', breeches: '#5a2424', stockings: '#e8e0cc', shoes: '#2b2622', skin: '#e6c29e', hair: '#d8d2c4' };
const ENVOY: Actor = { id: 'envoy', who: 'CH-31', name: 'ブレフスキュの使節（代表）', height: 150, look: ENVOY_LOOK };
const envoy = (i: number): Actor => ({ id: `ev${i}`, who: 'EX', name: `ブレフスキュの使節 ${i + 1}`, height: 146, look: { ...ENVOY_LOOK, coat: ['#6a2a2a', '#7a3a2a', '#5a2a3a', '#7a2f3f', '#6a3a2a'][i % 5]! } });
// The empress's maids (人物表に無い端役): grown women, a little shorter than the empress.
const maid = (i: number): Actor => ({ id: `maid${i}`, who: 'EX', name: `侍女 ${i + 1}`, height: 136, look: { coat: '#9a9aa8', breeches: '#9a9aa8', stockings: '#9a9aa8', shoes: '#e8e2d2', skin: '#efd0b0', hair: '#4a3420' } });

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

// ---------------------------------------------------------------- SC-012/SC-013 the throne room (創作)
// 本文 has no room in the palace Gulliver could enter. The council meets in the throne room (episode 2's council room,
// the same size), its east side a wide window over a low terrace; the emperor stands at the window and Gulliver kneels
// in the court outside. Facing 0 is +y; π/2 faces −x (toward the room).
const SILL = 60;
const KNEEL: Place = { fig: 'gulliver', at: [1450, 0, 0], facing: Math.PI / 2, pose: 'kneel' };
const KNEEL_HEAD = posePoint('kneel', KNEEL.at, KNEEL.facing, H, 'head'); // ≈ [1493, 0, 1253]
const EMP_WIN: Place = { fig: 'emperor', at: [730, 0, SILL], facing: -Math.PI / 2, pose: 'orate' };
const MINISTERS: Place[] = [
  { fig: 'm1', at: [-200, -160, 0], facing: 0, pose: 'stand' },
  { fig: 'm2', at: [100, -160, 0], facing: 0, pose: 'stand' },
  { fig: 'm3', at: [-200, 150, 0], facing: Math.PI, pose: 'stand' },
  { fig: 'm4', at: [100, 150, 0], facing: Math.PI, pose: 'stand' },
];
const FLIM: Place = { fig: 'flimnap', at: [-450, 190, 0], facing: Math.PI, pose: 'stand' };
const BOLG: Place = { fig: 'bolgolam', at: [-450, -190, 0], facing: 0, pose: 'arms-crossed' };

// ---------------------------------------------------------------- SC-013/SC-014 at Gulliver's house (F106)
// The north wall of F106 on y = 0 with the great gate in its middle (本文: 4 ft high, 2 ft wide).
const LIE: Place = { fig: 'gulliver', at: [0, 900, 0], facing: 0, pose: 'prone-palm' };
const PALM = posePoint('prone-palm', LIE.at, 0, H, 'palm.R'); // ≈ [212, 1872, 43]
const EYE = posePoint('prone-palm', LIE.at, 0, H, 'eye'); // ≈ [0, 1605, 357]
const ON_PALM: V3 = [PALM[0], PALM[1], PALM[2] + 25];
// Crawling out of the gate at midnight: the hip just outside the wall, the legs still in the gate.
const CRAWL: Place = { fig: 'gw', at: [0, 350, 0], facing: 0, pose: 'prone-palm' };
const CRAWL_HEAD = posePoint('prone-palm', CRAWL.at, 0, H, 'head');

// ---------------------------------------------------------------- SC-013/SC-014 Mildendo and the palace (F105)
// The palace in the centre (0, 0): the enclosure 2 ft high at ±18,288; the outer court 40 ft square (±6,096) with the
// second court's buildings 8 ft inside it (±3,658, 5 ft high, 4 ft deep); the royal apartments ±1,524, 6 ft to the eaves
// with a hip roof. Gulliver stands in the 8 ft gap south of the second court (本文: "I got to the palace").
const STAND_FIRE: Place = { fig: 'gw', at: [2500, -4877, 0], facing: 0, pose: 'stand' };
const FIRE_HEAD = posePoint('stand', STAND_FIRE.at, 0, H, 'head');
const EAVES = Math.round(6 * foot);
const ROOF_HALF = Math.round(5 * foot) + 150;
const PAL_WALL = Math.round(2 * foot);
/** The outer court's buildings (本文: at least 5 ft): a Lilliputian watching from their roof. */
const OUTER_ROOF = Math.round(5 * foot);
const ENCLOSURE = 18_288;
// The great street west of the palace (5 ft wide on y = 0); the houses begin 20 ft outside the enclosure.
const RUN: Place = { fig: 'gw', at: [-27000, 0, 0], facing: -Math.PI / 2, pose: 'walk' };
const RUN_FOOT = posePoint('walk', RUN.at, RUN.facing, H, 'foot.L');
// Morning: Gulliver kneels on the great street south of the enclosure.
const KNEEL_OUT: Place = { fig: 'gw', at: [0, -21000, 0], facing: 0, pose: 'kneel' };
const PALACE_HIDDEN: V3 = [0, -10_000, -3000];

const FIRE: CadBox[] = [
  // Flames out of the royal apartments' roof (創作の形：炎は箱の重なり), the roof's eaves at 6 ft, the apex about 3.5 m.
  { id: 'fire-1', name: '炎 1', color: '#e07a2a', at: [-ROOF_HALF, -ROOF_HALF, EAVES - 200], size: [2 * ROOF_HALF, 2 * ROOF_HALF, 900], opacity: 0.75 },
  { id: 'fire-2', name: '炎 2', color: '#e0a02a', at: [-1100, -1300, EAVES + 600], size: [1500, 1600, 1400], opacity: 0.7 },
  { id: 'fire-3', name: '炎 3', color: '#e07a2a', at: [-200, -600, EAVES + 1500], size: [1100, 1000, 1500], opacity: 0.7 },
  { id: 'fire-4', name: '炎 4', color: '#c8501e', at: [-ROOF_HALF - 100, -ROOF_HALF - 100, 900], size: [500, 2 * ROOF_HALF + 200, 900], opacity: 0.7 },
];
const STEAM: CadBox[] = [
  { id: 'steam-1', name: '湯気 1', color: '#e8eef0', at: [-ROOF_HALF - 400, -ROOF_HALF - 400, EAVES], size: [2 * ROOF_HALF + 800, 2 * ROOF_HALF + 800, 1600], opacity: 0.45 },
  { id: 'steam-2', name: '湯気 2', color: '#f2f4f4', at: [-1200, -1000, EAVES + 1600], size: [2200, 2000, 1800], opacity: 0.4 },
];
const CHAR: CadBox[] = [
  { id: 'char-1', name: '焼けた屋根', color: '#2a2622', at: [-ROOF_HALF, -ROOF_HALF, EAVES], size: [2 * ROOF_HALF, 2 * ROOF_HALF, 500] },
  { id: 'char-2', name: '焼けた屋根の骨', color: '#1e1a18', at: [-150, -ROOF_HALF, EAVES + 500], size: [300, 2 * ROOF_HALF, 900] },
  { id: 'char-3', name: '焼けた壁', color: '#3a3430', at: [-ROOF_HALF, -ROOF_HALF - 10, 600], size: [2 * ROOF_HALF, 30, EAVES - 600] },
];
const AT_ROOF: VesselAt = { at: [0, 0, 0] };

const SETS: SetDef[] = [
  {
    id: 'throne',
    name: '王宮の玉座の間（評議の間）と、その外の庭（仮の3D、創作）',
    scenes: ['SC-012', 'SC-013'],
    model: {
      reason: '再現（GV1〜GV7）の王宮（F105）に部屋の中は無く、ガリヴァーが入れる部屋も無い。第2話の評議の間と同じ大きさの部屋（創作、小人の大きさ）の東の面を大窓とし、窓の外に低い露台と、ガリヴァーがひざまずく庭を置いた仮の3D。',
      cad: [
        { id: 'court', name: '王宮の庭', color: '#a89c84', at: [-6000, -6000, -14], size: [12000, 12000, 12] },
        { id: 'floor', name: '床', color: '#8a6b4a', at: [-620, -420, -6], size: [1240, 840, 6] },
        { id: 'wall-n', name: '北の壁', color: '#cbbfa6', at: [-620, 420, 0], size: [1240, 20, 420] },
        { id: 'wall-s', name: '南の壁', color: '#cbbfa6', at: [-620, -440, 0], size: [1240, 20, 420] },
        { id: 'wall-w', name: '西の壁（玉座の後ろ）', color: '#b8a98c', at: [-640, -440, 0], size: [20, 880, 420] },
        { id: 'wall-e1', name: '東の壁（窓の南）', color: '#cbbfa6', at: [620, -440, 0], size: [20, 240, 420] },
        { id: 'wall-e2', name: '東の壁（窓の北）', color: '#cbbfa6', at: [620, 200, 0], size: [20, 240, 420] },
        { id: 'sill', name: '大窓の下の壁（窓の幅 400 mm、高さ 280 mm）', color: '#cbbfa6', at: [620, -200, 0], size: [20, 400, SILL] },
        { id: 'lintel', name: '大窓の上の壁', color: '#cbbfa6', at: [620, -200, 340], size: [20, 400, 80] },
        { id: 'roof', name: '屋根', color: '#7a5a4a', at: [-660, -460, 420], size: [1320, 920, 30] },
        { id: 'terrace', name: '窓の外の露台（創作：高さ 60 mm）', color: '#b8ab92', at: [640, -200, 0], size: [220, 400, SILL] },
        { id: 'table', name: '長い卓', color: '#6b4a2e', at: [-300, -60, 0], size: [600, 120, 60] },
        { id: 'throne', name: '玉座', color: '#8c2f39', at: [-600, -50, 0], size: [60, 100, 110] },
        { id: 'wing-w', name: '王宮の西の棟（創作、玉座の間の後ろ）', color: '#d2c3a0', at: [-2400, -1500, 0], size: [1700, 3000, 900] },
      ],
    },
    actors: [G, EMPEROR, FLIMNAP, BOLGOLAM, lil('m1', '大臣1', 0), lil('m2', '大臣2', 1), lil('m3', '大臣3', 2), lil('m4', '大臣4', 3)],
    crowds: [],
    shots: [
      // SC-012
      { panel: 'e04-p01-k1', cam: [2700, -2900, 136], look: [1100, 0, 680], places: [KNEEL, EMP_WIN, ...MINISTERS] },
      { panel: 'e04-p01-k2', cam: [1010, -170, SILL + 136], look: [730, 0, SILL + 125], stand: 'terrace', places: [KNEEL, EMP_WIN] },
      { panel: 'e04-p02-k1', cam: [250, -170, 136], look: [800, 0, 230], places: [KNEEL, { ...EMP_WIN, pose: 'stand' }, ...MINISTERS] },
      { panel: 'e04-p02-k2', cam: [560, 380, 450 + 136], look: KNEEL_HEAD, stand: 'throne-roof', places: [KNEEL, { ...EMP_WIN, pose: 'stand' }] },
      { panel: 'e04-p02-k3', cam: [-560, -330, 136], look: [100, 0, 100], places: [{ ...EMP_WIN, pose: 'stand' }, ...MINISTERS, FLIM, BOLG] },
      { panel: 'e04-p03-k1', cam: [2900, 1700, 136], look: [1250, 0, 880], places: [KNEEL, { ...EMP_WIN, pose: 'stand' }] },
      { panel: 'e04-p03-k2', cam: [950, 110, SILL + 136], look: [730, 0, SILL + 128], stand: 'terrace', places: [KNEEL, { ...EMP_WIN, pose: 'stand' }] },
      { panel: 'e04-p03-k3', cam: [500, -360, 136], look: [-100, 0, 110], places: [{ ...EMP_WIN, pose: 'stand' }, ...MINISTERS.map((m) => ({ ...m, pose: 'bow' as const })), FLIM, BOLG] },
      { panel: 'e04-p04-k1', cam: [150, 260, 136], look: [690, 0, 170], places: [KNEEL, { ...EMP_WIN, at: [560, 0, 0], facing: Math.PI / 2, pose: 'turn-away' }] },
      { panel: 'e04-p04-k2', cam: [-150, -350, 136], look: [-470, 30, 115], places: [{ ...FLIM, pose: 'glare' }, { ...BOLG, pose: 'glare' }] },
      { panel: 'e04-p05-k1', cam: [-220, 330, 136], look: [-450, 0, 118], places: [{ ...FLIM, facing: Math.PI + 0.5, pose: 'hands-together' }, BOLG] },
      { panel: 'e04-p05-k2', cam: [3900, -800, 136], look: [1250, 0, 780], places: [KNEEL] },
      // SC-013 asking leave to visit Blefuscu
      { panel: 'e04-p08-k1', cam: [2700, 2700, 136], look: [1100, 0, 700], places: [KNEEL, { ...EMP_WIN, pose: 'stand' }, { fig: 'flimnap', at: [450, 120, 0], facing: -Math.PI / 2, pose: 'read' }] },
      { panel: 'e04-p08-k2', cam: [1010, -130, SILL + 136], look: [640, 40, SILL + 115], stand: 'terrace', places: [KNEEL, { ...EMP_WIN, pose: 'stand' }, { fig: 'flimnap', at: [450, 120, 0], facing: -Math.PI / 2, pose: 'read' }] },
      { panel: 'e04-p08-k3', cam: [880, 40, SILL + 136], look: [730, 0, SILL + 130], stand: 'terrace', places: [KNEEL, { ...EMP_WIN, pose: 'stand' }] },
      { panel: 'e04-p09-k1', cam: [200, -280, 136], look: [-470, 0, 120], places: [
        { fig: 'emperor', at: [-540, 0, 0], facing: -Math.PI / 2, pose: 'stand' },
        { fig: 'flimnap', at: [-360, 120, 0], facing: Math.PI / 2 + 0.3, pose: 'read' },
        { fig: 'bolgolam', at: [-360, -120, 0], facing: Math.PI / 2 - 0.3, pose: 'point' }] },
      { panel: 'e04-p09-k2', cam: [1000, -1500, 136], look: [2600, 1200, 950], places: [{ fig: 'gulliver', at: [2700, 1400, 0], facing: -0.3, pose: 'walk' }] },
    ],
  },
  {
    id: 'gate',
    name: 'ガリヴァーの家（古い神殿 F106）の前：使節の訪問と、真夜中の戸口',
    scenes: ['SC-013', 'SC-014'],
    model: {
      bim: 'temple',
      cad: [{ id: 'grass', name: '草地', color: '#6f8f4a', at: [-250000, -250000, -14], size: [500000, 500000, 12] }],
    },
    hidden: [0, -3000, -3000],
    actors: [G, G_WAISTCOAT, ENVOY, envoy(0), envoy(1), envoy(2), envoy(3), envoy(4)],
    crowds: [
      { id: 'train', name: '使節の従者（創作の人数）', people: grid(-1600, 2900, -700, 3500, 150, 0, Math.PI, 71) },
      { id: 'mob', name: '真夜中に戸口へ押し寄せた群衆（本文：数百人、創作の人数）', people: [...grid(-1500, 1900, 1500, 2900, 130, 0, Math.PI, 73), ...grid(-1500, 700, -500, 1800, 130, 0, Math.PI / 2, 75), ...grid(500, 700, 1500, 1800, 130, 0, -Math.PI / 2, 77)] },
    ],
    shots: [
      { panel: 'e04-p06-k2', cam: [1100, 3600, 136], look: [100, 1900, 260], places: [LIE, { fig: 'envoy', at: [150, 2350, 0], facing: Math.PI, pose: 'walk' },
        ...[0, 1, 2, 3, 4].map((i): Place => ({ fig: `ev${i}`, at: [-260 + 130 * i, 2600 + 60 * (i % 2), 0], facing: Math.PI, pose: 'walk' }))], crowds: ['train'] },
      { panel: 'e04-p07-k1', cam: [1600, 3500, 136], look: [120, 1550, 330], places: [LIE, { fig: 'envoy', at: ON_PALM, facing: Math.PI, pose: 'orate' },
        ...[0, 1, 2, 3, 4].map((i): Place => ({ fig: `ev${i}`, at: [-350 + 160 * i, 2250, 0], facing: Math.PI, pose: i % 2 ? 'bow' : 'stand' }))], crowds: ['train'] },
      { panel: 'e04-p07-k2', cam: [380, 2200, 150], look: [ON_PALM[0], ON_PALM[1], 140], places: [LIE, { fig: 'envoy', at: ON_PALM, facing: Math.PI, pose: 'bow' }] },
      { panel: 'e04-p07-k3', cam: [380, 2250, 260], look: [EYE[0], EYE[1], EYE[2] + 20], places: [LIE, { fig: 'envoy', at: ON_PALM, facing: Math.PI, pose: 'stand' }] },
      // SC-014 midnight at the gate
      { panel: 'e04-p10-k1', cam: [700, 3600, 136], look: [0, 600, 520], places: [], crowds: ['mob'] },
      { panel: 'e04-p10-k2', cam: [450, 2350, 136], look: [0, 1000, 330], places: [CRAWL], crowds: ['mob'] },
    ],
  },
  {
    id: 'palace',
    name: '都ミルデンドウ（F105）の大通りと王宮：使節の行列、火事、朝',
    scenes: ['SC-013', 'SC-014'],
    hidden: PALACE_HIDDEN,
    model: {
      bim: 'mildendo',
      reason: '火・湯気・焼けた屋根は、王の住まい（F105 の中庭の 10 フィート四方の棟）の屋根の上に置いた箱（創作の形）。コマごとに出し入れした。',
      cad: [{ id: 'ground', name: '都の地面', color: '#7a8f55', at: [-60000, -60000, -14], size: [120000, 120000, 12] }],
      vessels: [
        { id: 'fire', name: '王の住まいの炎（仮の3D）', boxes: FIRE },
        { id: 'steam', name: '湯気（仮の3D）', boxes: STEAM },
        { id: 'char', name: '焼けた屋根（仮の3D）', boxes: CHAR },
      ],
    },
    actors: [G_WAISTCOAT, EMPRESS, ENVOY, envoy(0), envoy(1), envoy(2), envoy(3), envoy(4), maid(0), maid(1)],
    crowds: [
      { id: 'procession', name: '使節の行列の従者（本文：五百人ほど、創作の並び）', people: grid(-560, -25000, 560, -20200, 140, 0, 0, 81) },
      { id: 'street', name: '大通りの民（創作の人数）', people: [...grid(-26300, -650, -24200, -450, 170, 0, 0, 83), ...grid(-26300, 450, -24200, 650, 170, 0, Math.PI, 85)] },
      { id: 'buckets', name: '桶で水を運ぶ人々（創作の人数）', people: [...grid(-3000, -5700, 1600, -4200, 160, 0, 0, 87), ...grid(3400, -5700, 5200, -4200, 160, 0, 0, 89)] },
      { id: 'gawk', name: 'ガリヴァーの方を見上げる外庭の人々（創作の人数）', people: grid(-2600, -5800, -900, -4100, 150, 0, -Math.PI / 2, 95) },
      { id: 'inner', name: '奥の庭の人々（創作の人数）', people: [...grid(-2300, -2350, -700, -1700, 150, 0, 0, 91), ...grid(600, -2350, 2300, -1700, 150, 0, 0, 93)] },
    ],
    shots: [
      // SC-013 the embassy comes up the great street to the palace gate.
      { panel: 'e04-p06-k1', cam: [-1300, -ENCLOSURE, PAL_WALL + 136], look: [0, -22500, 60], stand: 'palace-wall', places: [
        { fig: 'envoy', at: [0, -19700, 0], facing: 0, pose: 'walk' },
        ...[0, 1, 2, 3, 4].map((i): Place => ({ fig: `ev${i}`, at: [-300 + 150 * i, -19950 - 80 * (i % 2), 0], facing: 0, pose: 'walk' }))], crowds: ['procession'] },
      // SC-014 the run, the fire, the morning.
      { panel: 'e04-p11-k1', cam: [-23300, 520, 136], look: [-26600, 0, 950], places: [RUN], crowds: ['street'] },
      { panel: 'e04-p11-k2', cam: [-26150, 420, 70], look: [RUN_FOOT[0], RUN_FOOT[1], 60], places: [RUN], crowds: ['street'] },
      { panel: 'e04-p12-k1', cam: [6200, -6200, OUTER_ROOF + 136], look: [1500, -3100, 1350], stand: 'outer-roof', places: [STAND_FIRE], crowds: ['buckets', 'inner'], vessels: { fire: AT_ROOF } },
      { panel: 'e04-p12-k2', cam: [400, -5100, 136], look: [2000, -4700, 110], places: [STAND_FIRE], crowds: ['buckets'], vessels: { fire: AT_ROOF } },
      { panel: 'e04-p13-k1', cam: [4900, -5800, 136], look: [2500, -4877, 1250], places: [{ ...STAND_FIRE, pose: 'turn-away' }], crowds: ['buckets'], vessels: { fire: AT_ROOF } },
      { panel: 'e04-p13-k2', cam: [2950, -4050, 1600], look: FIRE_HEAD, places: [STAND_FIRE], vessels: { fire: AT_ROOF } },
      { panel: 'e04-p14-k1', cam: [300, -4500, 120], look: [-1500, -4950, 330], places: [STAND_FIRE], crowds: ['gawk'], vessels: { steam: AT_ROOF } },
      { panel: 'e04-p14-k2', cam: [-2200, -2300, 136], look: [0, 0, 2500], places: [], crowds: ['inner'], vessels: { steam: AT_ROOF } },
      { panel: 'e04-p15-k1', cam: [-2250, -2350, 136], look: [0, 0, 1500], places: [], vessels: { char: AT_ROOF } },
      { panel: 'e04-p15-k2', cam: [-250, -2380, 136], look: [-300, -2000, 118], places: [{ fig: 'empress', at: [-300, -2000, 0], facing: Math.PI + 0.3, pose: 'stand' }], vessels: { char: AT_ROOF } },
      { panel: 'e04-p15-k3', cam: [-2250, -2050, 136], look: [600, -2700, 600], places: [
        { ...STAND_FIRE, pose: 'stand' },
        { fig: 'empress', at: [-200, -2000, 0], facing: -Math.PI / 2, pose: 'walk' },
        { fig: 'maid0', at: [-700, -1900, 0], facing: -Math.PI / 2, pose: 'hands-face' },
        { fig: 'maid1', at: [-850, -2150, 0], facing: -Math.PI / 2, pose: 'hands-face' }], vessels: { char: AT_ROOF } },
      { panel: 'e04-p16-k1', cam: [1800, -19300, 136], look: [0, -21000, 950], places: [KNEEL_OUT] },
      { panel: 'e04-p16-k2', cam: [350, -26500, 136], look: [0, -19000, 950], places: [KNEEL_OUT] },
    ],
  },
];
void CRAWL_HEAD;
void deg;
void inch;

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
  const doc = emptyCharacter(`第4話 舞台：${set.name}`);
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
      const [label, content] = set.model.bim === 'temple' ? ['F106 古い神殿', f106Temple()] : ['F105 都ミルデンドウ', f105Mildendo().doc];
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
