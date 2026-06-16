/* ----------------------------------------------------------------------------
   Reduction stage 1 — solve the centers.

   Center stickers are sorted onto their own faces using [slice, face]
   commutators wrapped in short setup moves. A commutator is a 3-cycle, so it
   never disturbs anything outside its three slots — that lets us finish a face
   and keep it finished. We search greedily for any setup+commutator that makes
   net progress without breaking an already-finished face. Wings get scrambled
   here; that's fine — edge pairing comes next and preserves centers.
---------------------------------------------------------------------------- */

import { FACES, type Face, type FaceletState } from '../../state/facelets';
import {
  applyMoves,
  invertMove,
  outer,
  slice,
  type CubeMove,
} from '../../state/faceletMoves';

/** Inner (non-border) sticker indices for an n×n face. */
export function centerIndices(n: number): number[] {
  const out: number[] = [];
  for (let r = 1; r < n - 1; r++) {
    for (let c = 1; c < n - 1; c++) out.push(r * n + c);
  }
  return out;
}

function centersSolved(state: FaceletState, idxs: number[]): number {
  let count = 0;
  for (const face of FACES) {
    for (const i of idxs) if (state.stickers[face][i] === face) count++;
  }
  return count;
}

function faceCentersSolved(state: FaceletState, face: Face, idxs: number[]): boolean {
  return idxs.every((i) => state.stickers[face][i] === face);
}

const AMOUNTS = [1, 2, 3] as const;

/** Build the candidate move pools for a given size. */
function pools(n: number) {
  const faceTurns: CubeMove[] = [];
  const sliceTurns: CubeMove[] = [];
  for (const face of FACES) {
    for (const a of AMOUNTS) faceTurns.push(outer(face, a));
    // Inner slices: layers 2..n-1 (1-based) cover every center column.
    for (let layer = 2; layer <= n - 1; layer++) {
      for (const a of AMOUNTS) sliceTurns.push(slice(face, layer, a));
    }
  }
  return { faceTurns, sliceTurns };
}

function invert(moves: CubeMove[]): CubeMove[] {
  return moves.slice().reverse().map(invertMove);
}

/**
 * Solve all centers. Returns the move list, or throws if it stalls (which the
 * property test guards against).
 */
export function solveCenters(start: FaceletState): CubeMove[] {
  const n = start.size;
  const idxs = centerIndices(n);
  const { faceTurns, sliceTurns } = pools(n);

  // Commutator bases [s, f] = s f s' f'. Each is a center 3-cycle (plus wing
  // churn we don't care about yet).
  const baseComms: CubeMove[][] = [];
  for (const s of sliceTurns) {
    for (const f of faceTurns) {
      baseComms.push([s, f, invertMove(s), invertMove(f)]);
    }
  }

  // Setup pool: empty, single, or double outer/slice turns.
  const single = [...faceTurns, ...sliceTurns];
  const setups: CubeMove[][] = [[]];
  for (const a of single) setups.push([a]);
  for (const a of faceTurns) for (const b of faceTurns) setups.push([a, b]);

  let state = start;
  const moves: CubeMove[] = [];
  // Freeze faces in this order as they get completed.
  const frozen: Face[] = [];

  const MAX_ITERS = 400;
  for (let iter = 0; iter < MAX_ITERS; iter++) {
    if (centersSolved(state, idxs) === idxs.length * FACES.length) {
      return moves;
    }

    const base = centersSolved(state, idxs);
    let best: CubeMove[] | null = null;

    search: for (const setup of setups) {
      const afterSetup = applyMoves(state, setup);
      const invSetup = invert(setup);
      for (const comm of baseComms) {
        const result = applyMoves(afterSetup, [...comm, ...invSetup]);
        // Frozen faces must stay solved.
        let ok = true;
        for (const f of frozen) {
          if (!faceCentersSolved(result, f, idxs)) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        // Greedy: take the first strict improvement.
        if (centersSolved(result, idxs) > base) {
          best = [...setup, ...comm, ...invSetup];
          break search;
        }
      }
    }

    if (!best) break; // stalled
    state = applyMoves(state, best);
    moves.push(...best);

    // Update frozen set.
    for (const f of FACES) {
      if (!frozen.includes(f) && faceCentersSolved(state, f, idxs)) frozen.push(f);
    }
  }

  if (centersSolved(state, idxs) !== idxs.length * FACES.length) {
    throw new Error('Center solver stalled');
  }
  return moves;
}
