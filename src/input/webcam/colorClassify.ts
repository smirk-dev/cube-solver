/* ----------------------------------------------------------------------------
   Color classification for webcam scanning.

   We don't try to recognize absolute colors (lighting varies wildly). Instead we
   anchor to the puzzle itself: the six face CENTER stickers are, by definition,
   the six colors. Capturing all faces first gives us six reference swatches
   measured under the same lighting — a per-scan white balance. Every other
   sticker is then assigned to its nearest reference in CIELAB space.

   This keeps the classifier simple and robust without OpenCV; misreads are rare
   and the user can fix any sticker in the grid before solving.
---------------------------------------------------------------------------- */

import { FACES, centerIndex, type Face, type FaceletState } from '../../state/facelets';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Lab {
  L: number;
  a: number;
  b: number;
}

/** Raw sampled colors per face: size² stickers each, row-major. */
export type FaceSamples = Record<Face, Rgb[]>;

function srgbToLinear(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

export function rgbToLab({ r, g, b }: Rgb): Lab {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);

  // Linear sRGB → XYZ (D65)
  const x = R * 0.4124 + G * 0.3576 + B * 0.1805;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = R * 0.0193 + G * 0.1192 + B * 0.9505;

  // XYZ → CIELAB (D65 reference white)
  const xn = 0.95047;
  const yn = 1.0;
  const zn = 1.08883;
  const d = 6 / 29;
  const f = (t: number): number => (t > d ** 3 ? Math.cbrt(t) : t / (3 * d * d) + 4 / 29);
  const fx = f(x / xn);
  const fy = f(y / yn);
  const fz = f(z / zn);

  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

/** CIE76 color difference (Euclidean distance in LAB). */
export function deltaE(a: Lab, b: Lab): number {
  return Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b);
}

export interface ClassifyResult {
  state: FaceletState;
  /** Per-face, per-sticker margin between the best and second-best reference.
   *  Small values flag stickers worth double-checking. */
  confidence: Record<Face, number[]>;
}

/**
 * Classify all stickers using each face's center as the reference for its color.
 * Requires an odd size (so every face has a true center).
 */
export function classifyFaces(samples: FaceSamples, size: number): ClassifyResult {
  if (size % 2 === 0) {
    throw new Error('classifyFaces needs centers (odd size); even cubes use a different anchor.');
  }
  const c = centerIndex(size);
  const anchors = FACES.map((face) => ({ face, lab: rgbToLab(samples[face][c]) }));

  const stickers = {} as FaceletState['stickers'];
  const confidence = {} as Record<Face, number[]>;

  for (const face of FACES) {
    const out: (Face | null)[] = [];
    const conf: number[] = [];
    for (let i = 0; i < size * size; i++) {
      const lab = rgbToLab(samples[face][i]);
      let best = anchors[0];
      let bestD = Infinity;
      let secondD = Infinity;
      for (const anchor of anchors) {
        const d = deltaE(lab, anchor.lab);
        if (d < bestD) {
          secondD = bestD;
          bestD = d;
          best = anchor;
        } else if (d < secondD) {
          secondD = d;
        }
      }
      out.push(best.face);
      conf.push(secondD - bestD);
    }
    stickers[face] = out;
    confidence[face] = conf;
  }

  return { state: { size, stickers }, confidence };
}
