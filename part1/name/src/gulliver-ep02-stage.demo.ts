// ネーム 第2話の舞台（never committed to editor-platform; kept in gulliver-manga part1/name/src/).
// Stages every panel of episode 2 on the digital twin: the people (F107/F108 body plan) are rigged
// figures in one character document per set, the places are props (F106 the temple and F105 Mildendo
// as BIM versions; the ground, the rope, the council chamber, the hill and the stools as CAD versions). Each panel is one
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
  | 'archer' | 'sword-up' | 'point' | 'orate' | 'fall' | 'dance' | 'carry-up' | 'crouch'
  | 'sit-palm' | 'sit-reach' | 'sit-look-down' | 'jump' | 'hold-stick' | 'arms-crossed' | 'read' | 'oath' | 'step-over' | 'prone-look';
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
  // Sitting on the ground, the right hand held out palm up in front (the court's tricks on his hand).
  'sit-palm': { hip: 0.08, dirs: { 'thigh.L': [-0.15, 1, 0.05], 'thigh.R': [0.15, 1, 0.05], 'shin.L': [-0.1, 0.25, -1], 'shin.R': [0.1, 0.25, -1], 'arm.L': [-0.2, 0.4, -1], 'arm.R': [0.15, 1, -0.35], 'forearm.R': [0, 1, 0.05] }, head: axisAngleQuat([1, 0, 0], 0.35) },
  // Sitting, leaning to catch with the right hand low in front.
  'sit-reach': { root: axisAngleQuat([1, 0, 0], 0.35), hip: 0.08, dirs: { 'thigh.L': [-0.15, 1, 0.05], 'thigh.R': [0.15, 1, 0.05], 'shin.L': [-0.1, 0.25, -1], 'shin.R': [0.1, 0.25, -1], 'arm.L': [-0.2, 0.4, -1], 'arm.R': [0.1, 1, -0.55], 'forearm.R': [0, 1, -0.35] }, head: axisAngleQuat([1, 0, 0], 0.4) },
  'sit-look-down': { hip: 0.08, dirs: { 'thigh.L': [-0.15, 1, 0.05], 'thigh.R': [0.15, 1, 0.05], 'shin.L': [-0.1, 0.25, -1], 'shin.R': [0.1, 0.25, -1], 'arm.L': [-0.2, 0.4, -1], 'arm.R': [0.2, 0.4, -1] }, head: axisAngleQuat([1, 0, 0], 0.5) },
  jump: { hip: 0.5, dirs: { 'thigh.L': [0, 0.5, -0.8], 'shin.L': [0, -0.6, -0.8], 'thigh.R': [0, 0.2, -1], 'arm.L': [-0.6, 0, 0.8], 'arm.R': [0.6, 0, 0.8] } },
  'hold-stick': { hip: 0.53, dirs: { 'arm.L': [-0.3, 0.8, -0.2], 'arm.R': [0.3, 0.8, -0.2], 'forearm.L': [0.2, 1, 0], 'forearm.R': [-0.2, 1, 0] } },
  'arms-crossed': { hip: 0.53, dirs: { 'arm.L': [-0.25, 0.3, -1], 'arm.R': [0.25, 0.3, -1], 'forearm.L': [0.9, 0.35, 0.1], 'forearm.R': [-0.9, 0.4, 0.15] } },
  read: { hip: 0.53, dirs: { 'arm.L': [-0.2, 0.6, -0.6], 'arm.R': [0.2, 0.6, -0.6], 'forearm.L': [-0.1, 1, 0.5], 'forearm.R': [0.1, 1, 0.5] } },
  // The Lilliputian oath (本文): the right foot held in the left hand, the right middle finger on the crown, the thumb on the tip of the right ear.
  oath: { hip: 0.53, dirs: { 'thigh.R': [0.1, 0.5, -0.6], 'shin.R': [-0.3, -0.8, -0.4], 'arm.L': [0.25, 0.1, -1], 'forearm.L': [0.6, -0.3, -0.5], 'arm.R': [0.6, 0, 0.6], 'forearm.R': [-0.7, 0, 0.7] } },
  // A long stride over a building: the left leg forward and high.
  'step-over': { hip: 0.53, dirs: { 'thigh.L': [0, 1, -0.25], 'shin.L': [0, 0.3, -1], 'thigh.R': [0, -0.45, -1], 'arm.L': [-0.5, 0, -0.8], 'arm.R': [0.5, 0, -0.8] } },
  // Lying face down, propped on the elbows, the head up and looking ahead (+y at facing 0).
  'prone-look': { root: axisAngleQuat([1, 0, 0], -Math.PI / 2), hip: 0.09, dirs: { 'arm.L': [-0.25, 1, 0.15], 'arm.R': [0.25, 1, 0.15], 'forearm.L': [0.1, 0.1, 1], 'forearm.R': [-0.1, 0.1, 1] }, head: axisAngleQuat([1, 0, 0], -1.0) },
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
type Who = 'CH-01' | 'CH-02' | 'CH-03' | 'CH-04' | 'CH-06' | 'CH-30' | 'EX';
/** A figure in a panel: `at` is its ground point (standing) or the ground point under its hip (lying). */
type Place = { fig: string; at: V3; facing: number; pose: Pose; note?: string };
/** A movable model (unused in episode 2; kept for the shared build code). */
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
  actors: Actor[];
  crowds: Crowd[];
  shots: Shot[];
};
type CadBox = { id: string; name: string; color: string; at: V3; size: V3; cylinder?: { r: number; h: number; up?: boolean }; opacity?: number };

