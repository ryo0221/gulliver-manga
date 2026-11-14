// ネーム 第1話の舞台（never committed to editor-platform; kept in gulliver-manga part1/name/src/).
// Stages every panel of episode 1 on the digital twin: the people (F107/F108 body plan, F121
// horses) are rigged figures in one character document per set, the places are props (F106 the
// temple as a BIM version; the ground, stand-ins and the engine as CAD versions). Each panel is one
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
import {
  addFigure,
  gulliverLook,
  inverseQuat,
  lilliputLooks,
  rotateVec,
  rotationBetween,
  type FigureLook,
  type PlacedFigure,
} from '../../scripts/fixtures/gulliver-people';
import { addHorse, sorrelCoat, grayCoat } from '../../scripts/fixtures/gulliver-horse';
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

// ---------------------------------------------------------------- poses (body frame: faces +y, left −x, up +z)
type Pose =
  | 'stand' | 'walk' | 'wave-hat' | 'hands-together' | 'turn-away' | 'carry-bag'
  | 'lie' | 'lie-look' | 'lie-arm-free' | 'lie-eat' | 'lie-drink' | 'lie-hand-hover'
  | 'swim' | 'tread' | 'sit'
  | 'archer' | 'sword-up' | 'point' | 'orate' | 'fall' | 'dance' | 'carry-up' | 'crouch';
type Dirs = Partial<Record<string, V3>>;
const POSES: Record<Pose, { root?: Quat; hip: number; dirs?: Dirs; head?: Quat }> = {
  stand: { hip: 0.53 },
  walk: { hip: 0.525, dirs: { 'thigh.L': [0, 0.35, -1], 'thigh.R': [0, -0.3, -1], 'arm.L': [0, -0.3, -1], 'arm.R': [0, 0.3, -1] } },
  'wave-hat': { hip: 0.53, dirs: { 'arm.R': [0.35, 0.15, 1], 'forearm.R': [0.2, 0, 1] } },
  'hands-together': { hip: 0.53, dirs: { 'arm.L': [0.15, 0.35, -1], 'arm.R': [-0.15, 0.35, -1], 'forearm.L': [0.6, 0.8, -0.3], 'forearm.R': [-0.6, 0.8, -0.3] } },
  'turn-away': { hip: 0.53, head: axisAngleQuat([0, 0, 1], 0.5) },
  'carry-bag': { hip: 0.53, dirs: { 'arm.R': [0.3, 0.2, 1], 'forearm.R': [-0.3, 0, 1] } },
  // Lying on the back: the front turned up (+y → +z), the head toward −y, the feet toward +y.
  lie: { root: axisAngleQuat([1, 0, 0], Math.PI / 2), hip: 0.075 },
  'lie-look': { root: axisAngleQuat([1, 0, 0], Math.PI / 2), hip: 0.075, head: axisAngleQuat([1, 0, 0], -0.55) },
  'lie-arm-free': { root: axisAngleQuat([1, 0, 0], Math.PI / 2), hip: 0.075, dirs: { 'arm.L': [-0.2, 1, 0.15] }, head: axisAngleQuat([1, 0, 0], -0.3) },
  'lie-eat': { root: axisAngleQuat([1, 0, 0], Math.PI / 2), hip: 0.075, dirs: { 'arm.L': [0.1, 0.9, 0.45], 'forearm.L': [0.9, 0.1, 0.45] } },
  'lie-drink': { root: axisAngleQuat([1, 0, 0], Math.PI / 2), hip: 0.075, dirs: { 'arm.L': [0.05, 1, 0.5], 'forearm.L': [0.7, 0.3, 0.6] }, head: axisAngleQuat([1, 0, 0], 0.35) },
  'lie-hand-hover': { root: axisAngleQuat([1, 0, 0], Math.PI / 2), hip: 0.075, dirs: { 'arm.L': [0.25, 1, 0.1], 'forearm.L': [0.9, 0.35, 0.2] }, head: axisAngleQuat([1, 0, 0], -0.45) },
  // Face down in the water, the arms reaching on.
  swim: { root: axisAngleQuat([1, 0, 0], -Math.PI / 2), hip: -0.09, dirs: { 'arm.L': [-0.2, 0.3, 1], 'arm.R': [0.2, -0.2, -1] } },
  tread: { hip: 0.53, dirs: { 'arm.L': [-0.8, 0.3, -0.3], 'arm.R': [0.8, 0.3, -0.3] } },
  sit: { hip: 0.08, dirs: { 'thigh.L': [-0.15, 1, 0.05], 'thigh.R': [0.15, 1, 0.05], 'shin.L': [-0.1, 0.25, -1], 'shin.R': [0.1, 0.25, -1], 'arm.L': [-0.2, 0.4, -1], 'arm.R': [0.2, 0.4, -1] } },
  archer: { hip: 0.53, dirs: { 'arm.L': [-0.1, 1, 0.12], 'arm.R': [0.15, 0.7, 0.12], 'forearm.R': [-0.4, -0.6, 0.1] } },
  'sword-up': { hip: 0.53, dirs: { 'arm.R': [0.25, 0.35, 1], 'forearm.R': [0.1, 0.5, 1], 'thigh.L': [0, 0.3, -1] } },
  point: { hip: 0.53, dirs: { 'arm.R': [0.15, 1, 0.15] } },
  orate: { hip: 0.53, dirs: { 'arm.R': [0.45, 0.8, 0.45], 'arm.L': [-0.3, 0.4, -1] } },
  fall: { root: axisAngleQuat([0.6, 0.8, 0], 1.1), hip: 0.4, dirs: { 'arm.L': [-0.8, 0, 0.7], 'arm.R': [0.8, 0.2, 0.6], 'thigh.L': [0, 0.6, -0.8] } },
  dance: { hip: 0.53, dirs: { 'arm.L': [-0.5, 0.1, 1], 'arm.R': [0.5, 0.1, 1], 'thigh.R': [0.1, 0.6, -0.8] } },
  'carry-up': { hip: 0.53, dirs: { 'arm.L': [-0.25, 0.1, 1], 'arm.R': [0.25, 0.1, 1] } },
  crouch: { hip: 0.36, dirs: { 'thigh.L': [0, 1, -0.5], 'thigh.R': [0, 0.8, -0.6], 'shin.L': [0, -0.3, -1], 'shin.R': [0, -0.4, -1], 'arm.R': [0.1, 1, -0.2] } },
};
const PARENT: Record<string, string> = {
  'forearm.L': 'arm.L', 'forearm.R': 'arm.R', 'shin.L': 'thigh.L', 'shin.R': 'thigh.R',
};
const LIMBS = ['arm.L', 'arm.R', 'forearm.L', 'forearm.R', 'thigh.L', 'thigh.R', 'shin.L', 'shin.R'];
const norm = (v: V3): V3 => {
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
};
/** Local rotations for a pose: a bone's direction is given in the body frame. */
function poseRotations(pose: Pose) {
  const p = POSES[pose];
  const world = new Map<string, Quat>();
  const local: Record<string, Quat> = {};
  for (const b of LIMBS) {
    const d = p.dirs?.[b];
    const parentWorld = PARENT[b] ? (world.get(PARENT[b]!) ?? [0, 0, 0, 1]) : ([0, 0, 0, 1] as Quat);
    if (!d) {
      local[b] = [0, 0, 0, 1];
      world.set(b, parentWorld);
      continue;
    }
    // The bone's own rest direction is straight down in its parent's frame; turn it toward the
    // wanted body-frame direction brought into that frame.
    const q = rotationBetween([0, 0, -1], rotateVec(inverseQuat(parentWorld), norm(d)) as V3);
    local[b] = q;
    world.set(b, multiplyQuat(parentWorld, q));
  }
  local.head = p.head ?? [0, 0, 0, 1];
  return local;
}

