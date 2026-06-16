/* ----------------------------------------------------------------------------
   Normalized, size-agnostic facelet model.

   Every input method (manual grid, webcam scan, shape entry) produces a
   FaceletState. The solver and the 3D view both consume it.

   Face order is URFDLB (Kociemba convention). A sticker's value is the Face
   whose center color it matches — this keeps the model independent of any
   particular color scheme. A solved cube has every sticker on face X equal X.
---------------------------------------------------------------------------- */

/** The six faces, in Kociemba URFDLB order. */
export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
export type Face = (typeof FACES)[number];

/** A single sticker: the face-color it belongs to, or null when unassigned. */
export type FaceletValue = Face | null;

/**
 * A puzzle state as six N×N faces. `stickers[face]` is a row-major array of
 * length size*size, read top-left → bottom-right when the face is held in its
 * canonical orientation (see docs/orientation in the conversions module).
 */
export interface FaceletState {
  size: number;
  stickers: Record<Face, FaceletValue[]>;
}

/** The reference color (Western scheme) each face maps to, for display only. */
export const FACE_REFERENCE_COLOR: Record<Face, string> = {
  U: 'white',
  R: 'red',
  F: 'green',
  D: 'yellow',
  L: 'orange',
  B: 'blue',
};

/** Build a solved state of the given size (every sticker matches its face). */
export function solvedState(size: number): FaceletState {
  const stickers = {} as Record<Face, FaceletValue[]>;
  for (const face of FACES) {
    stickers[face] = new Array(size * size).fill(face);
  }
  return { size, stickers };
}

/** Build an empty (fully unassigned) state of the given size. */
export function emptyState(size: number): FaceletState {
  const stickers = {} as Record<Face, FaceletValue[]>;
  for (const face of FACES) {
    stickers[face] = new Array(size * size).fill(null);
  }
  return { size, stickers };
}

/** Deep clone a state. */
export function cloneState(state: FaceletState): FaceletState {
  const stickers = {} as Record<Face, FaceletValue[]>;
  for (const face of FACES) {
    stickers[face] = state.stickers[face].slice();
  }
  return { size: state.size, stickers };
}

/** True when every sticker is assigned (no nulls). */
export function isComplete(state: FaceletState): boolean {
  return FACES.every((face) => state.stickers[face].every((v) => v !== null));
}

/** The index of a face's center sticker (only meaningful for odd sizes). */
export function centerIndex(size: number): number {
  return Math.floor((size * size) / 2);
}
