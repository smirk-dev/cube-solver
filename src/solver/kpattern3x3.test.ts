import { describe, it, expect, beforeAll } from 'vitest';
import { cube3x3x3 } from 'cubing/puzzles';
import type { KPuzzle } from 'cubing/kpuzzle';
import { FACES, solvedState, type FaceletState } from '../state/facelets';
import { applyNotation } from '../state/faceletMoves';
import { faceletsToPatternData3x3, patternDataToFacelets3x3 } from './kpattern3x3';

// Small seeded RNG so any failing scramble is reproducible.
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const OUTER_FACES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
const SUFFIX = ['', "'", '2'] as const;

function randomScramble(rng: () => number, length: number): string {
  const moves: string[] = [];
  let prev = -1;
  for (let i = 0; i < length; i++) {
    let f = Math.floor(rng() * 6);
    if (f === prev) f = (f + 1) % 6; // avoid trivial repeats
    prev = f;
    moves.push(OUTER_FACES[f] + SUFFIX[Math.floor(rng() * 3)]);
  }
  return moves.join(' ');
}

function statesEqual(a: FaceletState, b: FaceletState): boolean {
  return FACES.every((f) => a.stickers[f].every((v, i) => v === b.stickers[f][i]));
}

describe('facelet move engine', () => {
  it('each outer face turned 4× returns to solved', () => {
    for (const f of OUTER_FACES) {
      const s = applyNotation(solvedState(3), `${f} ${f} ${f} ${f}`);
      expect(statesEqual(s, solvedState(3))).toBe(true);
    }
  });

  it('a move followed by its inverse is identity', () => {
    const s = applyNotation(solvedState(3), "R U F D L B B' L' D' F' U' R'");
    expect(statesEqual(s, solvedState(3))).toBe(true);
  });

  it('the sexy move repeated 6× returns to solved', () => {
    let s: FaceletState = solvedState(3);
    for (let i = 0; i < 6; i++) s = applyNotation(s, "R U R' U'");
    expect(statesEqual(s, solvedState(3))).toBe(true);
  });

  it('every move preserves the 9-per-color sticker count', () => {
    const s = applyNotation(solvedState(3), randomScramble(makeRng(7), 40));
    for (const f of FACES) expect(s.stickers[f].length).toBe(9);
    const total: Record<string, number> = {};
    for (const f of FACES) for (const v of s.stickers[f]) total[v as string] = (total[v as string] ?? 0) + 1;
    for (const f of FACES) expect(total[f]).toBe(9);
  });
});

describe('facelet ⇄ KPattern (cross-validated against cubing.js)', () => {
  let kpuzzle: KPuzzle;
  beforeAll(async () => {
    kpuzzle = await cube3x3x3.kpuzzle();
  });

  const single = ['U', 'R', 'F', 'D', 'L', 'B'];
  it.each(single)('matches cubing.js for single move %s', (mv) => {
    const truth = kpuzzle.defaultPattern().applyAlg(mv).patternData;
    const mine = faceletsToPatternData3x3(applyNotation(solvedState(3), mv));
    expect(mine.CORNERS.pieces).toEqual(truth.CORNERS.pieces);
    expect(mine.CORNERS.orientation).toEqual(truth.CORNERS.orientation);
    expect(mine.EDGES.pieces).toEqual(truth.EDGES.pieces);
    expect(mine.EDGES.orientation).toEqual(truth.EDGES.orientation);
  });

  it('matches cubing.js orbit data for 500 random scrambles', () => {
    const rng = makeRng(12345);
    for (let i = 0; i < 500; i++) {
      const scramble = randomScramble(rng, 25);
      const truth = kpuzzle.defaultPattern().applyAlg(scramble).patternData;
      const mine = faceletsToPatternData3x3(applyNotation(solvedState(3), scramble));
      expect(mine.CORNERS.pieces, `corners perm @ "${scramble}"`).toEqual(truth.CORNERS.pieces);
      expect(mine.CORNERS.orientation, `corners ori @ "${scramble}"`).toEqual(truth.CORNERS.orientation);
      expect(mine.EDGES.pieces, `edges perm @ "${scramble}"`).toEqual(truth.EDGES.pieces);
      expect(mine.EDGES.orientation, `edges ori @ "${scramble}"`).toEqual(truth.EDGES.orientation);
    }
  });

  it('facelets → patternData → facelets round-trips', () => {
    const rng = makeRng(999);
    for (let i = 0; i < 100; i++) {
      const scramble = randomScramble(rng, 20);
      const original = applyNotation(solvedState(3), scramble);
      const data = faceletsToPatternData3x3(original);
      const back = patternDataToFacelets3x3(data);
      expect(statesEqual(back, original), `round-trip @ "${scramble}"`).toBe(true);
    }
  });
});
