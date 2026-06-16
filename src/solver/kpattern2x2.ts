/* ----------------------------------------------------------------------------
   2×2 facelet ⇄ cubing.js KPattern conversion (corners only).

   A 2×2 is just the eight corners. We reuse the corner conventions verified for
   3×3 (slots URF URB ULB ULF DRF DLF DLB DRB, U/D sticker first), remapped to
   the 2×2 face indices (corner positions 0,1,2,3). Cross-validated against
   cubing.js in kpattern2x2.test.ts.
---------------------------------------------------------------------------- */

import { type Face, type FaceletState } from '../state/facelets';

type FaceletRef = readonly [Face, number];

// Corner slots in cubing.js order; each lists its 3 facelets, U/D sticker first
// (3×3 corner positions 0,2,6,8 mapped to 2×2 positions 0,1,2,3).
const CORNER_FACELETS: readonly (readonly FaceletRef[])[] = [
  [['U', 3], ['R', 0], ['F', 1]], // 0 URF
  [['U', 1], ['B', 0], ['R', 1]], // 1 URB
  [['U', 0], ['L', 0], ['B', 1]], // 2 ULB
  [['U', 2], ['F', 0], ['L', 1]], // 3 ULF
  [['D', 1], ['F', 3], ['R', 2]], // 4 DRF
  [['D', 0], ['L', 3], ['F', 2]], // 5 DLF
  [['D', 2], ['B', 3], ['L', 2]], // 6 DLB
  [['D', 3], ['R', 3], ['B', 2]], // 7 DRB
];

const SOLVED_CORNER: readonly Face[][] = CORNER_FACELETS.map((slot) => slot.map(([face]) => face));
const CORNER_BY_COLORS = new Map<string, number>();
SOLVED_CORNER.forEach((colors, piece) => CORNER_BY_COLORS.set(colors.join(''), piece));

export interface Pattern2x2Data {
  CORNERS: { pieces: number[]; orientation: number[] };
}

function colorAt(facelets: FaceletState, ref: FaceletRef): Face {
  const v = facelets.stickers[ref[0]][ref[1]];
  if (v === null) throw new Error('Cannot convert an incomplete facelet state');
  return v;
}

export function faceletsToPatternData2x2(facelets: FaceletState): Pattern2x2Data {
  if (facelets.size !== 2) throw new Error('faceletsToPatternData2x2 requires a 2×2 state');
  const pieces = new Array<number>(8);
  const orientation = new Array<number>(8);
  for (let slot = 0; slot < 8; slot++) {
    const colors = CORNER_FACELETS[slot].map((ref) => colorAt(facelets, ref));
    const ori = colors.findIndex((c) => c === 'U' || c === 'D');
    if (ori < 0) throw new Error(`2×2 corner slot ${slot} has no U/D sticker`);
    const canonical = [colors[ori], colors[(ori + 1) % 3], colors[(ori + 2) % 3]];
    const piece = CORNER_BY_COLORS.get(canonical.join(''));
    if (piece === undefined) throw new Error(`Unknown 2×2 corner at slot ${slot}: ${colors.join('')}`);
    pieces[slot] = piece;
    orientation[slot] = ori;
  }
  return { CORNERS: { pieces, orientation } };
}
