import { describe, it, expect } from 'vitest';
import { FACES, solvedState, type FaceletState } from '../state/facelets';
import { applyNotation } from '../state/faceletMoves';
import { solveCube3x3 } from './cubejsBridge';

function isSolved(s: FaceletState): boolean {
  return FACES.every((f) => s.stickers[f].every((v) => v === f));
}

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

describe('cubejs 3×3 solve (main-thread)', () => {
  it('solves 15 random scrambles back to solved', () => {
    const rng = makeRng(13579);
    for (let i = 0; i < 15; i++) {
      const s = scramble(rng, 25);
      const state = applyNotation(solvedState(3), s);
      const solution = solveCube3x3(state);
      const result = applyNotation(state, solution);
      expect(isSolved(result), `solution "${solution}" did not solve "${s}"`).toBe(true);
      const moveCount = solution.split(/\s+/).filter(Boolean).length;
      expect(moveCount, `too long for "${s}"`).toBeLessThanOrEqual(30);
    }
  });
});
