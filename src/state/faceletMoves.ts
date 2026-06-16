/* ----------------------------------------------------------------------------
   Facelet move engine.

   Applies cube moves to a FaceletState by modelling each sticker as a point in
   3D space (a centered integer coordinate + an outward normal) and rotating the
   affected layer. This is systematic — no hand-listed sticker cycles — and
   generalizes from 3×3 to NxN (inner/wide layers) by widening the layer test.

   Coordinate frame: x→R, y→U, z→F. A cell index v ∈ [0, N) maps to the centered
   integer 2v−(N−1), so coordinates are symmetric about the origin and rotations
   map integers to integers.

   Face turns are clockwise viewed from outside that face (standard notation).
   The rotation maps below were derived from the right-hand rule and spot-checked:
   R sends F→U and U→B; U sends F→L.
---------------------------------------------------------------------------- */

import { FACES, type Face, type FaceletState } from './facelets';

type Vec3 = readonly [number, number, number];
type Rot = (v: Vec3) => Vec3;

// Quarter-turn rotations, clockwise viewed from the +axis side, and inverses.
const ROT = {
  x: ([x, y, z]: Vec3): Vec3 => [x, z, -y],
  xi: ([x, y, z]: Vec3): Vec3 => [x, -z, y],
  y: ([x, y, z]: Vec3): Vec3 => [-z, y, x],
  yi: ([x, y, z]: Vec3): Vec3 => [z, y, -x],
  z: ([x, y, z]: Vec3): Vec3 => [y, -x, z],
  zi: ([x, y, z]: Vec3): Vec3 => [-y, x, z],
} as const;

interface FaceTurn {
  rot: Rot;
  axis: 0 | 1 | 2; // which coordinate selects the layer
  sign: 1 | -1; // outer layer is at sign*(N-1)
}

// Outer-face turns (clockwise from outside). D/L/B rotate the opposite way to
// U/R/F because "clockwise from outside" flips on the negative side of the axis.
const FACE_TURN: Record<Face, FaceTurn> = {
  U: { rot: ROT.y, axis: 1, sign: 1 },
  D: { rot: ROT.yi, axis: 1, sign: -1 },
  R: { rot: ROT.x, axis: 0, sign: 1 },
  L: { rot: ROT.xi, axis: 0, sign: -1 },
  F: { rot: ROT.z, axis: 2, sign: 1 },
  B: { rot: ROT.zi, axis: 2, sign: -1 },
};

// (face, r, c) → centered position + outward normal, for the canonical net layout
// documented in facelets.ts. Verified against cubing.js's slot geometry.
function faceletPose(face: Face, r: number, c: number, n: number): { pos: Vec3; normal: Vec3 } {
  const k = (v: number): number => 2 * v - (n - 1); // center a cell index
  const m = n - 1;
  switch (face) {
    case 'U':
      return { pos: [k(c), k(m), k(r)], normal: [0, 1, 0] };
    case 'D':
      return { pos: [k(c), k(0), k(m - r)], normal: [0, -1, 0] };
    case 'F':
      return { pos: [k(c), k(m - r), k(m)], normal: [0, 0, 1] };
    case 'B':
      return { pos: [k(m - c), k(m - r), k(0)], normal: [0, 0, -1] };
    case 'R':
      return { pos: [k(m), k(m - r), k(m - c)], normal: [1, 0, 0] };
    case 'L':
      return { pos: [k(0), k(m - r), k(c)], normal: [-1, 0, 0] };
  }
}

interface Geometry {
  /** pose[face][idx] */
  pose: Record<Face, { pos: Vec3; normal: Vec3 }[]>;
  /** "x,y,z|nx,ny,nz" → [face, idx] */
  reverse: Map<string, [Face, number]>;
}

const geometryCache = new Map<number, Geometry>();

function key(pos: Vec3, normal: Vec3): string {
  return `${pos[0]},${pos[1]},${pos[2]}|${normal[0]},${normal[1]},${normal[2]}`;
}

function geometry(n: number): Geometry {
  const cached = geometryCache.get(n);
  if (cached) return cached;

  const pose = {} as Geometry['pose'];
  const reverse = new Map<string, [Face, number]>();
  for (const face of FACES) {
    pose[face] = [];
    for (let idx = 0; idx < n * n; idx++) {
      const r = Math.floor(idx / n);
      const c = idx % n;
      const p = faceletPose(face, r, c, n);
      pose[face].push(p);
      reverse.set(key(p.pos, p.normal), [face, idx]);
    }
  }
  const geo: Geometry = { pose, reverse };
  geometryCache.set(n, geo);
  return geo;
}

/** Amount of a turn: 1 = clockwise, 2 = half, 3 = counter-clockwise. */
export type Amount = 1 | 2 | 3;

export interface CubeMove {
  face: Face;
  amount: Amount;
  /** Number of layers turned together from the given face (1 = outer slice). */
  depth: number;
}

/**
 * Apply a single move to a state, returning a new state. `depth` layers measured
 * inward from the move's face turn together (depth 1 = a plain face turn).
 */
export function applyMove(state: FaceletState, move: CubeMove): FaceletState {
  const n = state.size;
  const geo = geometry(n);
  const turn = FACE_TURN[move.face];
  const max = n - 1;

  const next = {} as FaceletState['stickers'];
  for (const face of FACES) next[face] = state.stickers[face].slice();

  for (const face of FACES) {
    for (let idx = 0; idx < n * n; idx++) {
      const { pos, normal } = geo.pose[face][idx];
      // Layer membership: the coordinate along the turn axis, measured from the
      // move's face, must be within `depth` outermost cells.
      const coord = turn.sign === 1 ? pos[turn.axis] : -pos[turn.axis];
      const fromOuter = (max - coord) / 2; // 0 = outermost layer, 1 = next, ...
      if (fromOuter >= move.depth) continue;

      let p = pos;
      let nrm = normal;
      for (let k = 0; k < move.amount; k++) {
        p = turn.rot(p);
        nrm = turn.rot(nrm);
      }
      const dest = geo.reverse.get(key(p, nrm));
      if (!dest) continue; // unreachable for valid geometry
      next[dest[0]][dest[1]] = state.stickers[face][idx];
    }
  }

  return { size: n, stickers: next };
}

export function applyMoves(state: FaceletState, moves: CubeMove[]): FaceletState {
  return moves.reduce((s, m) => applyMove(s, m), state);
}

const FACE_LETTERS = new Set<string>(FACES);

/**
 * Parse a notation string of outer-layer moves (e.g. "R U R' U2") into moves.
 * Phase 1 scope: outer face turns only. Throws on unrecognized tokens.
 */
export function parseMoves(notation: string): CubeMove[] {
  const tokens = notation.trim().split(/\s+/).filter(Boolean);
  const moves: CubeMove[] = [];
  for (const token of tokens) {
    const faceChar = token[0];
    if (!FACE_LETTERS.has(faceChar)) {
      throw new Error(`Unrecognized move: "${token}"`);
    }
    const suffix = token.slice(1);
    let amount: Amount;
    if (suffix === '') amount = 1;
    else if (suffix === '2') amount = 2;
    else if (suffix === "'") amount = 3;
    else throw new Error(`Unrecognized move modifier: "${token}"`);
    moves.push({ face: faceChar as Face, amount, depth: 1 });
  }
  return moves;
}

export function applyNotation(state: FaceletState, notation: string): FaceletState {
  return applyMoves(state, parseMoves(notation));
}
