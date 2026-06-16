import { describe, it, expect } from 'vitest';
import { solvedState } from '../state/facelets';
import { applyNotation } from '../state/faceletMoves';
import { faceletsToKPattern3x3 } from './kpattern3x3';
import { solve3x3 } from './solve3x3';

// The cubing.js solver runs in a web worker; it also works under Node, so we can
// property-test the whole pipeline: scramble → facelets → KPattern → solve →
// apply solution → assert solved. This validates the converter and solver
// together end to end.

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const FACES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
const SUFFIX = ['', "'", '2'] as const;

function randomScramble(rng: () => number, length: number): string {
  const moves: string[] = [];
  let prev = -1;
  for (let i = 0; i < length; i++) {
    let f = Math.floor(rng() * 6);
    if (f === prev) f = (f + 1) % 6;
    prev = f;
    moves.push(FACES[f] + SUFFIX[Math.floor(rng() * 3)]);
  }
  return moves.join(' ');
}

describe('solve3x3 end-to-end', () => {
  it('solves the solved cube in zero moves', async () => {
    const solution = await solve3x3(solvedState(3));
    expect(solution.toString().trim()).toBe('');
  });

  it('solves 20 random scrambles back to solved, each in a short solution', async () => {
    const rng = makeRng(20260616);
    for (let i = 0; i < 20; i++) {
      const scramble = randomScramble(rng, 25);
      const state = applyNotation(solvedState(3), scramble);

      const solution = await solve3x3(state);
      const pattern = await faceletsToKPattern3x3(state);
      const result = pattern.applyAlg(solution);

      expect(
        result.experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true }),
        `solution did not solve "${scramble}"`,
      ).toBe(true);

      const moveCount = solution.toString().trim().split(/\s+/).filter(Boolean).length;
      expect(moveCount, `solution too long for "${scramble}"`).toBeLessThanOrEqual(30);
    }
  });
});