const G: Actor = { id: 'gulliver', who: 'CH-01', name: 'ガリヴァー', height: H, look: gulliverLook };
// SC-008: he walks the city in his short waistcoat (本文: the coat's skirts would damage the roofs).
const G_WAISTCOAT: Actor = { ...G, look: { ...gulliverLook, coat: '#b49a6a' } };
const lil = (id: string, name: string, i: number, who: Who = 'CH-30'): Actor => ({ id, who, name, height: h, look: lilliputLooks[i % lilliputLooks.length] });
const EMPEROR: Actor = { id: 'emperor', who: 'CH-02', name: '皇帝', height: 158, look: { coat: '#2f5a3a', breeches: '#2f5a3a', stockings: '#efe7d6', shoes: '#2b2622', skin: '#e9c4a0', hair: '#2a2018' } };
const EMPRESS: Actor = { id: 'empress', who: 'CH-03', name: '皇后', height: 140, look: { coat: '#6d8fb3', breeches: '#6d8fb3', stockings: '#6d8fb3', shoes: '#e8e2d2', skin: '#efd0b0', hair: '#3a2a1a' } };
const FLIMNAP: Actor = { id: 'flimnap', who: 'CH-04', name: 'フリムナップ', height: 156, look: { coat: '#2f3a4a', breeches: '#2f3a4a', stockings: '#d8d0bd', shoes: '#2b2622', skin: '#e0bc98', hair: '#d9d4c8' } };
const BOLGOLAM: Actor = { id: 'bolgolam', who: 'CH-06', name: 'ボルゴラム', height: 148, look: { coat: '#4a3b2a', breeches: '#3a3028', stockings: '#9a9078', shoes: '#2b2622', skin: '#d8b08a', hair: '#1f1a14' } };

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

// SC-006/SC-007 at the temple (F106, its north wall on y = 0, the gate in its middle): Gulliver sits
// just outside the gate facing north; the rope is 12 inches up, 1.6 m north of the gate (創作の配置).
const ROPE_Y = 1600;
const ROPE_Z = Math.round(12 * inch);
const SEAT: V3 = [0, 700, 0];
const sit = (pose: Pose = 'sit'): Place => ({ fig: 'gulliver', at: SEAT, facing: 0, pose });
const PALM: V3 = [180, 1290, 600]; // the right palm of 'sit-palm' (measured on the F107 body; checked in the view)
const onPalm = (fig: string, dx: number, dy: number, pose: Pose = 'dance', facing = Math.PI / 2): Place => ({ fig, at: [PALM[0] + dx, PALM[1] + dy, PALM[2]], facing, pose });
const onRope = (fig: string, x: number, pose: Pose = 'dance', z = ROPE_Z): Place => ({ fig, at: [x, ROPE_Y, z], facing: Math.PI / 2, pose });
const EMP_SEAT: Place = { fig: 'emperor', at: [800, ROPE_Y + 50, 0], facing: Math.PI / 2, pose: 'stand' };
const STAND_OATH: V3 = [0, 900, 0];

