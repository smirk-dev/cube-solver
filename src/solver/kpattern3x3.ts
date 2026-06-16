/* ----------------------------------------------------------------------------
   3×3 facelet ⇄ cubing.js KPattern conversion.

   cubing.js ships no facelet helper, so we map our FaceletState to the exact
   orbit conventions of its 3×3 KPuzzle. Those conventions were read off the
   installed package (see docs/cubing-api.md and scripts/inspect-kpuzzle.mjs):

     CORNERS slots: URF URB ULB ULF DRF DLF DLB DRB   (orientation mod 3)
     EDGES   slots: UF UR UB UL DF DR DB DL FR FL BR BL (orientation mod 2)
     CENTERS: fixed identity (orientation ignored)

   The facelet index tables below use the canonical net layout from facelets.ts.
   Corner facelets are listed U/D-first; edges primary-first. The conversion is
   cross-validated against cubing.js itself (see kpattern3x3.test.ts).
---------------------------------------------------------------------------- */

import { cube3x3x3 } from 'cubing/puzzles';
import { KPattern, type KPuzzle } from 'cubing/kpuzzle';
import { FACES, type Face, type FaceletState } from '../state/facelets';

type FaceletRef = readonly [Face, number];

// Corner slots in cubing.js order; each lists its 3 facelets, U/D sticker first.
const CORNER_FACELETS: readonly (readonly FaceletRef[])[] = [
  [['U', 8], ['R', 0], ['F', 2]], // 0 URF
  [['U', 2], ['B', 0], ['R', 2]], // 1 URB
  [['U', 0], ['L', 0], ['B', 2]], // 2 ULB
  [['U', 6], ['F', 0], ['L', 2]], // 3 ULF
  [['D', 2], ['F', 8], ['R', 6]], // 4 DRF
  [['D', 0], ['L', 8], ['F', 6]], // 5 DLF
  [['D', 6], ['B', 8], ['L', 6]], // 6 DLB
  [['D', 8], ['R', 8], ['B', 6]], // 7 DRB
];

// Edge slots in cubing.js order; each lists its 2 facelets, primary first.
const EDGE_FACELETS: readonly (readonly FaceletRef[])[] = [
  [['U', 7], ['F', 1]], // 0 UF
  [['U', 5], ['R', 1]], // 1 UR
  [['U', 1], ['B', 1]], // 2 UB
  [['U', 3], ['L', 1]], // 3 UL
  [['D', 1], ['F', 7]], // 4 DF
  [['D', 5], ['R', 7]], // 5 DR
  [['D', 7], ['B', 7]], // 6 DB
  [['D', 3], ['L', 7]], // 7 DL
  [['F', 5], ['R', 3]], // 8 FR
  [['F', 3], ['L', 5]], // 9 FL
  [['B', 3], ['R', 5]], // 10 BR
  [['B', 5], ['L', 3]], // 11 BL
];

// Solved colors (= faces) of each piece, in the same facelet order as above.
const SOLVED_CORNER: readonly Face[][] = CORNER_FACELETS.map((slot) =>
  slot.map(([face]) => face),
);
const SOLVED_EDGE: readonly Face[][] = EDGE_FACELETS.map((slot) =>
  slot.map(([face]) => face),
);

// Identity lookups: canonical color tuple → piece index.
const CORNER_BY_COLORS = new Map<string, number>();
SOLVED_CORNER.forEach((colors, piece) => CORNER_BY_COLORS.set(colors.join(''), piece));
const EDGE_BY_COLORS = new Map<string, number>();
SOLVED_EDGE.forEach((colors, piece) => EDGE_BY_COLORS.set(colors.join(''), piece));

export interface OrbitData {
  pieces: number[];
  orientation: number[];
  orientationMod?: number[];
}
export interface Pattern3x3Data {
  EDGES: OrbitData;
  CORNERS: OrbitData;
  CENTERS: OrbitData;
}

const SOLVED_CENTERS: OrbitData = {
  pieces: [0, 1, 2, 3, 4, 5],
  orientation: [0, 0, 0, 0, 0, 0],
  orientationMod: [1, 1, 1, 1, 1, 1],
};

