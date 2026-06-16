/* ----------------------------------------------------------------------------
   2×2 solve: cubing.js's built-in 2×2 solver. Runs in a web worker.
---------------------------------------------------------------------------- */

import { experimentalSolve2x2x2 } from 'cubing/search';
import type { Alg } from 'cubing/alg';
import type { FaceletState } from '../state/facelets';
import { faceletsToKPattern2x2 } from './kpattern2x2';

export async function solve2x2(state: FaceletState): Promise<Alg> {
  const pattern = await faceletsToKPattern2x2(state);
  return experimentalSolve2x2x2(pattern);
}