// SC-008 in Mildendo (F105, centred on the origin, the great streets on the axes, the wall at ±76.2 m).
const WALL_X = -Math.round(250 * foot);
const STOOL = Math.round(5 * foot);
// The royal apartments (F105 pal-royal, 10 ft square at the centre): their south wall at y = −1,524 mm has 4 × 6 in
// windows, the lower west one centred at x ≈ −762 mm (sill 457 mm). Gulliver lies outside to the south with his head
// at that window; the window dais (創作) stands inside the wall.
// `at` is the feet: the prone root turns the body to lie along +y, so the feet sit about 1.8 m south of the head.
const PRONE: Place = { fig: 'gulliver', at: [-762, -3450, 0], facing: 0, pose: 'prone-look' };

const SETS: SetDef[] = [
  {
    id: 'court',
    name: '古い神殿（F106）の前の広場：宮廷の芸と解放の誓い',
    scenes: ['SC-006', 'SC-007'],
    model: {
      bim: 'temple',
      cad: [
        { id: 'grass', name: '草地', color: '#6f8f4a', at: [-250000, -250000, -14], size: [500000, 500000, 12] },
        { id: 'post-w', name: '糸を張る柱（西、創作）', color: '#5a4630', at: [-420, ROPE_Y - 6, 0], size: [12, 12, ROPE_Z + 20] },
        { id: 'post-e', name: '糸を張る柱（東、創作）', color: '#5a4630', at: [408, ROPE_Y - 6, 0], size: [12, 12, ROPE_Z + 20] },
        { id: 'rope', name: '細い糸（本文：地上12インチ、長さ2フィート）', color: '#efe7d6', at: [-408, ROPE_Y - 1, ROPE_Z - 1], size: [816, 3, 3] },
        { id: 'stick', name: '皇帝の棒（創作：長さ 300 mm）', color: '#3a2a1a', at: [250, 1950 - 2, 95], size: [300, 4, 4] },
      ],
    },
    actors: [G, EMPEROR, FLIMNAP, BOLGOLAM, lil('d1', '廷臣1', 0), lil('d2', '廷臣2', 1), lil('d3', '廷臣3', 2), lil('d4', '廷臣4', 3), lil('b1', 'ボルゴラムの従者1', 0), lil('b2', 'ボルゴラムの従者2', 2)],
    crowds: [
      { id: 'court', name: '見物の宮廷（創作の人数）', people: [...grid(-1500, 1900, -600, 2700, 150, 0, Math.PI, 31), ...grid(600, 2100, 1500, 2700, 150, 0, Math.PI, 33)] },
      { id: 'mob', name: '広場の端の民（創作の人数）', people: [...grid(-4000, 4600, 4000, 5300, 170, 0, Math.PI, 35)] },
    ],
    shots: [
      { panel: 'e02-p01-k1', cam: [1500, 2700, 136], look: [120, 950, 720], places: [sit('sit-palm'), onPalm('d1', -30, -10), onPalm('d2', 25, 15, 'jump'), onPalm('d3', 0, 40, 'wave-hat'), EMP_SEAT], crowds: ['court'] },
      { panel: 'e02-p01-k2', cam: [3600, 4300, 136], look: [0, 1200, 500], places: [sit('sit-palm'), onPalm('d1', -30, -10), onPalm('d2', 25, 15, 'jump'), EMP_SEAT], crowds: ['court', 'mob'] },
      { panel: 'e02-p02-k1', cam: [-120, 2350, 136], look: [0, 700, 560], places: [sit('sit-look-down'), onRope('d1', -150), onRope('d2', 120, 'jump', ROPE_Z + 60), EMP_SEAT], crowds: ['court'] },
      { panel: 'e02-p02-k2', cam: [1350, ROPE_Y + 120, 136], look: [0, 1200, 450], places: [sit('sit-look-down'), onRope('d1', -150), onRope('d2', 120, 'jump', ROPE_Z + 60), EMP_SEAT], crowds: ['court'] },
      { panel: 'e02-p02-k3', cam: [-80, ROPE_Y + 160, 300], look: [-20, ROPE_Y, ROPE_Z], places: [onRope('d1', -20)] },
      { panel: 'e02-p02-k4', cam: [0, 880, 950], look: [0, ROPE_Y, ROPE_Z], places: [onRope('d1', -150), onRope('d2', 120, 'jump', ROPE_Z + 60), EMP_SEAT], crowds: ['court'] },
      { panel: 'e02-p03-k1', cam: [-260, ROPE_Y + 170, 136], look: [0, ROPE_Y, 520], places: [{ ...onRope('flimnap', 0, 'jump', ROPE_Z + 180) }, onRope('d1', -260)], crowds: ['court'] },
      { panel: 'e02-p03-k2', cam: [-950, 2950, 136], look: [-300, ROPE_Y, 350], places: [{ fig: 'd3', at: [-800, 2300, 0], facing: Math.PI, pose: 'wave-hat' }, { fig: 'd4', at: [-650, 2400, 0], facing: Math.PI, pose: 'wave-hat' }, onRope('flimnap', 0, 'stand')], crowds: ['court'] },
      { panel: 'e02-p03-k3', cam: [40, 2480, 136], look: [0, 2150, 135], places: [{ fig: 'flimnap', at: [0, 2150, 0], facing: 0, pose: 'stand' }] },
      { panel: 'e02-p04-k1', cam: [-520, 1950, 136], look: [200, 1500, 260], places: [sit('sit-reach'), { fig: 'd2', at: [220, ROPE_Y - 40, 200], facing: Math.PI / 2, pose: 'fall' }, onRope('d1', -200)], crowds: ['court'] },
      { panel: 'e02-p04-k2', cam: [120, 1450, 950], look: [0, 700, 900], places: [sit('sit-reach')] },
      { panel: 'e02-p04-k3', cam: [520, 1750, 250], look: [230, 1520, 230], places: [sit('sit-reach'), { fig: 'd2', at: [230, 1520, 190], facing: Math.PI / 2, pose: 'crouch' }] },
      { panel: 'e02-p04-k4', cam: [1050, 2350, 136], look: [400, 1950, 100], places: [{ fig: 'emperor', at: [250, 2120, 0], facing: Math.PI, pose: 'hold-stick' }, { fig: 'd3', at: [400, 1950, 110], facing: Math.PI / 2, pose: 'jump' }, { fig: 'd4', at: [480, 1930, 0], facing: Math.PI / 2, pose: 'crouch' }], crowds: ['court'] },
      { panel: 'e02-p05-k1', cam: [380, ROPE_Y + 60, 136], look: [800, ROPE_Y + 50, 140], places: [{ ...EMP_SEAT, pose: 'carry-up' }] },
      { panel: 'e02-p05-k2', cam: [-260, 1830, 136], look: [-260, 2150, 70], places: [{ fig: 'd1', at: [-330, 2150, 0], facing: Math.PI, pose: 'stand' }, { fig: 'd3', at: [-200, 2170, 0], facing: Math.PI, pose: 'stand' }, { fig: 'flimnap', at: [-460, 2140, 0], facing: Math.PI, pose: 'stand' }] },
      { panel: 'e02-p05-k3', cam: [3600, 4300, 136], look: [0, 1200, 500], places: [sit('sit-look-down'), onRope('d1', -150), EMP_SEAT], crowds: ['court', 'mob'] },
      // SC-007 at the temple: Bolgolam reads the articles; the oath; the chain comes off.
      { panel: 'e02-p07-k4', cam: [2250, 2700, 136], look: [0, 1200, 500], places: [sit('sit-look-down'), { fig: 'bolgolam', at: [-200, ROPE_Y, 0], facing: Math.PI, pose: 'read' }, { fig: 'b1', at: [-50, 1750, 0], facing: Math.PI, pose: 'stand' }, { fig: 'b2', at: [-350, 1760, 0], facing: Math.PI, pose: 'stand' }], crowds: ['court'] },
      { panel: 'e02-p08-k1', cam: [-600, 2500, 136], look: [-120, 900, 380], places: [sit('sit-look-down'), { fig: 'bolgolam', at: [-200, ROPE_Y, 0], facing: Math.PI, pose: 'read' }] },
      { panel: 'e02-p08-k2', cam: [-200, 1430, 136], look: [-170, ROPE_Y, 120], places: [sit('sit-look-down'), { fig: 'bolgolam', at: [-200, ROPE_Y, 0], facing: Math.PI, pose: 'read' }] },
      { panel: 'e02-p08-k3', cam: [-470, 1580, 136], look: [-200, ROPE_Y - 40, 120], places: [{ fig: 'bolgolam', at: [-200, ROPE_Y, 0], facing: Math.PI, pose: 'read' }, { fig: 'b1', at: [-50, 1750, 0], facing: Math.PI, pose: 'stand' }] },
      { panel: 'e02-p08-k4', cam: [0, 880, 950], look: [-200, ROPE_Y, 80], places: [{ fig: 'bolgolam', at: [-200, ROPE_Y, 0], facing: Math.PI, pose: 'read' }, { fig: 'b1', at: [-50, 1750, 0], facing: Math.PI, pose: 'stand' }, { fig: 'b2', at: [-350, 1760, 0], facing: Math.PI, pose: 'stand' }] },
      { panel: 'e02-p09-k1', cam: [700, 4000, 136], look: [0, 900, 950], places: [{ fig: 'gulliver', at: STAND_OATH, facing: 0, pose: 'oath' }, { fig: 'bolgolam', at: [-200, 1900, 0], facing: Math.PI, pose: 'stand' }], crowds: ['court'] },
      { panel: 'e02-p09-k2', cam: [160, 1350, 136], look: [0, 900, 1500], places: [{ fig: 'gulliver', at: STAND_OATH, facing: 0, pose: 'oath' }] },
      { panel: 'e02-p09-k3', cam: [1250, 2250, 136], look: [800, 2250, 110], places: [{ fig: 'd3', at: [850, 2300, 0], facing: Math.PI, pose: 'hands-together' }, { fig: 'd4', at: [720, 2350, 0], facing: Math.PI, pose: 'turn-away' }], crowds: ['court'] },
      { panel: 'e02-p10-k1', cam: [-360, 1060, 60], look: [-110, 920, 50], places: [{ fig: 'gulliver', at: STAND_OATH, facing: 0, pose: 'stand' }] },
      { panel: 'e02-p10-k2', cam: [-520, 1250, 136], look: [-300, 2200, 100], places: [{ fig: 'gulliver', at: STAND_OATH, facing: 0, pose: 'stand' }, { fig: 'bolgolam', at: [-260, 2200, 0], facing: 0, pose: 'walk' }] },
      { panel: 'e02-p10-k3', cam: [-260, 2560, 136], look: [-260, 2200, 125], places: [{ fig: 'bolgolam', at: [-260, 2200, 0], facing: 0, pose: 'walk' }] },
    ],
  },
  {
    id: 'council',
    name: '王宮の評議の間（仮の3D、創作）',
    scenes: ['SC-007'],
    model: {
      reason: '再現（GV1〜GV7）の王宮（F105）に部屋の中は無い。床・壁・長い卓・玉座だけの仮の3D（創作、小人の大きさ）で人物の配置とカメラを決めた。',
      cad: [
        { id: 'floor', name: '床', color: '#8a6b4a', at: [-620, -420, -6], size: [1240, 840, 6] },
        { id: 'wall-n', name: '北の壁', color: '#cbbfa6', at: [-620, 420, 0], size: [1240, 20, 420] },
        { id: 'wall-s', name: '南の壁', color: '#cbbfa6', at: [-620, -440, 0], size: [1240, 20, 420] },
        { id: 'wall-w', name: '西の壁（玉座の後ろ）', color: '#b8a98c', at: [-640, -440, 0], size: [20, 880, 420] },
        { id: 'wall-e1', name: '東の壁', color: '#cbbfa6', at: [620, -440, 0], size: [20, 360, 420] },
        { id: 'wall-e2', name: '東の壁（入口の北）', color: '#cbbfa6', at: [620, 80, 0], size: [20, 360, 420] },
        { id: 'table', name: '長い卓', color: '#6b4a2e', at: [-300, -60, 0], size: [600, 120, 60] },
        { id: 'throne', name: '玉座', color: '#8c2f39', at: [-580, -50, 0], size: [60, 100, 110] },
      ],
    },
    actors: [EMPEROR, FLIMNAP, BOLGOLAM, lil('m1', '大臣1', 0), lil('m2', '大臣2', 1), lil('m3', '大臣3', 2), lil('m4', '大臣4', 3)],
    crowds: [],
    shots: [], // filled below
  },
  {
    id: 'city',
    name: '都ミルデンドウ（F105）と王宮',
    scenes: ['SC-008'],
    model: {
      bim: 'mildendo',
      cad: [
        { id: 'ground', name: '都の外の地面', color: '#7a8f55', at: [-200000, -200000, -14], size: [400000, 400000, 12] },
        { id: 'hill', name: '都の西の丘（創作：高さ 3,000 mm）', color: '#6f8a4e', at: [-103500, -4000, 0], size: [6000, 8000, 3000] },
        { id: 'stool-a', name: '腰掛け1（本文：高さ5フィート）', color: '#8b6b45', at: [-300, -14600, 0], size: [600, 600, STOOL] },
        { id: 'stool-b', name: '腰掛け2（本文：高さ5フィート、外庭と二の庭の間の8フィートの庭）', color: '#8b6b45', at: [-300, -5300, 0], size: [600, 600, STOOL] },
        { id: 'dais', name: '窓辺の壇（創作：250 mm、王の住まいの南の壁の内側）', color: '#8c2f39', at: [-1300, -1500, 0], size: [800, 260, 250] },
      ],
    },
    actors: [G_WAISTCOAT, EMPRESS, lil('pr1', '若い王子1', 1), lil('pr2', '若い王子2', 2), lil('w1', '城壁の見張り', 3)],
    crowds: [
      { id: 'street', name: '大通りの民（創作の人数）', people: [...grid(-61500, -700, -58500, -500, 160, 0, 0, 41), ...grid(-61500, 500, -58500, 700, 160, 0, Math.PI, 43)] },
      { id: 'roofs', name: '屋根と窓の見物人（創作の人数）', people: [...grid(-66000, -1700, -57000, -1500, 300, 760, 0, 45), ...grid(-66000, 1500, -57000, 1700, 300, 760, Math.PI, 47)] },
      { id: 'wallway', name: '城壁の内側の道の民（創作の人数）', people: grid(-75600, 6500, -75000, 9500, 200, 0, -Math.PI / 2, 49) },
    ],
    shots: [
      { panel: 'e02-p11-k1', cam: [-97700, 0, 3136], look: [-80500, 0, 700], stand: 'hill', places: [{ fig: 'gulliver', at: [-80500, 0, 0], facing: -Math.PI / 2, pose: 'stand' }] },
      { panel: 'e02-p11-k2', cam: [WALL_X, 2300, 898], look: [-76600, 300, 1090], stand: 'city-wall', places: [{ fig: 'gulliver', at: [-77000, 300, 0], facing: -Math.PI / 2, pose: 'walk' }, { fig: 'w1', at: [WALL_X, 1500, 762], facing: Math.PI / 2, pose: 'point' }] },
      { panel: 'e02-p12-k1', cam: [-59000, 600, 136], look: [-62500, 0, 120], places: [{ fig: 'gulliver', at: [-63500, 0, 0], facing: 0, pose: 'walk' }], crowds: ['street'] },
      { panel: 'e02-p12-k2', cam: [-54500, 0, 136], look: [-62000, 0, 900], places: [{ fig: 'gulliver', at: [-62000, 0, 0], facing: 0, pose: 'walk' }], crowds: ['roofs'] },
      { panel: 'e02-p12-k3', cam: [-62300, 1300, 886], look: [-62000, 0, 650], stand: 'roof', places: [{ fig: 'gulliver', at: [-62000, 0, 0], facing: 0, pose: 'walk' }], crowds: ['roofs'] },
      { panel: 'e02-p13-k1', cam: [-74300, 6400, 136], look: [WALL_X, 8000, 1000], places: [{ fig: 'gulliver', at: [WALL_X, 8000, 0], facing: -Math.PI / 2, pose: 'step-over' }], crowds: ['wallway'] },
      { panel: 'e02-p13-k2', cam: [-74600, 7350, 136], look: [-75500, 8000, 60], places: [{ fig: 'gulliver', at: [WALL_X, 8000, 0], facing: -Math.PI / 2, pose: 'step-over' }], crowds: ['wallway'] },
      { panel: 'e02-p14-k1', cam: [1600, -18288, 746], look: [0, 0, 500], stand: 'palace-wall', places: [] },
      { panel: 'e02-p14-k2', cam: [2600, -5600, 136], look: [0, -4300, 2200], places: [{ fig: 'gulliver', at: [0, -5000, STOOL], facing: 0, pose: 'step-over' }] },
      { panel: 'e02-p15-k1', cam: [-150, -150, 386], look: [-762, -1524, 204], stand: 'dais', places: [PRONE, { fig: 'empress', at: [-1050, -1330, 250], facing: Math.PI, pose: 'point' }, { fig: 'pr1', at: [-560, -1100, 0], facing: Math.PI, pose: 'fall' }, { fig: 'pr2', at: [-420, -1000, 0], facing: Math.PI, pose: 'point' }] },
      { panel: 'e02-p15-k2', cam: [-1050, -1470, 386], look: [-1050, -1330, 370], stand: 'dais', places: [PRONE, { fig: 'empress', at: [-1050, -1330, 250], facing: Math.PI, pose: 'point' }] },
      { panel: 'e02-p15-k3', cam: [-762, 900, 386], look: [-762, -1524, 500], stand: 'dais', places: [PRONE, { fig: 'empress', at: [-1050, -1330, 250], facing: Math.PI, pose: 'point' }, { fig: 'pr1', at: [-560, -1100, 0], facing: Math.PI, pose: 'stand' }] },
      { panel: 'e02-p16-k1', cam: [-380, -1120, 386], look: [-840, -1480, 430], stand: 'dais', places: [PRONE, { fig: 'empress', at: [-880, -1400, 250], facing: Math.PI, pose: 'point' }] },
      { panel: 'e02-p16-k2', cam: [1400, -3600, 136], look: [-762, -2600, 330], places: [PRONE] },
    ],
  },
];

