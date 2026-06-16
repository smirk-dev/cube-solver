import { describe, it, expect } from 'vitest';
import { FACES, solvedState, type Face, type FaceletState } from '../../state/facelets';
import { applyNotation } from '../../state/faceletMoves';
import { classifyFaces, rgbToLab, deltaE, type FaceSamples, type Rgb } from './colorClassify';

// Representative sRGB for the standard Western scheme.
const BASE: Record<Face, Rgb> = {
  U: { r: 245, g: 245, b: 245 }, // white
  R: { r: 200, g: 30, b: 30 }, // red
  F: { r: 0, g: 150, b: 70 }, // green
  D: { r: 255, g: 210, b: 0 }, // yellow
  L: { r: 240, g: 110, b: 20 }, // orange
  B: { r: 20, g: 70, b: 180 }, // blue
};

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const clamp = (x: number) => Math.max(0, Math.min(255, Math.round(x)));

/** Build webcam-like samples from a known state, with per-face lighting + noise. */
function samplesFromState(
  state: FaceletState,
  rng: () => number,
  noise: number,
): FaceSamples {
  const samples = {} as FaceSamples;
  for (const face of FACES) {
    // Each physical face is lit a bit differently.
    const gain = 0.85 + rng() * 0.2; // 0.85 .. 1.05
    const arr: Rgb[] = state.stickers[face].map((value) => {
      const base = BASE[value as Face];
      return {
        r: clamp(base.r * gain + (rng() - 0.5) * 2 * noise),
        g: clamp(base.g * gain + (rng() - 0.5) * 2 * noise),
        b: clamp(base.b * gain + (rng() - 0.5) * 2 * noise),
      };
    });
    samples[face] = arr;
  }
  return samples;
}

function accuracy(truth: FaceletState, guess: FaceletState): number {
  let correct = 0;
  let total = 0;
  for (const face of FACES) {
    for (let i = 0; i < truth.stickers[face].length; i++) {
      total++;
      if (truth.stickers[face][i] === guess.stickers[face][i]) correct++;
    }
  }
  return correct / total;
}

describe('colorClassify', () => {
  it('LAB distance separates the six cube colors', () => {
    const labs = FACES.map((f) => rgbToLab(BASE[f]));
    for (let i = 0; i < labs.length; i++) {
      for (let j = i + 1; j < labs.length; j++) {
        expect(deltaE(labs[i], labs[j])).toBeGreaterThan(15);
      }
    }
  });

  it('classifies noise-free samples perfectly', () => {
    const state = applyNotation(solvedState(3), "R U R' U' F2 L D' B R2");
    const samples = samplesFromState(state, makeRng(1), 0);
    const { state: guess } = classifyFaces(samples, 3);
    expect(accuracy(state, guess)).toBe(1);
  });

  it('stays ≥95% accurate under per-face lighting and sensor noise', () => {
    const rng = makeRng(424242);
    let totalAcc = 0;
    const trials = 40;
    for (let t = 0; t < trials; t++) {
      const state = applyNotation(solvedState(3), "F R U2 B' L D R' U F2 L2 B D2");
      const samples = samplesFromState(state, rng, 10);
      const { state: guess } = classifyFaces(samples, 3);
      totalAcc += accuracy(state, guess);
    }
    expect(totalAcc / trials).toBeGreaterThanOrEqual(0.95);
  });

  it('always returns the center as its own face color', () => {
    const state = applyNotation(solvedState(3), "U D' R2 F");
    const { state: guess } = classifyFaces(samplesFromState(state, makeRng(5), 8), 3);
    for (const face of FACES) {
      expect(guess.stickers[face][4]).toBe(face);
    }
  });
});
