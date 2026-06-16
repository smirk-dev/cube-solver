import { describe, it, expect } from 'vitest';
import { FACES, solvedState } from '../../state/facelets';
import { applyMoves, applyNotation } from '../../state/faceletMoves';
import { centerIndices, solveCenters } from './centers';

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function randomScramble(rng: () => number, n: number, length: number): string {
  const faces = ['U', 'R', 'F', 'D', 'L', 'B'];
  const suffix = ['', "'", '2'];
  const out: string[] = [];
  for (let i = 0; i < length; i++) {
    const f = faces[Math.floor(rng() * 6)];
    const wide = n > 3 && rng() < 0.5 ? 'w' : '';
    out.push(f + wide + suffix[Math.floor(rng() * 3)]);
  }
  return out.join(' ');
}

describe('reduction · centers (groundwork)', () => {
  // The center-solving stage of NxN reduction. Edge pairing + parity (the hard
  // "last two edges" tail) are experimental WIP, so big-cube solving is not yet
  // wired into the app. 4×4 centers solve reliably and quickly.
  for (const n of [4]) {
    it(`solves centers for random ${n}×${n} scrambles`, () => {
      const rng = makeRng(1000 + n);
      const idxs = centerIndices(n);
      for (let t = 0; t < 5; t++) {
        const scrambled = applyNotation(solvedState(n), randomScramble(rng, n, 30));
        const moves = solveCenters(scrambled);
        const result = applyMoves(scrambled, moves);
        for (const face of FACES) {
          for (const i of idxs) {
            expect(result.stickers[face][i], `${face}[${i}] after centers`).toBe(face);
          }
        }
      }
    });
  }
});
