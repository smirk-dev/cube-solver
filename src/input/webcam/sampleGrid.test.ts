import { describe, it, expect } from 'vitest';
import { sampleGrid, centeredSquareRegion } from './sampleGrid';

describe('sampleGrid', () => {
  it('recovers solid cell colors from a synthetic frame', () => {
    const width = 320;
    const height = 240;
    const size = 3;
    const data = new Uint8ClampedArray(width * height * 4);

    const region = centeredSquareRegion(width, height);
    const cellW = region.w / size;
    const cellH = region.h / size;

    // Distinct color per cell = (r: 40*idx, g: 9*idx, b: 255-20*idx).
    const colorFor = (idx: number) => ({ r: 20 + 25 * idx, g: 10 + 9 * idx, b: 250 - 20 * idx });

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const idx = r * size + c;
        const col = colorFor(idx);
        const x0 = Math.floor(region.x + c * cellW);
        const x1 = Math.floor(region.x + (c + 1) * cellW);
        const y0 = Math.floor(region.y + r * cellH);
        const y1 = Math.floor(region.y + (r + 1) * cellH);
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * width + x) * 4;
            data[i] = col.r;
            data[i + 1] = col.g;
            data[i + 2] = col.b;
            data[i + 3] = 255;
          }
        }
      }
    }

    const samples = sampleGrid(data, width, height, region, size);
    expect(samples).toHaveLength(9);
    samples.forEach((s, idx) => {
      const col = colorFor(idx);
      expect(Math.abs(s.r - col.r)).toBeLessThanOrEqual(2);
      expect(Math.abs(s.g - col.g)).toBeLessThanOrEqual(2);
      expect(Math.abs(s.b - col.b)).toBeLessThanOrEqual(2);
    });
  });
});