// ---------------------------------------------------------------- the people and the panels
type Who = 'CH-01' | 'CH-10' | 'CH-02' | 'CH-30' | 'EX' | 'horse'; // EX: an extra (a sailor, a townsman) not in the cast list
/** A figure in a panel: `at` is its ground point (standing) or the ground point under its hip (lying). */
type Place = { fig: string; at: V3; facing: number; pose: Pose; note?: string };
/** A movable model (a ship, a boat): its own CAD version, placed per shot (hidden when a shot leaves it out and it has no home). */
type Vessel = { id: string; name: string; boxes: CadBox[]; home?: V3 };
type VesselAt = { at: V3; rot?: Quat };
type Shot = { panel: string; cam: V3; look: V3; stand?: string; places: Place[]; crowds?: string[]; noModel?: string; vessels?: Record<string, VesselAt> };
type Actor = { id: string; who: Who; name: string; height: number; look?: FigureLook; horse?: boolean; coat?: typeof grayCoat };
type Crowd = { id: string; name: string; people: { at: V3; facing: number; height: number; look: FigureLook }[]; horses?: { at: V3; facing: number; withers: number }[] };
type SetDef = {
  id: string;
  name: string;
  scenes: string[];
  model: { cad: CadBox[]; bim?: 'temple'; reason?: string; vessels?: Vessel[] };
  actors: Actor[];
  crowds: Crowd[];
  shots: Shot[];
};
type CadBox = { id: string; name: string; color: string; at: V3; size: V3; cylinder?: { r: number; h: number; up?: boolean }; opacity?: number };

/**
 * A three-masted merchant ship as boxes (創作: the text gives no plan of the Antelope). Its origin is
 * the waterline under the mainmast; the bow is +x, the deck 1.5 m above the water.
 */
function shipBoxes(): CadBox[] {
  const hull = '#5b3b24', wood = '#7a5232', sail = '#e8dfc8';
  const out: CadBox[] = [
    { id: 'hull', name: '船体', color: hull, at: [-13000, -3500, -3500], size: [24000, 7000, 5000] },
    { id: 'bow', name: '船首', color: hull, at: [11000, -2200, -2500], size: [3000, 4400, 4300] },
    { id: 'stern', name: '船尾楼', color: wood, at: [-13000, -3500, 1500], size: [5000, 7000, 2500] },
    { id: 'forecastle', name: '船首楼', color: wood, at: [9000, -3000, 1500], size: [4000, 6000, 1500] },
    { id: 'bowsprit', name: '船首の帆柱', color: wood, at: [14000, -150, 2500], size: [6000, 300, 300] },
  ];
  ([['fore', 8000, 20000], ['main', 1000, 24000], ['mizzen', -6000, 17000]] as const).forEach(([m, x, ht]) => {
    out.push({ id: `${m}-mast`, name: `${m} の帆柱`, color: wood, at: [x, 0, 1500], size: [0, 0, 0], cylinder: { r: 250, h: ht, up: true } });
    for (const [i, z] of [[1, 1500 + ht * 0.45], [2, 1500 + ht * 0.8]] as const) {
      const w = i === 1 ? 11000 : 8000;
      out.push({ id: `${m}-yard-${i}`, name: `${m} の帆桁 ${i}`, color: wood, at: [x - 150, -w / 2, z], size: [300, w, 300] });
      out.push({ id: `${m}-sail-${i}`, name: `${m} の帆 ${i}（畳んだ形）`, color: sail, at: [x + 150, -w / 2 + 300, z - 900], size: [200, w - 600, 900] });
    }
  });
  return out;
}
/** The ship's boat (創作): 5 m long, room for six. Origin at the waterline amidships, bow +x. */
function boatBoxes(): CadBox[] {
  return [
    { id: 'boat-hull', name: '小舟の船体', color: '#6b4a2e', at: [-2500, -900, -400], size: [5000, 1800, 700] },
    { id: 'boat-bow', name: '小舟の舳先', color: '#6b4a2e', at: [2500, -500, -300], size: [600, 1000, 600] },
    { id: 'boat-thwart-1', name: '漕ぎ座 1', color: '#a07a50', at: [-1000, -850, 200], size: [250, 1700, 60] },
    { id: 'boat-thwart-2', name: '漕ぎ座 2', color: '#a07a50', at: [800, -850, 200], size: [250, 1700, 60] },
  ];
}

