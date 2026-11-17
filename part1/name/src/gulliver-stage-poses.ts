// 第3話からの舞台の共通：ポーズ（体の向きの決まり：+y を向き、左が −x、上が +z）と、置いたポーズの骨の位置。
// ep02 の舞台（gulliver-ep02-stage.demo.ts）のポーズを写し、第3話のポーズを足した。posePoint は学び LN-e02-01：
// 主役の頭や手のひらが狙った物（窓・相手・手のひらの上の小人）のそばにあるかを、撮る前に数で確かめる。
import { axisAngleQuat, multiplyQuat, type Quat } from '@editor-platform/character-core';
import { inverseQuat, rotateVec, rotationBetween } from '../../scripts/fixtures/gulliver-people';

export type V3 = [number, number, number];
// ---------------------------------------------------------------- poses (body frame: faces +y, left −x, up +z)
export type Pose =
  | 'stand' | 'walk' | 'wave-hat' | 'hands-together' | 'turn-away' | 'carry-bag'
  | 'lie' | 'lie-look' | 'lie-arm-free' | 'lie-eat' | 'lie-drink' | 'lie-hand-hover'
  | 'swim' | 'tread' | 'sit'
  | 'archer' | 'sword-up' | 'point' | 'orate' | 'fall' | 'dance' | 'carry-up' | 'crouch'
  | 'sit-palm' | 'sit-reach' | 'sit-look-down' | 'jump' | 'hold-stick' | 'arms-crossed' | 'read' | 'oath' | 'step-over' | 'prone-look'
  | 'prone-palm' | 'telescope' | 'wade' | 'tow' | 'kneel' | 'bow' | 'cheer' | 'hands-face' | 'limp' | 'glare' | 'tie' | 'stand-in-water';
