/* ----------------------------------------------------------------------------
   Baked-in scramble presets so the app is fully testable without a physical
   cube or a camera. Each preset is a notation string applied to a solved 3×3.
---------------------------------------------------------------------------- */

import { solvedState, type FaceletState } from './facelets';
import { applyNotation } from './faceletMoves';

export interface ScramblePreset {
  name: string;
  scramble: string;
}

export const PRESETS_3X3: ScramblePreset[] = [
  { name: 'Sune', scramble: "R U R' U R U2 R'" },
  { name: 'T-perm', scramble: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { name: 'Checkerboard', scramble: 'U2 D2 F2 B2 L2 R2' },
  { name: 'Cross + corners', scramble: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
  { name: 'Superflip', scramble: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2" },
  { name: 'Random-ish', scramble: "D2 R' U2 F2 L' D F' U R2 F2 L2 B' U2 B L2 F U2 R2 U" },
];

/** Build the facelet state for a scramble string applied to a solved 3×3. */
export function presetState(scramble: string): FaceletState {
  return applyNotation(solvedState(3), scramble);
}