const G: Actor = { id: 'gulliver', who: 'CH-01', name: 'ガリヴァー', height: H, look: gulliverLook };
const olderG: Actor = { ...G, look: { ...gulliverLook, coat: '#4a5866', hair: '#6d5a48' } };
const MARY: Actor = { id: 'mary', who: 'CH-10', name: 'メアリー', height: 1600, look: { coat: '#7b4a5c', breeches: '#7b4a5c', stockings: '#7b4a5c', shoes: '#3a2a22', skin: '#efd0b0', hair: '#4a3020' } };
const lil = (id: string, name: string, i: number, who: Who = 'CH-30'): Actor => ({ id, who, name, height: h, look: lilliputLooks[i % lilliputLooks.length] });
const sailor = (id: string, name: string, i: number): Actor => ({ id, who: 'EX', name, height: 1680, look: [{ coat: '#3a3a3a', breeches: '#6b5a44', stockings: '#8a8070', shoes: '#2b2622', skin: '#d9b08c', hair: '#3a2a1a' }, { coat: '#5a4a3a', breeches: '#3d4652', stockings: '#7a7468', shoes: '#2b2622', skin: '#e0b894', hair: '#5a3a22' }, { coat: '#7a2e2e', breeches: '#4a4038', stockings: '#7a7468', shoes: '#2b2622', skin: '#d4a882', hair: '#2a2018' }][i % 3] });
const EMPEROR: Actor = { id: 'emperor', who: 'CH-02', name: '皇帝', height: 158, look: { coat: '#c9a227', breeches: '#5c3b6b', stockings: '#efe7d6', shoes: '#2b2622', skin: '#e9c4a0', hair: '#2a2018' } };

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

// Gulliver lying on his back, feet toward +y, his hip over the origin: the body points (創作 from the body plan).
const LYING = { head: [0, -700, 175] as V3, chest: [0, -385, 245] as V3, leftHand: [-236, 157, 131] as V3, leftAnkle: [-96, 800, 60] as V3 };
const CHEST_EYE = 245 + 136; // a Lilliputian standing on the chest

