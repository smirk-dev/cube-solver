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

export type Pose = { pos: Vec3; normal: Vec3 };

// (face, r, c) → centered position + outward normal, for the canonical net layout
// documented in facelets.ts. Verified against cubing.js's slot geometry.
export function faceletPose(face: Face, r: number, c: number, n: number): Pose {
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
  /** Outermost layer turned, 0 = the face's own slice (inclusive). */
  outerFrom: number;
  /** One past the innermost layer turned (exclusive): layers [outerFrom, outerTo). */
  outerTo: number;
}

/** A plain outer face turn. */
export function outer(face: Face, amount: Amount = 1): CubeMove {
  return { face, amount, outerFrom: 0, outerTo: 1 };
}

/** A wide turn of the outer `layers` slices (Rw = 2, 3Rw = 3, …). */
export function wide(face: Face, layers: number, amount: Amount = 1): CubeMove {
  return { face, amount, outerFrom: 0, outerTo: layers };
}

/** A single inner-slice turn at 1-based `layer` from the face (2R, 3R, …). */
export function slice(face: Face, layer: number, amount: Amount = 1): CubeMove {
  return { face, amount, outerFrom: layer - 1, outerTo: layer };
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
      // move's face, must fall in the turned range [outerFrom, outerTo).
      const coord = turn.sign === 1 ? pos[turn.axis] : -pos[turn.axis];
      const fromOuter = (max - coord) / 2; // 0 = outermost layer, 1 = next, ...
      if (fromOuter < move.outerFrom || fromOuter >= move.outerTo) continue;

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

/**
 * Compile a move sequence into a flat permutation over the 6·n² stickers
 * (index = faceIndex·n² + cellIndex). `perm[dest] = src`, so applying it to a
 * flat color array `c` is `out[i] = c[perm[i]]`. Lets hot search loops apply a
 * fixed sequence in O(stickers) instead of re-walking every move.
 */
export function compileMoves(moves: CubeMove[], n: number): Int32Array {
  const labels = {} as Record<Face, number[]>;
  let flat = 0;
  for (const face of FACES) {
    labels[face] = [];
    for (let i = 0; i < n * n; i++) labels[face].push(flat++);
  }
  let state = { size: n, stickers: labels } as unknown as FaceletState;
  for (const m of moves) state = applyMove(state, m);
  const perm = new Int32Array(6 * n * n);
  let k = 0;
  for (const face of FACES) {
    for (let i = 0; i < n * n; i++) perm[k++] = state.stickers[face][i] as unknown as number;
  }
  return perm;
}

function amountFromSuffix(suffix: string, token: string): Amount {
  if (suffix === '') return 1;
  if (suffix === '2') return 2;
  if (suffix === "'") return 3;
  throw new Error(`Unrecognized move modifier: "${token}"`);
}

const MOVE_RE = /^(\d+)?([URFDLBurfdlb])(w)?(2|')?$/;

/**
 * Parse a notation string into moves. Supports SiGN-style NxN notation:
 *   R   outer        Rw / r  wide 2       3Rw  wide 3
 *   2R  inner slice (2nd layer)           2-3Rw  block (layers 2..3)
 */
export function parseMoves(notation: string): CubeMove[] {
  const tokens = notation.trim().split(/\s+/).filter(Boolean);
  const moves: CubeMove[] = [];
  for (const token of tokens) {
    const range = token.match(/^(\d+)-(\d+)([URFDLB])w?(2|')?$/);
    if (range) {
      moves.push({
        face: range[3] as Face,
        amount: amountFromSuffix(range[4] ?? '', token),
        outerFrom: parseInt(range[1], 10) - 1,
        outerTo: parseInt(range[2], 10),
      });
      continue;
    }

    const m = token.match(MOVE_RE);
    if (!m) throw new Error(`Unrecognized move: "${token}"`);
    const num = m[1] ? parseInt(m[1], 10) : undefined;
    const letter = m[2];
    const isWide = m[3] === 'w' || letter === letter.toLowerCase();
    const face = letter.toUpperCase() as Face;
    const amount = amountFromSuffix(m[4] ?? '', token);

    if (isWide) moves.push(wide(face, num ?? 2, amount));
    else if (num !== undefined) moves.push(slice(face, num, amount));
    else moves.push(outer(face, amount));
  }
  return moves;
}

const SUFFIX: Record<Amount, string> = { 1: '', 2: '2', 3: "'" };

/** Serialize a move to SiGN/cubing.js notation. */
export function moveToNotation(move: CubeMove): string {
  const s = SUFFIX[move.amount];
  if (move.outerFrom === 0) {
    if (move.outerTo === 1) return `${move.face}${s}`;
    if (move.outerTo === 2) return `${move.face}w${s}`;
    return `${move.outerTo}${move.face}w${s}`;
  }
  if (move.outerTo === move.outerFrom + 1) return `${move.outerFrom + 1}${move.face}${s}`;
  return `${move.outerFrom + 1}-${move.outerTo}${move.face}w${s}`;
}

export function movesToNotation(moves: CubeMove[]): string {
  return moves.map(moveToNotation).join(' ');
}

/** Invert a move (same layers, opposite amount). */
export function invertMove(move: CubeMove): CubeMove {
  return { ...move, amount: (4 - move.amount) as Amount };
}

export function applyNotation(state: FaceletState, notation: string): FaceletState {
  return applyMoves(state, parseMoves(notation));
}
