/* ----------------------------------------------------------------------------
   3×3 solve: thin wrapper over cubing.js's two-phase solver (min2phase-style,
   ~20 moves, milliseconds). Runs in a web worker. Funnels the experimental API
   name through one place so a future rename is a one-line change.
---------------------------------------------------------------------------- */

import { experimentalSolve3x3x3IgnoringCenters } from 'cubing/search';
import type { Alg } from 'cubing/alg';
import type { FaceletState } from '../state/facelets';
import { faceletsToKPattern3x3 } from './kpattern3x3';

export async function solve3x3(state: FaceletState): Promise<Alg> {
  const pattern = await faceletsToKPattern3x3(state);
  return experimentalSolve3x3x3IgnoringCenters(pattern);
}