// SC-001: the man faces the horses (+y); each horse's head reaches toward him (創作の配置).
const MAN: Place = { fig: 'gulliver', at: [200, 300, 0], facing: 0, pose: 'hands-together' };
const H1: Place = { fig: 'horse1', at: [-650, 2700, 0], facing: Math.PI, pose: 'stand' };
const H2: Place = { fig: 'horse2', at: [950, 2750, 0], facing: Math.PI, pose: 'stand' };
const SETS: SetDef[] = [
  {
    id: 'stable',
    name: '英国の田舎家の厩（仮の3D、創作）',
    scenes: ['SC-001'],
    model: {
      reason: '再現（GV1〜GV7）に英国の家と厩の3Dモデルは無い。床・壁・戸口だけの仮の3D（創作）で人物と馬の配置とカメラを決めた。',
      cad: [
        { id: 'yard', name: '庭', color: '#6f8a4e', at: [-30000, -30000, -60], size: [60000, 60000, 50] },
        { id: 'floor', name: '厩の床（藁）', color: '#b59a62', at: [-3000, -2650, -10], size: [6000, 7300, 12] },
        { id: 'back', name: '奥の壁', color: '#8a6b4a', at: [-3000, 4500, 0], size: [6000, 150, 2600] },
        { id: 'left', name: '左の壁', color: '#8a6b4a', at: [-3150, -2650, 0], size: [150, 7300, 2600] },
        { id: 'right', name: '右の壁', color: '#8a6b4a', at: [3000, -2650, 0], size: [150, 7300, 2600] },
        { id: 'front-l', name: '戸口の左', color: '#7a5d40', at: [-3000, -2650, 0], size: [2400, 150, 2600] },
        { id: 'front-r', name: '戸口の右', color: '#7a5d40', at: [600, -2650, 0], size: [2400, 150, 2600] },
        { id: 'lintel', name: '戸口の上', color: '#7a5d40', at: [-600, -2650, 2100], size: [1200, 150, 500] },
        { id: 'house', name: '母屋', color: '#c9b79a', at: [-14000, -9000, 0], size: [8000, 6000, 5200] },
      ],
    },
    actors: [olderG, MARY, { id: 'horse1', who: 'horse', name: '馬（灰）', height: 1450, horse: true, coat: grayCoat }, { id: 'horse2', who: 'horse', name: '馬（栗毛）', height: 1420, horse: true, coat: sorrelCoat }],
    crowds: [],
    shots: [
      { panel: 'e01-p01-k2', cam: [2500, -11000, 1600], look: [-300, -2000, 1300], places: [{ fig: 'mary', at: [-300, -3300, 0], facing: 0, pose: 'stand' }] },
      { panel: 'e01-p02-k1', cam: [-2700, -1500, 1600], look: [200, 1300, 1250], places: [MAN, H1, H2, { fig: 'mary', at: [0, -2900, 0], facing: 0, pose: 'hands-together' }] },
      { panel: 'e01-p02-k2', cam: [350, 550, 1550], look: [-650, 1050, 1700], places: [{ ...MAN, facing: 0.35 }, H1, H2] },
      { panel: 'e01-p02-k3', cam: [600, 1500, 1600], look: [0, -2900, 1300], places: [MAN, H1, H2, { fig: 'mary', at: [0, -2900, 0], facing: 0, pose: 'hands-together' }] },
      { panel: 'e01-p02-k4', cam: [480, -500, 1680], look: [-100, 1300, 1550], places: [MAN, H1, H2] },
      { panel: 'e01-p02-k5', cam: [-2400, -7500, 1600], look: [300, -3300, 1300], places: [{ fig: 'mary', at: [400, -3600, 0], facing: Math.PI, pose: 'turn-away' }] },
      { panel: 'e01-p02-k6', cam: [2200, 4200, 2000], look: [-200, -2600, 900], places: [MAN, H1, H2] },
    ],
  },
  {
    id: 'port',
    name: 'ブリストルの岸壁（仮の3D、創作）',
    scenes: ['SC-002'],
    model: {
      reason: '再現（GV1〜GV7）にブリストルの港とアンテロープ号の3Dモデルは無い。岸壁と海面と倉庫、三本マストの船の形だけの仮の3D（創作：本文に船の図は無い）で人物の配置とカメラを決めた。',
      vessels: [{ id: 'ship', name: 'アンテロープ号（仮の3D、創作）', boxes: shipBoxes(), home: [0, 7500, -1500] }],
      cad: [
        { id: 'quay', name: '岸壁', color: '#9a8f7e', at: [-40000, -30000, -20], size: [80000, 30000, 20] },
        { id: 'sea', name: '海面', color: '#3f6f8f', at: [-200000, 0, -1500], size: [400000, 200000, 20] },
        { id: 'bollard', name: '係船柱', color: '#4a4038', at: [1200, -400, 0], size: [250, 250, 600] },
        { id: 'warehouse', name: '倉庫', color: '#b8a27e', at: [-15000, -24000, 0], size: [30000, 8000, 9000] },
      ],
    },
    actors: [G, MARY, sailor('s1', '船員1', 0), sailor('s2', '船員2', 1), sailor('s3', '船員3', 2)],
    crowds: [{ id: 'quayfolk', name: '岸壁の見送りの人々', people: grid(-9000, -9000, 9000, -2500, 1300, 0, 0, 21, 1650) }],
    shots: [
      { panel: 'e01-p03-k1', cam: [-34000, -14000, 12000], look: [0, 4000, 2500], places: [
        { fig: 'gulliver', at: [-1500, -1500, 0], facing: 0, pose: 'carry-bag' },
        { fig: 'mary', at: [-600, -1700, 0], facing: 0, pose: 'hands-together' },
        { fig: 's1', at: [-3000, 6000, 0], facing: Math.PI, pose: 'carry-up' },
        { fig: 's2', at: [3000, 8500, 0], facing: 0, pose: 'walk' },
        { fig: 's3', at: [9500, 7000, 1500], facing: Math.PI / 2, pose: 'point' } ], crowds: ['quayfolk'] },
      { panel: 'e01-p03-k2', cam: [-3200, -4200, 1600], look: [0, -1500, 1200], places: [
        { fig: 'gulliver', at: [0, -1500, 0], facing: -Math.PI / 2, pose: 'carry-bag' },
        { fig: 'mary', at: [950, -1400, 0], facing: Math.PI / 2, pose: 'hands-together' } ] },
      { panel: 'e01-p03-k3', cam: [-800, -1800, 1650], look: [950, -1400, 1480], places: [
        { fig: 'gulliver', at: [0, -1500, 0], facing: -Math.PI / 2, pose: 'carry-bag' },
        { fig: 'mary', at: [950, -1400, 0], facing: Math.PI / 2, pose: 'hands-together' } ] },
      { panel: 'e01-p03-k4', cam: [1800, -1200, 1580], look: [0, -1500, 1600], places: [
        { fig: 'gulliver', at: [0, -1500, 0], facing: -Math.PI / 2, pose: 'carry-bag' },
        { fig: 'mary', at: [950, -1400, 0], facing: Math.PI / 2, pose: 'hands-together' } ] },
      { panel: 'e01-p04-k1', cam: [80, -1420, 1520], look: [950, -1400, 1490], places: [
        { fig: 'mary', at: [950, -1400, 0], facing: Math.PI / 2, pose: 'hands-together' } ] },
      { panel: 'e01-p04-k2', cam: [3200, -5200, 1600], look: [600, -500, 1300], places: [
        { fig: 'gulliver', at: [300, -300, 0], facing: 0, pose: 'wave-hat' },
        { fig: 'mary', at: [1500, -2600, 0], facing: -0.3, pose: 'hands-together' } ], crowds: ['quayfolk'] },
      { panel: 'e01-p04-k3', cam: [-20000, -40000, 30000], look: [0, 70000, 0], places: [
        { fig: 'gulliver', at: [-1087, 87204, 0], facing: Math.PI + 1.2, pose: 'wave-hat' },
        { fig: 's1', at: [1656, 91502, 0], facing: 1.2, pose: 'carry-up' } ], vessels: { ship: { at: [0, 90000, -1500], rot: axisAngleQuat([0, 0, 1], 1.2) } } },
    ],
  },
  {
    id: 'sea',
    name: '難破の海と浜（仮の3D、創作）',
    scenes: ['SC-003'],
    model: {
      reason: '再現（GV1〜GV7）に難破の海とアンテロープ号・小舟の3Dモデルは無い。海面・海底・岩・浜・草地と、船と小舟の形だけの仮の3D（創作）で人物の配置とカメラを決めた。',
      vessels: [
        { id: 'ship', name: 'アンテロープ号（仮の3D、創作）', boxes: shipBoxes() },
        { id: 'boat', name: '小舟（仮の3D、創作）', boxes: boatBoxes() },
      ],
      cad: [
        { id: 'seabed', name: '海底', color: '#6f6450', at: [-100000, -100000, -1450], size: [200000, 106000, 20] },
        { id: 'shallows', name: '浅瀬の底', color: '#8a7d60', at: [-100000, 6000, -420], size: [200000, 14000, 20] },
        { id: 'rock', name: '岩（創作）', color: '#55524c', at: [11500, -43500, -1450], size: [6000, 5000, 3200] },
        { id: 'rock-2', name: '岩（創作）2', color: '#4a4844', at: [16000, -45500, -1450], size: [4000, 3500, 1800] },
        { id: 'water', name: '海面', color: '#3d6f94', at: [-100000, -100000, -12], size: [200000, 120000, 12], opacity: 0.55 },
        { id: 'beach', name: '浜（砂）', color: '#cdbb8e', at: [-100000, 20000, -10], size: [200000, 8000, 10] },
        { id: 'grass', name: '草地（短い草）', color: '#6f8f4a', at: [-100000, 28000, 0], size: [200000, 30000, 12] },
      ],
    },
    actors: [G, sailor('s1', '船員1', 0), sailor('s2', '船員2', 1), sailor('s3', '船員3', 2), sailor('s4', '船員4', 0), sailor('s5', '船員5', 1)],
    crowds: [],
    shots: [
      { panel: 'e01-p05-k1', cam: [-20000, -62000, 2000], look: [3000, -40000, 4000], vessels: { ship: { at: [0, -40000, 0], rot: axisAngleQuat([1, 0, 0], 0.08) } }, places: [
        { fig: 'gulliver', at: [-6000, -40500, 1500], facing: 0.3, pose: 'crouch' },
        { fig: 's1', at: [-3000, -41000, 1500], facing: 2.2, pose: 'fall' },
        { fig: 's2', at: [2000, -39000, 1500], facing: -1.2, pose: 'carry-up' },
        { fig: 's3', at: [10000, -40000, 3000], facing: -1.6, pose: 'fall' },
        { fig: 's4', at: [-10000, -39500, 4000], facing: -Math.PI / 2, pose: 'point' } ] },
      { panel: 'e01-p05-k2', cam: [4000, -42500, 3000], look: [12000, -39500, 2200], vessels: { ship: { at: [0, -40000, 0], rot: axisAngleQuat([1, 0, 0], 0.08) } }, places: [
        { fig: 'gulliver', at: [5000, -39000, 1500], facing: -1.4, pose: 'crouch' },
        { fig: 's3', at: [10500, -40500, 3000], facing: 2.5, pose: 'fall' },
        { fig: 's4', at: [9000, -38800, 3000], facing: -2.0, pose: 'crouch' },
        { fig: 's5', at: [7000, -41500, 1500], facing: -1.0, pose: 'carry-up' } ] },
      { panel: 'e01-p05-k3', cam: [-3500, -31000, 300], look: [-600, -20300, 300], vessels: { boat: { at: [0, -20000, 0], rot: axisAngleQuat([1, 0, 0], 1.1) } }, places: [
        { fig: 'gulliver', at: [-800, -21800, -1560], facing: 0.4, pose: 'tread' },
        { fig: 's1', at: [1000, -21500, 600], facing: 2.0, pose: 'fall' },
        { fig: 's2', at: [1800, -19000, -1560], facing: -0.5, pose: 'tread' },
        { fig: 's3', at: [-1500, -19200, 500], facing: -2.2, pose: 'fall' },
        { fig: 's4', at: [2600, -21000, 0], facing: 0.8, pose: 'swim' },
        { fig: 's5', at: [-2600, -20500, -1560], facing: 1.2, pose: 'tread' } ] },
      { panel: 'e01-p06-k1', cam: [-2400, -2600, 300], look: [0, 0, 50], places: [{ fig: 'gulliver', at: [0, 0, -1560], facing: 0.3, pose: 'tread' }] },
      { panel: 'e01-p06-k2', cam: [-1500, -1100, -700], look: [0, 300, -900], places: [{ fig: 'gulliver', at: [0, 300, -1000], facing: 0.2, pose: 'swim' }] },
      { panel: 'e01-p06-k3', cam: [400, 4200, 600], look: [0, 14000, 900], places: [{ fig: 'gulliver', at: [0, 8800, -410], facing: 0, pose: 'walk' }] },
      { panel: 'e01-p07-k1', cam: [-3800, 26500, 450], look: [0, 30200, 150], places: [{ fig: 'gulliver', at: [0, 30500, 12], facing: 0.15, pose: 'lie' }] },
      { panel: 'e01-p07-k2', cam: [-430, 29640, 30], look: [0, 29800, 140], stand: 'grass', places: [{ fig: 'gulliver', at: [0, 30500, 12], facing: 0, pose: 'lie' }] },
    ],
  },
  {
    id: 'beach',
    name: '浜の草地（リリパット、仮の3D）',
    scenes: ['SC-004', 'SC-001'], // SC-001 opens on the beach (the cover panel looks ahead to SC-004)
    model: {
      reason: '再現（GV1〜GV7）に上陸地点（LO-01・LO-02）の3Dモデルは無い（地図 SM-02 だけ）。草地と演説の台（本文：地面から1フィート半、4人が乗れる）を仮の3D（創作）で作り、人物（F107・F108 の体）の配置とカメラを決めた。',
      cad: [
        { id: 'grass', name: '草地（短い草）', color: '#6f8f4a', at: [-60000, -60000, -12], size: [120000, 120000, 12] },
        { id: 'stage', name: '演説の台（1フィート半）', color: '#8b6b45', at: [300, -820, 0], size: [260, 240, Math.round(1.5 * foot)] },
        { id: 'stake-arm', name: '杭（左腕）', color: '#5a4630', at: [-300, 150, 0], size: [12, 12, 60] },
        { id: 'stake-leg', name: '杭（左脚）', color: '#5a4630', at: [-170, 650, 0], size: [12, 12, 60] },
      ],
    },
    actors: [G, lil('a1', '最初の小人（弓と矢筒）', 0), lil('a2', '胸の小人2', 1), lil('a3', '胸の小人3', 2), lil('a4', '胸の小人4', 3), lil('a5', '胸の小人5', 1),
      lil('cmd', '隊長', 2), lil('b1', '弓兵1', 0), lil('b2', '弓兵2', 1), lil('b3', '弓兵3', 3), lil('b4', '弓兵4', 2), lil('orator', '演説する貴人', 3)],
    crowds: [
      { id: 'body40', name: '体の上の小人（本文：40人ほど）', people: grid(-110, -150, 110, 300, 55, 215, Math.PI, 3) },
      { id: 'ring', name: '周りの群衆', people: [...grid(-1600, -1500, -500, 1400, 180, 0, -Math.PI / 2, 5), ...grid(500, -1500, 1600, 1400, 180, 0, Math.PI / 2, 7)] },
      { id: 'archers', name: '弓隊', people: grid(-1050, -150, -850, 500, 70, 0, -Math.PI / 2, 9) },
    ],
    shots: [], // filled below
  },
  {
    id: 'temple',
    name: '古い神殿（F106）と都の外の道',
    scenes: ['SC-005'],
    model: {
      bim: 'temple',
      cad: [
        { id: 'grass', name: '草地', color: '#6f8f4a', at: [-250000, -250000, -14], size: [500000, 500000, 12] },
        { id: 'road', name: '道（運搬機の通った道）', color: '#a89878', at: [-60000, 39000, -2], size: [57000, 2000, 2] },
        { id: 'deck', name: '運搬機の台（7×4フィート、高さ3インチ）', color: '#8b6b45', at: [-41067, 39390, Math.round(3 * inch)], size: [Math.round(7 * foot), Math.round(4 * foot), Math.round(inch)] },
        ...Array.from({ length: 22 }, (_, i): CadBox => {
          const axle = i % 11,
            side = i < 11 ? -1 : 1;
          return { id: `wheel-${i + 1}`, name: `車輪 ${i + 1}`, color: '#5a4630', at: [-41067 + 60 + axle * 196, 40000 + side * 640, 51], size: [0, 0, 0], cylinder: { r: Math.round(2 * inch), h: 19 } };
        }),
        { id: 'pole', name: '見張りの柱（創作 1,064 mm）', color: '#5a4630', at: [-42600, 37900, 0], size: [60, 60, 1064] },
        { id: 'scaffold', name: '鍛冶の足場（創作 100 mm）', color: '#8b6b45', at: [-250, -620, 0], size: [240, 160, 100] },
        { id: 'balcony', name: '塔の南の見晴らし台（創作、高さ5フィート）', color: '#8b6b45', at: [-500, 5500, Math.round(5 * foot) - 30], size: [1000, 596, 30] },
      ],
    },
    actors: [G, EMPEROR, lil('n1', '貴人1', 0), lil('n2', '貴人2', 1), lil('smith', '王の鍛冶', 2), lil('w1', '見張り', 3)],
    crowds: [
      { id: 'pullers', name: '滑車を引く900人', people: grid(-43500, 37600, -41300, 42400, 110, 0, -Math.PI / 2, 11).slice(0, 900) },
      { id: 'horses', name: '王の馬（本文：高さ4インチ半、1,500頭）', people: [], horses: (() => {
        const out: { at: V3; facing: number; withers: number }[] = [];
        for (let i = 0; i < 1500; i++) out.push({ at: [-38500 + Math.floor(i / 30) * 230, 39000 + (i % 30) * 68, 0], facing: -Math.PI / 2, withers: Math.round(4.5 * inch) });
        return out;
      })() },
      { id: 'mob', name: '神殿の前の群衆（本文：十万人以上のうち）', people: [...grid(-4000, 1850, 4000, 3300, 160, 0, Math.PI, 13), ...grid(1500, -1500, 4500, 1500, 170, 0, Math.PI / 2, 15)] },
    ],
    shots: [],
  },
];

