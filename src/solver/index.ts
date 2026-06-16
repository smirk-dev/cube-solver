/* ----------------------------------------------------------------------------
   Solver dispatch. Maps a puzzle selection to the right strategy, validates the
   state, and returns either a solution (move tokens + setup string for the 3D
   player) or a friendly error.

   2×2 and 3×3 (plus the mirror/ghost shape-mods) solve on the main thread via
   cubejs. Larger cubes are experimental and not yet available.
---------------------------------------------------------------------------- */

import type { FaceletState } from '../state/facelets';
import type { PuzzleId } from '../state/puzzles';
import { invertMove, movesToNotation, parseMoves } from '../state/faceletMoves';
import { validate3x3, validate2x2 } from './validate';
import { solve3x3 } from './solve3x3';
import { solve2x2 } from './solve2x2';

export interface SolveResult {
  ok: true;
  /** Solution moves as notation tokens, in order. */
  moves: string[];
  /** Full solution as a notation string. */
  algString: string;
  /** Inverse solution — applied to a solved cube it yields the scrambled state,
   *  used as the 3D player's setup so playback animates back to solved. */
  setupString: string;
}
export interface SolveError {
  ok: false;
  reason: string;
}
export type SolveOutcome = SolveResult | SolveError;

function invertNotation(solution: string): string {
  if (!solution.trim()) return '';
  return movesToNotation(parseMoves(solution).slice().reverse().map(invertMove));
}

function resultFromSolution(solution: string): SolveResult {
  const trimmed = solution.trim();
  return {
    ok: true,
    moves: trimmed.split(/\s+/).filter(Boolean),
    algString: trimmed,
    setupString: invertNotation(trimmed),
  };
}

export async function solve(state: FaceletState, puzzleId: PuzzleId): Promise<SolveOutcome> {
  // Let the "Solving…" state paint before any synchronous solver work.
  await new Promise((r) => setTimeout(r, 0));

  try {
    // 3×3 and the 3×3-based shape-mods.
    if (puzzleId === '3x3' || puzzleId === 'mirror' || puzzleId === 'ghost') {
      const v = validate3x3(state);
      if (!v.ok) return { ok: false, reason: v.reason ?? 'This state can’t be solved.' };
      return resultFromSolution(solve3x3(state));
    }

    if (puzzleId === '2x2') {
      const v = validate2x2(state);
      if (!v.ok) return { ok: false, reason: v.reason ?? 'This state can’t be solved.' };
      return resultFromSolution(solve2x2(state));
    }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'The solver failed on this state.' };
  }

  return {
    ok: false,
    reason: 'Solving for this puzzle is experimental and not available yet — input and the 3D preview still work.',
  };
}
