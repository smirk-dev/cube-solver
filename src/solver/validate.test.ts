import { describe, it, expect } from 'vitest';
import { solvedState } from '../state/facelets';
import { applyNotation } from '../state/faceletMoves';
import { faceletsToPatternData3x3, patternDataToFacelets3x3 } from './kpattern3x3';
import { validate3x3, validateColorCounts } from './validate';

describe('validate3x3', () => {
  it('accepts a solved cube', () => {
    expect(validate3x3(solvedState(3)).ok).toBe(true);
  });

  it('accepts a legitimately scrambled cube', () => {
    const s = applyNotation(solvedState(3), "R U R' U' F2 L D' B R2");
    expect(validate3x3(s).ok).toBe(true);
  });

  it('rejects wrong color counts', () => {
    const s = solvedState(3);
    s.stickers.U[0] = 'R'; // now U has 8, R has 10
    const r = validateColorCounts(s);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/count/i);
  });

  it('rejects a single twisted corner', () => {
    const data = faceletsToPatternData3x3(solvedState(3));
    data.CORNERS.orientation[0] = 1; // twist one corner in place
    const s = patternDataToFacelets3x3(data);
    const r = validate3x3(s);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/twist/i);
  });

  it('rejects a single flipped edge', () => {
    const data = faceletsToPatternData3x3(solvedState(3));
    data.EDGES.orientation[0] = 1; // flip one edge in place
    const s = patternDataToFacelets3x3(data);
    const r = validate3x3(s);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/flip/i);
  });

  it('rejects two swapped corners (bad permutation parity)', () => {
    const data = faceletsToPatternData3x3(solvedState(3));
    [data.CORNERS.pieces[0], data.CORNERS.pieces[1]] = [data.CORNERS.pieces[1], data.CORNERS.pieces[0]];
    const s = patternDataToFacelets3x3(data);
    const r = validate3x3(s);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/swap|reach/i);
  });
});