// SC-004 on the beach: Gulliver lies with his hip over the origin, feet toward +y.
const lie = (pose: Pose): Place => ({ fig: 'gulliver', at: [0, 0, 0], facing: 0, pose });
const onChest = (fig: string, x: number, y: number, pose: Pose = 'stand', facing = Math.PI): Place => ({ fig, at: [x, y, 245], facing, pose });
SETS[3]!.shots = [
  // 通読の直し（RV-e01-03、2026-11-14）：小人の目の高さでは胸の上の小人が枠の外だった。小人の後ろの少し上（胸から 300 mm）へ引き、
  // 小人の背中と弓を手前に、ガリヴァーの顔を奥に入れる。
  { panel: 'e01-p01-k1', cam: [-30, 250, 245 + 300], look: [0, -650, 290], stand: 'chest', places: [lie('lie-look'), onChest('a1', 40, -300, 'archer'), onChest('a2', 60, -260), onChest('a3', -90, -230, 'archer'), onChest('a4', 20, -170), onChest('a5', -60, -100)], crowds: ['body40', 'ring'] },
  { panel: 'e01-p08-k1', cam: [-40, -760, 520], look: [-40, -700, 175], places: [lie('lie')], crowds: [] },
  { panel: 'e01-p08-k2', cam: [450, -150, 300], look: [0, -700, 200], places: [lie('lie')], crowds: [] },
  { panel: 'e01-p08-k3', cam: [-700, 450, 136], look: [-236, 150, 120], places: [lie('lie')], crowds: [] },
  { panel: 'e01-p08-k4', cam: [-420, 520, 136], look: [-96, 430, 250], places: [lie('lie'), { fig: 'a1', at: [-96, 430, 190], facing: Math.PI, pose: 'walk' }], crowds: [] },
  { panel: 'e01-p09-k1', cam: [70, -470, 250], look: [0, -720, 210], places: [lie('lie-look'), onChest('a1', -20, -360)], crowds: [] },
  { panel: 'e01-p09-k2', cam: [-10, -120, CHEST_EYE], look: [0, -680, 240], stand: 'chest', places: [lie('lie-look'), onChest('a1', 45, -330, 'archer'), onChest('a2', 60, -260), onChest('a3', -90, -230, 'archer'), onChest('a4', 20, -170), onChest('a5', -60, -100)], crowds: ['body40'] },
  { panel: 'e01-p09-k3', cam: [0, -780, 760], look: [0, -700, 190], places: [lie('lie-look'), onChest('a1', -20, -360, 'archer')], crowds: ['body40'] },
  { panel: 'e01-p10-k1', cam: [460, -260, 136], look: [110, -330, 220], places: [lie('lie'), { fig: 'a1', at: [170, -380, 160], facing: Math.PI, pose: 'fall' }, { fig: 'a2', at: [210, -250, 90], facing: 2.5, pose: 'fall' }, { fig: 'a3', at: [240, -150, 20], facing: 1.2, pose: 'fall' }, onChest('a4', 40, -300, 'dance')], crowds: ['ring'] },
  { panel: 'e01-p10-k2', cam: [-900, -300, 200], look: [-220, -500, 450], places: [lie('lie-arm-free')], crowds: ['ring'] },
  { panel: 'e01-p10-k3', cam: [-1180, 260, 136], look: [-560, 150, 100], places: [lie('lie-arm-free'), { fig: 'cmd', at: [-620, 150, 0], facing: -Math.PI / 2, pose: 'sword-up' }, { fig: 'b1', at: [-780, 40, 0], facing: -Math.PI / 2, pose: 'archer' }, { fig: 'b2', at: [-790, 160, 0], facing: -Math.PI / 2, pose: 'archer' }, { fig: 'b3', at: [-780, 280, 0], facing: -Math.PI / 2, pose: 'archer' }], crowds: ['archers'] },
  { panel: 'e01-p10-k4', cam: [-1000, 100, 136], look: [-220, -500, 500], places: [lie('lie-arm-free'), { fig: 'b1', at: [-780, 40, 0], facing: -Math.PI / 2, pose: 'archer' }, { fig: 'b2', at: [-790, 160, 0], facing: -Math.PI / 2, pose: 'archer' }, { fig: 'b3', at: [-780, 280, 0], facing: -Math.PI / 2, pose: 'archer' }, { fig: 'b4', at: [-800, -80, 0], facing: -Math.PI / 2, pose: 'archer' }], crowds: ['archers'] },
  { panel: 'e01-p11-k1', cam: [-470, 60, 300], look: [-236, 150, 130], places: [lie('lie')], crowds: [] },
  { panel: 'e01-p11-k2', cam: [-460, -760, 300], look: [0, -620, 150], places: [lie('lie')], crowds: ['ring'] },
  { panel: 'e01-p11-k3', cam: [1300, -300, 136], look: [430, -700, 520], places: [lie('lie'), { fig: 'orator', at: [430, -700, Math.round(1.5 * foot)], facing: Math.PI / 2, pose: 'orate' }, { fig: 'a2', at: [380, -780, Math.round(1.5 * foot)], facing: Math.PI / 2, pose: 'stand' }], crowds: ['ring'] },
  { panel: 'e01-p11-k4', cam: [-300, -930, 360], look: [-60, -700, 220], places: [lie('lie-eat')], crowds: [] },
  { panel: 'e01-p11-k5', cam: [520, -330, 136], look: [180, -420, 250], places: [lie('lie'), { fig: 'a2', at: [260, -400, 150], facing: Math.PI / 2, pose: 'carry-up' }, onChest('a3', 120, -420, 'carry-up', Math.PI / 2), onChest('a4', 40, -440, 'carry-up', Math.PI)], crowds: ['ring'] },
  { panel: 'e01-p12-k1', cam: [-260, -860, 260], look: [-80, -700, 220], places: [lie('lie-eat')], crowds: [] },
  { panel: 'e01-p12-k2', cam: [0, -260, CHEST_EYE], look: [0, -660, 200], stand: 'chest', places: [lie('lie-drink'), onChest('a2', 60, -330), onChest('a3', -70, -310)], crowds: [] },
  { panel: 'e01-p12-k3', cam: [70, -60, CHEST_EYE], look: [0, -380, 300], stand: 'chest', places: [lie('lie'), onChest('a1', -40, -330, 'dance'), onChest('a2', 50, -300, 'dance'), onChest('a3', -20, -230, 'dance'), onChest('a4', 60, -190, 'dance'), onChest('a5', -70, -160, 'dance')], crowds: ['body40'] },
  { panel: 'e01-p12-k4', cam: [-560, 120, 420], look: [-80, -300, 250], places: [lie('lie-hand-hover'), onChest('a1', -40, -330, 'dance'), onChest('a2', 50, -300, 'dance'), onChest('a3', -20, -230, 'dance')], crowds: ['body40'] },
  { panel: 'e01-p12-k5', cam: [-40, -760, 520], look: [-40, -700, 175], places: [lie('lie')], crowds: [] },
];
// SC-005: the engine on the road (−41 m, 40 m), then the temple at the origin (its gate north, y = 0).
const onDeck = (pose: Pose): Place => ({ fig: 'gulliver', at: [-40000 + 50, 40000, 105], facing: -Math.PI / 2, pose });
// Inside the temple, feet toward the gate: the left ankle lies just inside the north wall.
const atGate = (pose: Pose): Place => ({ fig: 'gulliver', at: [100, -1300, 0], facing: 0, pose });
const turret = (x: number, y: number) => [x, y - 800, Math.round(5 * foot)] as V3; // on the balcony south of the turret
SETS[4]!.shots = [
  { panel: 'e01-p13-k1', cam: [-39200, 38600, 136], look: [-40300, 40000, 200], places: [onDeck('lie')], crowds: ['pullers'] },
  { panel: 'e01-p13-k2', cam: [-42560, 37940, 1200], look: [-37500, 40000, 0], stand: 'pole', places: [onDeck('lie'), { fig: 'w1', at: [-42570, 37930, 1064], facing: -0.9, pose: 'point' }], crowds: ['pullers', 'horses'] },
  { panel: 'e01-p13-k3', cam: [-40500, 39050, 40], look: [-40700, 39360, 55], places: [onDeck('lie')], crowds: ['pullers'] },
  { panel: 'e01-p14-k1', cam: [3600, 4200, 136], look: [0, 0, 500], places: [atGate('lie')], crowds: ['mob'] },
  { panel: 'e01-p14-k2', cam: [-260, -640, 236], look: [4, -500, 60], stand: 'scaffold', places: [atGate('lie'), { fig: 'smith', at: [-140, -540, 100], facing: -Math.PI / 2, pose: 'crouch' }], crowds: [] },
  { panel: 'e01-p14-k3', cam: [-90, -420, 60], look: [4, -500, 70], places: [atGate('lie')], crowds: [] },
  { panel: 'e01-p15-k1', cam: [400, 3400, 136], look: [-150, 1100, 1250], places: [{ fig: 'gulliver', at: [-150, 1100, 0], facing: 0, pose: 'stand' }], crowds: ['mob'] },
  { panel: 'e01-p15-k2', cam: [2600, 2900, 136], look: [0, 2500, 120], places: [{ fig: 'gulliver', at: [-150, 1100, 0], facing: 0, pose: 'stand' }], crowds: ['mob'] },
  { panel: 'e01-p16-k1', cam: [330, 5980, 1660], look: [-150, 1100, 1100], stand: 'turret', places: [{ fig: 'gulliver', at: [-150, 1100, 0], facing: 0, pose: 'stand' }, { fig: 'emperor', at: turret(0, 6600), facing: Math.PI, pose: 'stand' }, { fig: 'n1', at: turret(-260, 6650), facing: Math.PI, pose: 'stand' }, { fig: 'n2', at: turret(260, 6650), facing: Math.PI, pose: 'stand' }], crowds: ['mob'] },
  { panel: 'e01-p16-k2', cam: [0, 5300, 1660], look: [0, 5800, 1640], stand: 'turret', places: [{ fig: 'emperor', at: turret(0, 6600), facing: Math.PI, pose: 'stand' }, { fig: 'n1', at: turret(-260, 6650), facing: Math.PI, pose: 'stand' }], crowds: [] },
  { panel: 'e01-p16-k3', cam: [400, 5800, 1660], look: [0, 5800, 1640], stand: 'turret', places: [{ fig: 'emperor', at: turret(0, 6600), facing: Math.PI, pose: 'point' }], crowds: [] },
  { panel: 'e01-p16-k4', cam: [182880, 1500, 898], look: [0, 700, 600], stand: 'city-wall', places: [{ fig: 'gulliver', at: [0, 700, 0], facing: 0, pose: 'sit' }], crowds: ['mob'] },
];

