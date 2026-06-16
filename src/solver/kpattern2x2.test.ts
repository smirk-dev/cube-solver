import { describe, it, expect, beforeAll } from 'vitest';
import { cube2x2x2 } from 'cubing/puzzles';
import type { KPuzzle } from 'cubing/kpuzzle';
import { FACES, solvedState, type FaceletState } from '../state/facelets';
import { applyNotation } from '../state/faceletMoves';
import { faceletsToPatternData2x2 } from './kpattern2x2';
import { solve2x2 } from './solve2x2';

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 0x100000000);
}
const MV = ['U', 'R', 'F', 'D', 'L', 'B'];
const SUF = ['', "'", '2'];
function scramble(rng: () => number, len: number): string {
  const out: string[] = [];
  let prev = -1;
  for (let i = 0; i < len; i++) {
    let f = Math.floor(rng() * 6);
    if (f === prev) f = (f + 1) % 6;
    prev = f;
    out.push(MV[f] + SUF[Math.floor(rng() * 3)]);
  }
  return out.join(' ');
}
function isSolved(s: FaceletState): boolean {
  return FACES.every((f) => s.stickers[f].every((v) => v === f));
}

describe('2×2 converter (cross-validated vs cubing.js)', () => {
  let kpuzzle: KPuzzle;
  beforeAll(async () => {
    kpuzzle = await cube2x2x2.kpuzzle();
  });

  it('matches cubing.js corner orbit for 300 random scrambles', () => {
    const rng = makeRng(2222);
    for (let i = 0; i < 300; i++) {
      const s = scramble(rng, 12);
      const truth = kpuzzle.defaultPattern().applyAlg(s).patternData;
      const mine = faceletsToPatternData2x2(applyNotation(solvedState(2), s));
      expect(mine.CORNERS.pieces, `perm @ "${s}"`).toEqual(truth.CORNERS.pieces);
      expect(mine.CORNERS.orientation, `ori @ "${s}"`).toEqual(truth.CORNERS.orientation);
    }
  });
});

describe('2×2 solve (cubejs embedding, including odd-parity cases)', () => {
  it('solves random scrambles back to solved', () => {
    const rng = makeRng(98765);
    for (let i = 0; i < 12; i++) {
      const s = scramble(rng, 12);
      const state = applyNotation(solvedState(2), s);
      const solution = solve2x2(state);
      const result = applyNotation(state, solution);
      expect(isSolved(result), `solution "${solution}" did not solve "${s}"`).toBe(true);
    }
  });

  it('solves a single quarter turn (odd corner permutation)', () => {
    const state = applyNotation(solvedState(2), 'R');
    const result = applyNotation(state, solve2x2(state));
    expect(isSolved(result)).toBe(true);
  });
});
