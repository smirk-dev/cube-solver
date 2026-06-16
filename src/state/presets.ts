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

const FACES_N = ['U', 'R', 'F', 'D', 'L', 'B'];
const SUFFIX = ['', "'", '2'];

/** A random scramble string for size n (wide turns included for n > 3). */
export function randomScramble(n: number, length = n <= 3 ? 20 : 40): string {
  const out: string[] = [];
  let prev = -1;
  for (let i = 0; i < length; i++) {
    let f = Math.floor(Math.random() * 6);
    if (f === prev) f = (f + 1) % 6;
    prev = f;
    const w = n > 3 && Math.random() < 0.4 ? 'w' : '';
    out.push(FACES_N[f] + w + SUFFIX[Math.floor(Math.random() * 3)]);
  }
  return out.join(' ');
}

/** A random scrambled facelet state of size n. */
export function randomScrambledState(n: number): FaceletState {
  return applyNotation(solvedState(n), randomScramble(n));
}