// SC-007 in the council chamber: the throne at the west end, ministers along the table.
SETS[1]!.shots = [
  { panel: 'e02-p06-k1', cam: [580, 0, 136], look: [-300, 0, 80], places: council() },
  { panel: 'e02-p06-k2', cam: [250, 0, 136], look: [-450, 0, 320], places: council() },
  { panel: 'e02-p06-k3', cam: [120, 210, 136], look: [100, -110, 110], places: council() },
  { panel: 'e02-p06-k4', cam: [100, 40, 136], look: [100, -110, 115], places: council() },
  { panel: 'e02-p07-k1', cam: [-100, -40, 136], look: [-100, 110, 115], places: council() },
  { panel: 'e02-p07-k2', cam: [-300, 0, 136], look: [-450, 0, 140], places: council() },
  { panel: 'e02-p07-k3', cam: [-120, 0, 136], look: [-450, 0, 110], places: council(true) },
];
function council(standing = false): Place[] {
  return [
    { fig: 'emperor', at: [-480, 0, 0], facing: -Math.PI / 2, pose: standing ? 'orate' : 'stand' },
    { fig: 'bolgolam', at: [100, -110, 0], facing: 0, pose: 'arms-crossed' },
    { fig: 'flimnap', at: [-100, 110, 0], facing: Math.PI, pose: 'read' },
    { fig: 'm1', at: [-200, -110, 0], facing: 0, pose: 'stand' },
    { fig: 'm2', at: [200, 110, 0], facing: Math.PI, pose: 'stand' },
    { fig: 'm3', at: [-250, 110, 0], facing: Math.PI, pose: 'stand' },
    { fig: 'm4', at: [250, -110, 0], facing: 0, pose: 'stand' },
  ];
}

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
  const doc = emptyCharacter(`第2話 舞台：${set.name}`);
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
    }));
  });
}
