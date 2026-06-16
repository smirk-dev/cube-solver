/* ----------------------------------------------------------------------------
   3×3 solve — cubejs (pure-JS Kociemba, main thread, ~20 moves). Returns a move
   notation string.
---------------------------------------------------------------------------- */

import type { FaceletState } from '../state/facelets';
import { solveCube3x3 } from './cubejsBridge';

export function solve3x3(state: FaceletState): string {
  return solveCube3x3(state);
}
