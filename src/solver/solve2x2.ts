/* ----------------------------------------------------------------------------
   2×2 solve — reuses the cubejs 3×3 solver by embedding the 2×2 (corners only)
   into a 3×3 with solved edges and centers. The 3×3 solution's moves applied to
   the 2×2 solve its corners. A 2×2 can have an odd corner permutation (the 3×3
   embedding would then be unsolvable), so a single quarter turn flips parity
   first and is prepended to the solution.
---------------------------------------------------------------------------- */

import type { FaceletState } from '../state/facelets';
import { applyNotation } from '../state/faceletMoves';
import { faceletsToPatternData2x2 } from './kpattern2x2';
import { patternDataToFacelets3x3, type Pattern3x3Data } from './kpattern3x3';
import { solveCube3x3 } from './cubejsBridge';

function permutationParity(perm: number[]): number {
  const seen = new Array<boolean>(perm.length).fill(false);
  let parity = 0;
  for (let i = 0; i < perm.length; i++) {
    if (seen[i]) continue;
    let j = i;
    let len = 0;
    while (!seen[j]) {
      seen[j] = true;
      j = perm[j];
      len++;
    }
    if (len % 2 === 0) parity ^= 1;
  }
  return parity;
}

function solveEmbedded(state2: FaceletState): string {
  const corners = faceletsToPatternData2x2(state2).CORNERS;
  const data: Pattern3x3Data = {
    CORNERS: corners,
    EDGES: { pieces: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], orientation: new Array(12).fill(0) },
    CENTERS: { pieces: [0, 1, 2, 3, 4, 5], orientation: [0, 0, 0, 0, 0, 0], orientationMod: [1, 1, 1, 1, 1, 1] },
  };
  return solveCube3x3(patternDataToFacelets3x3(data));
}

export function solve2x2(state: FaceletState): string {
  const corners = faceletsToPatternData2x2(state).CORNERS;
  if (permutationParity(corners.pieces) === 0) {
    return solveEmbedded(state);
  }
  // Odd corner permutation → make it even with one quarter turn, then prepend it.
  return `U ${solveEmbedded(applyNotation(state, 'U'))}`.trim();
}
