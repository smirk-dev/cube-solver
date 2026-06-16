/* ----------------------------------------------------------------------------
   Puzzle catalog: the selectable cube types and their properties.

   - "color" puzzles can be scanned by webcam (stickers carry color).
   - "shapemod" puzzles (mirror, ghost) are a single color; they share the 3×3
     mechanism and are entered manually by piece shape, then solved as a 3×3.
---------------------------------------------------------------------------- */

export type PuzzleId = '2x2' | '3x3' | '4x4' | '5x5' | 'nxn' | 'mirror' | 'ghost';
export type PuzzleKind = 'color' | 'shapemod';

export interface PuzzleDef {
  id: PuzzleId;
  /** Short label for the selector pill. */
  label: string;
  kind: PuzzleKind;
  /** Grid dimension N (faces are N×N). For 'nxn' this is the default; the
   *  user picks the actual N. Mirror/ghost ride the 3×3 mechanism. */
  size: number;
  /** Whether webcam scanning applies (color cubes only). */
  scannable: boolean;
  /** cubing.js puzzle identifier used by the 3D view (mirror/ghost → 3×3×3). */
  twistyPuzzle: string;
  /** One-line note shown in the UI where relevant. */
  note?: string;
}

export const NXN_DEFAULT = 6;
export const NXN_MIN = 6;
export const NXN_MAX = 7;

export const PUZZLES: Record<PuzzleId, PuzzleDef> = {
  '2x2': { id: '2x2', label: '2×2', kind: 'color', size: 2, scannable: true, twistyPuzzle: '2x2x2' },
  '3x3': { id: '3x3', label: '3×3', kind: 'color', size: 3, scannable: true, twistyPuzzle: '3x3x3' },
  '4x4': { id: '4x4', label: '4×4', kind: 'color', size: 4, scannable: true, twistyPuzzle: '4x4x4' },
  '5x5': { id: '5x5', label: '5×5', kind: 'color', size: 5, scannable: true, twistyPuzzle: '5x5x5' },
  nxn: {
    id: 'nxn',
    label: 'NxN',
    kind: 'color',
    size: NXN_DEFAULT,
    scannable: true,
    twistyPuzzle: `${NXN_DEFAULT}x${NXN_DEFAULT}x${NXN_DEFAULT}`,
    note: 'Experimental — larger cubes solve slower and non-optimally.',
  },
  mirror: {
    id: 'mirror',
    label: 'Mirror',
    kind: 'shapemod',
    size: 3,
    scannable: false,
    twistyPuzzle: '3x3x3',
    note: 'A 3×3 shape-mod. One color, so a camera can’t read it — enter it by piece shape.',
  },
  ghost: {
    id: 'ghost',
    label: 'Ghost',
    kind: 'shapemod',
    size: 3,
    scannable: false,
    twistyPuzzle: '3x3x3',
    note: 'A 3×3 shape-mod. One color, so a camera can’t read it — enter it by piece shape.',
  },
};

/** Ordered list for rendering selector pills. */
export const PUZZLE_ORDER: PuzzleId[] = ['2x2', '3x3', '4x4', '5x5', 'nxn', 'mirror', 'ghost'];

/** Effective grid dimension, accounting for the user-chosen N in NxN mode. */
export function effectiveSize(id: PuzzleId, nxnSize: number): number {
  return id === 'nxn' ? nxnSize : PUZZLES[id].size;
}

/** cubing.js puzzle id for the current selection. */
export function twistyPuzzleId(id: PuzzleId, nxnSize: number): string {
  if (id === 'nxn') return `${nxnSize}x${nxnSize}x${nxnSize}`;
  return PUZZLES[id].twistyPuzzle;
}
