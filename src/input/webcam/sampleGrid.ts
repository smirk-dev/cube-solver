/* ----------------------------------------------------------------------------
   Sample an N×N grid of average sticker colors from a captured video frame.
   Pure (operates on raw RGBA pixel data) so it can be unit-tested without a DOM.
---------------------------------------------------------------------------- */

import type { Rgb } from './colorClassify';

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Fraction of the smaller frame dimension the alignment square covers. */
export const GUIDE_FRACTION = 0.62;

/** The centered square the alignment guide marks (in frame pixel coords). */
export function centeredSquareRegion(width: number, height: number): Region {
  const side = Math.min(width, height) * GUIDE_FRACTION;
  return { x: (width - side) / 2, y: (height - side) / 2, w: side, h: side };
}

/**
 * Average the color of each sticker cell. For each of the size×size cells we
 * average a patch around the cell center (ignoring the gaps/edges between
 * stickers), which suppresses sensor noise and grid-line bleed.
 */
export function sampleGrid(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  region: Region,
  size: number,
): Rgb[] {
  const out: Rgb[] = [];
  const cellW = region.w / size;
  const cellH = region.h / size;
  const patch = Math.max(1, Math.floor(Math.min(cellW, cellH) * 0.28));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cx = Math.round(region.x + (c + 0.5) * cellW);
      const cy = Math.round(region.y + (r + 0.5) * cellH);

      let sr = 0;
      let sg = 0;
      let sb = 0;
      let n = 0;
      for (let dy = -patch; dy <= patch; dy++) {
        const y = cy + dy;
        if (y < 0 || y >= height) continue;
        for (let dx = -patch; dx <= patch; dx++) {
          const x = cx + dx;
          if (x < 0 || x >= width) continue;
          const i = (y * width + x) * 4;
          sr += data[i];
          sg += data[i + 1];
          sb += data[i + 2];
          n++;
        }
      }
      out.push(n > 0 ? { r: sr / n, g: sg / n, b: sb / n } : { r: 0, g: 0, b: 0 });
    }
  }
  return out;
}
