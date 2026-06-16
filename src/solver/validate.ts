/* ----------------------------------------------------------------------------
   State validation. Reject impossible cubes before handing them to a solver so
   the user gets a clear explanation instead of a hang or a bogus solution.
---------------------------------------------------------------------------- */

import { FACES, centerIndex, isComplete, type FaceletState } from '../state/facelets';
import { faceletsToPatternData3x3 } from './kpattern3x3';

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

const OK: ValidationResult = { ok: true };

/** Each of the six face-colors must appear exactly size² times. */
export function validateColorCounts(state: FaceletState): ValidationResult {
  if (!isComplete(state)) {
    return { ok: false, reason: 'Some stickers are still blank — fill in every face first.' };
  }
  const per = state.size * state.size;
  const counts: Record<string, number> = {};
  for (const face of FACES) {
    for (const v of state.stickers[face]) counts[v as string] = (counts[v as string] ?? 0) + 1;
  }
  for (const face of FACES) {
    const got = counts[face] ?? 0;
    if (got !== per) {
      return {
        ok: false,
        reason: `Color count is off: ${face} appears ${got} time(s), but every color must appear ${per} times.`,
      };
    }
  }
  return OK;
}

/** On odd cubes, each face center must match its own face (anchors the scheme). */
export function validateCenters(state: FaceletState): ValidationResult {
  if (state.size % 2 === 0) return OK;
  const c = centerIndex(state.size);
  for (const face of FACES) {
    if (state.stickers[face][c] !== face) {
      return { ok: false, reason: `The ${face} center doesn’t match its face — centers define the color scheme.` };
    }
  }
  return OK;
}

function permutationParity(perm: number[]): 0 | 1 {
  const seen = new Array<boolean>(perm.length).fill(false);
  let parity: 0 | 1 = 0;
  for (let i = 0; i < perm.length; i++) {
    if (seen[i]) continue;
    let j = i;
    let len = 0;
    while (!seen[j]) {
      seen[j] = true;
      j = perm[j];
      len++;
    }
    if (len % 2 === 0) parity = (parity ^ 1) as 0 | 1;
  }
  return parity;
}

/** Full 3×3 solvability check (counts, centers, and the three parity laws). */
export function validate3x3(state: FaceletState): ValidationResult {
  if (state.size !== 3) return { ok: false, reason: 'Expected a 3×3 state.' };

  const counts = validateColorCounts(state);
  if (!counts.ok) return counts;
  const centers = validateCenters(state);
  if (!centers.ok) return centers;

  let data;
  try {
    data = faceletsToPatternData3x3(state);
  } catch {
    return {
      ok: false,
      reason: 'That sticker arrangement isn’t a real cube — check for a piece with two of the same color.',
    };
  }

  const cornerOriSum = data.CORNERS.orientation.reduce((a, b) => a + b, 0);
  if (cornerOriSum % 3 !== 0) {
    return { ok: false, reason: 'A corner is twisted in place — re-check the corner orientations.' };
  }
  const edgeOriSum = data.EDGES.orientation.reduce((a, b) => a + b, 0);
  if (edgeOriSum % 2 !== 0) {
    return { ok: false, reason: 'An edge is flipped in place — re-check the edge orientations.' };
  }
  if (permutationParity(data.CORNERS.pieces) !== permutationParity(data.EDGES.pieces)) {
    return { ok: false, reason: 'Two pieces look swapped — this exact arrangement can’t be reached on a real cube.' };
  }

  return OK;
}