// ---------------------------------------------------------------- building the documents
function cadDoc(kernel: { id: string; buildHash: string }, boxes: CadBox[]): CadDocument {
  return applyCadOperation(emptyCad(kernel), {
    type: 'insertFeatures',
    features: boxes.map((b) =>
      b.cylinder
        ? { id: b.id, name: b.name, type: 'cylinder' as const, inputFeatureIds: [], args: { radius: mm(b.cylinder.r), height: mm(b.cylinder.h), origin: position(...b.at), orientation: (b.cylinder.up ? identityQuaternion() : axisAngleQuat([1, 0, 0], Math.PI / 2)) as never } }
        : { id: b.id, name: b.name, type: 'box' as const, inputFeatureIds: [], args: { size: [mm(b.size[0]), mm(b.size[1]), mm(b.size[2])], origin: position(...b.at), orientation: identityQuaternion() } },
    ),
    bodies: boxes.map((b) => ({
      id: `${b.id}-body`,
      name: b.name,
      sourceFeatureId: b.id,
      placementFeatureId: `${b.id}-body-placement`,
      appearance: { color: b.color, opacity: b.opacity ?? 1, roughness: 0.95, metalness: 0 },
    })),
  } as never);
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

const HIDDEN: V3 = [0, 0, -60_000];
const vesselName = (set: SetDef, v: Vessel) => `舞台 ${set.id} ${v.id}`;
function buildSet(set: SetDef, props: CharacterDocument['props']) {
  const doc = emptyCharacter(`第1話 舞台：${set.name}`);
  const assets = new Map<string, Uint8Array>();
  const figs = new Map<string, PlacedFigure>();
  for (const a of set.actors)
    figs.set(a.id, a.horse
      ? addHorse(doc, assets, { prefix: a.id, name: a.name, withersMm: a.height, at: [0, 0, 0], facingRad: 0, coat: a.coat })
      : addFigure(doc, assets, { prefix: a.id, name: a.name, heightMm: a.height, at: [0, 0, 0], facingRad: 0, look: a.look! }));
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
      key(`${part}-t`, { kind: 'part', id: part, property: 'translation' }, tick, (s.crowds ?? []).includes(cid) ? [0, 0, 0] : HIDDEN);
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
    if (set.model.bim === 'temple') {
      await importArtifact(page, 'temple.json', createArtifact('bim', 'F106 古い神殿', f106Temple()));
      await expect(page.getByTestId('bim-model-state')).toHaveText('Model up to date', { timeout: 1_200_000 });
      await save(page, 1);
      propNames.push('F106 古い神殿');
      versions.temple = await nativeArtifact(page);
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
      await importArtifact(page, `${set.id}-${v.id}.json`, { ...e, name, draft: { ...e.draft, content: cadDoc(kernel, v.boxes) } });
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
    }));
  });
}