type Dirs = Partial<Record<string, V3>>;
export const POSES: Record<Pose, { root?: Quat; hip: number; dirs?: Dirs; head?: Quat }> = {
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
  // 第3話：寝そべって右の手のひらを顔の前の地面に上向きに置き、左の肘で体を起こす（小人を手のひらに載せて話を聞く）。
  'prone-palm': { root: axisAngleQuat([1, 0, 0], -Math.PI / 2 + 0.3), hip: 0.09, dirs: { 'arm.L': [0, 1, 0.2], 'forearm.L': [0.05, 0.2, 0.7], 'arm.R': [0, 1, 0.2], 'forearm.R': [-0.05, 0.2, 0.7] }, head: axisAngleQuat([1, 0, 0], 0.45) },
  // Standing, both hands at the right eye holding a perspective glass (望遠鏡).
  telescope: { hip: 0.53, dirs: { 'arm.L': [0.1, 0.6, 0.5], 'forearm.L': [0.4, 0.6, 0.7], 'arm.R': [0.35, 0.5, 0.4], 'forearm.R': [0.05, 0.9, 0.5] } },
  // Wading: a long stride, the arms out to the sides above the water.
  wade: { hip: 0.53, dirs: { 'thigh.L': [0, 0.45, -1], 'thigh.R': [0, -0.3, -1], 'arm.L': [-0.8, 0.3, 0.2], 'arm.R': [0.8, 0.3, 0.2] } },
  // Towing: leaning forward, the right hand back at the hip holding the knot of cables.
  tow: { root: axisAngleQuat([1, 0, 0], 0.25), hip: 0.52, dirs: { 'thigh.L': [0, 0.45, -1], 'thigh.R': [0, -0.35, -1], 'arm.R': [0.25, -0.6, -0.8], 'forearm.R': [0.1, -0.9, -0.3], 'arm.L': [-0.4, 0.5, -0.6] } },
  // Kneeling on the right knee, the head bowed (receiving the title).
  kneel: { hip: 0.32, dirs: { 'thigh.L': [-0.1, 1, -0.05], 'shin.L': [0, 0, -1], 'thigh.R': [0.1, 0, -1], 'shin.R': [0, -1, -0.05], 'arm.L': [-0.1, 0.4, -1] }, head: axisAngleQuat([1, 0, 0], 0.4) },
  bow: { root: axisAngleQuat([1, 0, 0], 0.5), hip: 0.51, dirs: { 'thigh.L': [0, -0.45, -1], 'thigh.R': [0, -0.45, -1], 'arm.R': [0.2, 0.5, -1] } },
  cheer: { hip: 0.53, dirs: { 'arm.L': [-0.35, 0.1, 1], 'arm.R': [0.35, 0.1, 1] } },
  // The hands over the face (arrows).
  'hands-face': { hip: 0.53, dirs: { 'arm.L': [-0.3, 0.7, 0.2], 'forearm.L': [0.4, 0.3, 1], 'arm.R': [0.3, 0.7, 0.2], 'forearm.R': [-0.4, 0.3, 1] }, head: axisAngleQuat([1, 0, 0], 0.25) },
  // A limping walk: one leg straight, the body leaning.
  limp: { root: axisAngleQuat([0, 1, 0], 0.15), hip: 0.53, dirs: { 'thigh.L': [0, 0.3, -1], 'thigh.R': [0.05, -0.15, -1], 'arm.L': [-0.5, 0, -0.8] } },
  glare: { hip: 0.53, dirs: { 'arm.L': [-0.25, 0.3, -1], 'arm.R': [0.25, 0.3, -1], 'forearm.L': [0.9, 0.35, 0.1], 'forearm.R': [-0.9, 0.4, 0.15] }, head: axisAngleQuat([1, 0, 0], -0.15) },
  // Standing in the water, both hands low in front (hooking a ship, cutting a cable).
  tie: { root: axisAngleQuat([1, 0, 0], 0.35), hip: 0.53, dirs: { 'arm.L': [-0.2, 0.8, -0.6], 'arm.R': [0.2, 0.8, -0.6], 'forearm.L': [0.2, 1, -0.2], 'forearm.R': [-0.2, 1, -0.2] }, head: axisAngleQuat([1, 0, 0], 0.4) },
  'stand-in-water': { hip: 0.53, dirs: { 'arm.L': [-0.5, 0.2, -0.6], 'arm.R': [0.5, 0.2, -0.6] } },
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
export function poseRotations(pose: Pose) {
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


// ---------------------------------------------------------------- where a placed pose puts its bones (LN-e02-01)
/** Joints as fractions of the height (the F107/F108 body plan in gulliver-people.ts). */
const JOINT: Record<string, [string | null, number, number]> = {
  hip: [null, 0, 0.53], spine: ['hip', 0, 0.62], head: ['spine', 0, 0.855],
  'arm.L': ['spine', -0.12, 0.815], 'forearm.L': ['arm.L', -0.13, 0.64], 'hand.L': ['forearm.L', -0.135, 0.475],
  'arm.R': ['spine', 0.12, 0.815], 'forearm.R': ['arm.R', 0.13, 0.64], 'hand.R': ['forearm.R', 0.135, 0.475],
  'thigh.L': ['hip', -0.055, 0.51], 'shin.L': ['thigh.L', -0.055, 0.285], 'foot.L': ['shin.L', -0.055, 0.045],
  'thigh.R': ['hip', 0.055, 0.51], 'shin.R': ['thigh.R', 0.055, 0.285], 'foot.R': ['shin.R', 0.055, 0.045],
};
/** Points on a bone in its rest frame, as fractions of the height from the joint: the head's centre, the palm. */
export const BONE_POINT = { head: ['head', [0, 0.005, 0.075]], eye: ['head', [0, 0.05, 0.08]], 'palm.R': ['hand.R', [0, 0, -0.035]], 'palm.L': ['hand.L', [0, 0, -0.035]], 'elbow.R': ['forearm.R', [0, 0, 0]], 'elbow.L': ['forearm.L', [0, 0, 0]], 'foot.L': ['foot.L', [0, 0.03, -0.02]], 'foot.R': ['foot.R', [0, 0.03, -0.02]] } as const;
/** The world point of `point` on a figure of height `h` placed `at` facing `facing` in `pose` (the same keys the stage writes). */
export function posePoint(pose: Pose, at: V3, facing: number, h: number, point: keyof typeof BONE_POINT): V3 {
  const p = POSES[pose];
  const local = poseRotations(pose);
  const rootRot = multiplyQuat(axisAngleQuat([0, 0, 1], facing), p.root ?? [0, 0, 0, 1]);
  const world = new Map<string, { pos: V3; rot: Quat }>();
  const solve = (b: string): { pos: V3; rot: Quat } => {
    const got = world.get(b);
    if (got) return got;
    const [parent, x, z] = JOINT[b]!;
    let out: { pos: V3; rot: Quat };
    if (!parent) out = { pos: [at[0], at[1], at[2] + p.hip * h], rot: rootRot };
    else {
      const pw = solve(parent);
      const [, px, pz] = JOINT[parent]!;
      const off = rotateVec(pw.rot, [(x - px) * h, 0, (z - pz) * h]) as V3;
      out = { pos: [pw.pos[0] + off[0], pw.pos[1] + off[1], pw.pos[2] + off[2]], rot: multiplyQuat(pw.rot, (local[b] as Quat | undefined) ?? [0, 0, 0, 1]) };
    }
    world.set(b, out);
    return out;
  };
  const [bone, o] = BONE_POINT[point];
  const w = solve(bone);
  const d = rotateVec(w.rot, [o[0] * h, o[1] * h, o[2] * h]) as V3;
  return [Math.round(w.pos[0] + d[0]), Math.round(w.pos[1] + d[1]), Math.round(w.pos[2] + d[2])];
}
