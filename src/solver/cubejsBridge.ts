/* ----------------------------------------------------------------------------
   cubejs bridge — a pure-JS Kociemba solver that runs on the main thread.

   We switched the 3×3/2×2 solve off cubing.js's web-worker solver because that
   worker can't be instantiated in a Vite production build (a known, unresolved
   cubing.js issue). cubejs needs no worker. cubing.js is still used for the 3D
   view, the move engine, and the KPuzzle-based converters.

   cubejs's facelet string is URFDLB face order, 9 stickers each, with face
   letters as colors — identical to our FaceletState, so the conversion is a
   straight join.
---------------------------------------------------------------------------- */

import Cube from 'cubejs';
import 'cubejs/lib/solve';
import { FACES, type FaceletState } from '../state/facelets';

let solverReady = false;

/** Build the (one-time) solver tables. Synchronous and ~1s; warm it up early. */
export function ensureSolver(): void {
  if (!solverReady) {
    Cube.initSolver();
    solverReady = true;
  }
}

/** Build the solver tables in the background after first paint. */
export function warmUpSolver(): void {
  if (solverReady) return;
  const run = () => ensureSolver();
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2000 });
  else setTimeout(run, 1200);
}

/** 54-char cubejs facelet string (URFDLB, face-letter colors). */
export function faceletString(state: FaceletState): string {
  return FACES.map((f) => state.stickers[f].join('')).join('');
}

/** Solve a 3×3 FaceletState; returns a move string (e.g. "U R2 F' ..."). */
export function solveCube3x3(state: FaceletState): string {
  ensureSolver();
  return Cube.fromString(faceletString(state)).solve().trim();
}
