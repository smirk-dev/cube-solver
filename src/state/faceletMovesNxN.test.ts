import { describe, it, expect } from 'vitest';
import { FACES, solvedState, type FaceletState } from './facelets';
import {
  applyMove,
  applyMoves,
  applyNotation,
  parseMoves,
  movesToNotation,
  outer,
  wide,
  slice,
  type CubeMove,
} from './faceletMoves';

function statesEqual(a: FaceletState, b: FaceletState): boolean {
  return FACES.every((f) => a.stickers[f].every((v, i) => v === b.stickers[f][i]));
}

function quad(state: FaceletState, move: CubeMove): FaceletState {
  let s = state;
  for (let i = 0; i < 4; i++) s = applyMove(s, move);
  return s;
}

describe('NxN facelet engine', () => {
  for (const n of [4, 5]) {
    it(`${n}×${n}: outer, wide, and slice turns each have order 4`, () => {
      const solved = solvedState(n);
      expect(statesEqual(quad(solved, outer('R')), solved)).toBe(true);
      expect(statesEqual(quad(solved, wide('R', 2)), solved)).toBe(true);
      expect(statesEqual(quad(solved, slice('R', 2)), solved)).toBe(true);
      expect(statesEqual(quad(solved, slice('U', 2)), solved)).toBe(true);
    });

    it(`${n}×${n}: a wide turn equals the outer turn composed with its inner slices`, () => {
      const solved = solvedState(n);
      // Rw (2 layers) === R then 2R
      const viaWide = applyMove(solved, wide('R', 2));
      const viaParts = applyMoves(solved, [outer('R'), slice('R', 2)]);
      expect(statesEqual(viaWide, viaParts)).toBe(true);
    });

    it(`${n}×${n}: scrambles preserve n² stickers of each color`, () => {
      const s = applyNotation(solvedState(n), "Rw U2 R' Fw L 2R U Rw' B2 F");
      const total: Record<string, number> = {};
      for (const f of FACES) for (const v of s.stickers[f]) total[v as string] = (total[v as string] ?? 0) + 1;
      for (const f of FACES) expect(total[f]).toBe(n * n);
    });
  }

  it('notation round-trips through parse/serialize', () => {
    const moves = [outer('R', 2), wide('F', 2), wide('U', 3), slice('R', 2), slice('L', 3, 3)];
    const round = parseMoves(movesToNotation(moves));
    expect(round).toEqual(moves);
  });

  it('parses SiGN tokens', () => {
    expect(parseMoves('R')).toEqual([outer('R')]);
    expect(parseMoves('Rw')).toEqual([wide('R', 2)]);
    expect(parseMoves('r')).toEqual([wide('R', 2)]);
    expect(parseMoves('3Rw')).toEqual([wide('R', 3)]);
    expect(parseMoves('2R')).toEqual([slice('R', 2)]);
    expect(parseMoves("2R'")).toEqual([slice('R', 2, 3)]);
  });
});
