/* ----------------------------------------------------------------------------
   Reduction stage 2 — pair the edge wings, keeping the centers solved.

   EXPERIMENTAL / WORK IN PROGRESS. This pairs the great majority of edges
   quickly but the "last two edges" + OLL/PLL parity tail is not yet reliable, so
   big-cube solving is not wired into the app. Kept as documented groundwork.


   Wings are rearranged with conjugates  Sw · C · Sw⁻¹  (wide setup, outer core,
   undo setup) which preserve the centers while moving wings. We greedily take
   any conjugate that pairs more edges; when the simple greedy stalls on the last
   few edges (which need a temporary "unpair to re-pair" flip), a bounded two-ply
   lookahead finds the sequence. Candidates are compiled to flat permutations and
   cached so the search is fast. Corners may move freely — the 3×3 solve fixes
   them.
---------------------------------------------------------------------------- */

import { FACES, solvedState, type FaceletState } from '../../state/facelets';
import {
  applyMoves,
  compileMoves,
  invertMove,
  outer,
  wide,
  type CubeMove,
} from '../../state/faceletMoves';
import { centerIndices } from './centers';
import { edgeWings } from './geometry';

interface Candidate {
  moves: CubeMove[];
  perm: Int32Array;
}

interface Compiled {
  n: number;
  candidates: Candidate[];
  explore: Candidate[];
  target: Uint8Array;
  centerFlat: number[];
  edgeFlat: { a: number; b: number }[][];
}

const cache = new Map<number, Compiled>();

function faceFlat(faceIndex: number, i: number, n: number): number {
  return faceIndex * n * n + i;
}

function flatColors(state: FaceletState): Uint8Array {
  const n = state.size;
  const out = new Uint8Array(6 * n * n);
  let k = 0;
  for (const f of FACES) for (let i = 0; i < n * n; i++) out[k++] = FACES.indexOf(state.stickers[f][i]!);
  return out;
}

function build(n: number): Compiled {
  const wides: CubeMove[] = [];
  const outers: CubeMove[] = [];
  for (let fi = 0; fi < FACES.length; fi++) {
    for (const a of [1, 2, 3] as const) {
      wides.push(wide(FACES[fi], 2, a));
      outers.push(outer(FACES[fi], a));
    }
  }

  // Outer-only cores up to depth maxDepth (no same-face repeats).
  function cores(maxDepth: number): CubeMove[][] {
    const all: CubeMove[][] = [];
    let level: CubeMove[][] = [[]];
    for (let d = 0; d < maxDepth; d++) {
      const next: CubeMove[][] = [];
      for (const seq of level) {
        const last = seq[seq.length - 1]?.face;
        for (const o of outers) {
          if (o.face === last) continue;
          const s = [...seq, o];
          next.push(s);
          all.push(s);
        }
      }
      level = next;
    }
    return all;
  }

  const setups: CubeMove[][] = [[], ...wides.map((w) => [w])];

  function makeCandidates(coreList: CubeMove[][]): Candidate[] {
    const out: Candidate[] = [];
    for (const setup of setups) {
      const inv = setup.slice().reverse().map(invertMove);
      for (const core of coreList) {
        const moves = [...setup, ...core, ...inv];
        out.push({ moves, perm: compileMoves(moves, n) });
      }
    }
    return out;
  }

  const candidates = makeCandidates(cores(3));
  const explore = makeCandidates(cores(2)); // smaller set for the lookahead's first ply

  const target = flatColors(solvedState(n));
  const centerFlat = centerIndices(n).flatMap((i) => FACES.map((_, fi) => faceFlat(fi, i, n)));
  const edgeFlat = [...edgeWings(n).values()].map((wings) =>
    wings.map((w) => ({ a: faceFlat(FACES.indexOf(w.a[0]), w.a[1], n), b: faceFlat(FACES.indexOf(w.b[0]), w.b[1], n) })),
  );

  const compiled: Compiled = { n, candidates, explore, target, centerFlat, edgeFlat };
  cache.set(n, compiled);
  return compiled;
}

function apply(c: Uint8Array, perm: Int32Array): Uint8Array {
  const out = new Uint8Array(c.length);
  for (let i = 0; i < c.length; i++) out[i] = c[perm[i]];
  return out;
}

function centersOk(c: Uint8Array, comp: Compiled): boolean {
  for (const idx of comp.centerFlat) if (c[idx] !== comp.target[idx]) return false;
  return true;
}

function pairedCount(c: Uint8Array, comp: Compiled): number {
  let count = 0;
  for (const wings of comp.edgeFlat) {
    const a0 = c[wings[0].a];
    const b0 = c[wings[0].b];
    if (wings.every((w) => c[w.a] === a0 && c[w.b] === b0)) count++;
  }
  return count;
}

/** Pair all edges. Returns the move list; throws if it can't converge. */
export function solveEdges(start: FaceletState): CubeMove[] {
  const comp = cache.get(start.size) ?? build(start.size);
  const total = comp.edgeFlat.length;

  let c = flatColors(start);
  const moves: CubeMove[] = [];

  const commit = (cand: Candidate, next: Uint8Array) => {
    c = next;
    moves.push(...cand.moves);
  };

  for (let iter = 0; iter < 80; iter++) {
    const base = pairedCount(c, comp);
    if (base === total) return moves;

    // One-ply: any candidate that pairs more.
    let advanced = false;
    for (const cand of comp.candidates) {
      const nc = apply(c, cand.perm);
      if (pairedCount(nc, comp) > base && centersOk(nc, comp)) {
        commit(cand, nc);
        advanced = true;
        break;
      }
    }
    if (advanced) continue;

    // Two-ply: an exploratory first move that unlocks a pairing second move.
    let unlocked = false;
    twoPly: for (const c1 of comp.explore) {
      const nc1 = apply(c, c1.perm);
      if (!centersOk(nc1, comp)) continue;
      for (const c2 of comp.candidates) {
        const nc2 = apply(nc1, c2.perm);
        if (pairedCount(nc2, comp) > base && centersOk(nc2, comp)) {
          commit(c1, nc1);
          commit(c2, nc2);
          unlocked = true;
          break twoPly;
        }
      }
    }
    if (!unlocked) break;
  }

  if (pairedCount(c, comp) !== total) throw new Error('Edge solver stalled');
  return moves;
}

/** Apply the edge solution to a state (for verification/chaining). */
export function applyEdgeSolution(start: FaceletState): FaceletState {
  return applyMoves(start, solveEdges(start));
}