function colorAt(facelets: FaceletState, ref: FaceletRef): Face {
  const v = facelets.stickers[ref[0]][ref[1]];
  if (v === null) throw new Error('Cannot convert an incomplete facelet state');
  return v;
}

/**
 * Convert a (complete) 3×3 FaceletState into cubing.js KPattern orbit data.
 * Pure — does not need the KPuzzle — so it is unit-testable on its own.
 */
export function faceletsToPatternData3x3(facelets: FaceletState): Pattern3x3Data {
  if (facelets.size !== 3) throw new Error('faceletsToPatternData3x3 requires a 3×3 state');

  const cornerPerm = new Array<number>(8);
  const cornerOri = new Array<number>(8);
  for (let slot = 0; slot < 8; slot++) {
    const colors = CORNER_FACELETS[slot].map((ref) => colorAt(facelets, ref));
    // Orientation = position of the U/D sticker within the slot (0,1,2).
    const ori = colors.findIndex((c) => c === 'U' || c === 'D');
    if (ori < 0) throw new Error(`Corner slot ${slot} has no U/D sticker`);
    const canonical = [colors[ori], colors[(ori + 1) % 3], colors[(ori + 2) % 3]];
    const piece = CORNER_BY_COLORS.get(canonical.join(''));
    if (piece === undefined) throw new Error(`Unknown corner at slot ${slot}: ${colors.join('')}`);
    cornerPerm[slot] = piece;
    cornerOri[slot] = ori;
  }

  const edgePerm = new Array<number>(12);
  const edgeOri = new Array<number>(12);
  for (let slot = 0; slot < 12; slot++) {
    const colors = EDGE_FACELETS[slot].map((ref) => colorAt(facelets, ref));
    let resolved = false;
    for (let ori = 0; ori < 2 && !resolved; ori++) {
      const ordered = ori === 0 ? colors : [colors[1], colors[0]];
      const piece = EDGE_BY_COLORS.get(ordered.join(''));
      if (piece !== undefined) {
        edgePerm[slot] = piece;
        edgeOri[slot] = ori;
        resolved = true;
      }
    }
    if (!resolved) throw new Error(`Unknown edge at slot ${slot}: ${colors.join('')}`);
  }

  return {
    EDGES: { pieces: edgePerm, orientation: edgeOri },
    CORNERS: { pieces: cornerPerm, orientation: cornerOri },
    CENTERS: { ...SOLVED_CENTERS },
  };
}

/** Inverse of faceletsToPatternData3x3: KPattern orbit data → FaceletState. */
export function patternDataToFacelets3x3(data: Pattern3x3Data): FaceletState {
  const stickers = {} as FaceletState['stickers'];
  for (const face of FACES) stickers[face] = new Array<Face | null>(9).fill(null);

  for (let slot = 0; slot < 8; slot++) {
    const piece = data.CORNERS.pieces[slot];
    const ori = data.CORNERS.orientation[slot];
    for (let j = 0; j < 3; j++) {
      const [face, idx] = CORNER_FACELETS[slot][j];
      stickers[face][idx] = SOLVED_CORNER[piece][(j - ori + 3) % 3];
    }
  }
  for (let slot = 0; slot < 12; slot++) {
    const piece = data.EDGES.pieces[slot];
    const ori = data.EDGES.orientation[slot];
    for (let j = 0; j < 2; j++) {
      const [face, idx] = EDGE_FACELETS[slot][j];
      stickers[face][idx] = SOLVED_EDGE[piece][(j + ori) % 2];
    }
  }
  // Centers are fixed: each face center shows its own face color.
  for (const face of FACES) stickers[face][4] = face;

  return { size: 3, stickers };
}

let kpuzzlePromise: Promise<KPuzzle> | null = null;
export function get3x3KPuzzle(): Promise<KPuzzle> {
  if (!kpuzzlePromise) kpuzzlePromise = cube3x3x3.kpuzzle();
  return kpuzzlePromise;
}

/** Build a cubing.js KPattern from a 3×3 FaceletState. */
export async function faceletsToKPattern3x3(facelets: FaceletState): Promise<KPattern> {
  const kpuzzle = await get3x3KPuzzle();
  const data = faceletsToPatternData3x3(facelets);
  return new KPattern(kpuzzle, data as unknown as ConstructorParameters<typeof KPattern>[1]);
}
