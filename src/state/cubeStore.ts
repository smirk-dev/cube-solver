/* ----------------------------------------------------------------------------
   Global app store (zustand).

   Phase 0 scope: which puzzle is selected, the chosen N for NxN, and the active
   input mode. Later phases extend this with the captured facelet state, the
   computed solution, and the current playback step.
---------------------------------------------------------------------------- */

import { create } from 'zustand';
import {
  NXN_DEFAULT,
  NXN_MAX,
  NXN_MIN,
  PUZZLES,
  effectiveSize,
  twistyPuzzleId,
  type PuzzleId,
} from './puzzles';

export type InputMode = 'scan' | 'manual';

interface CubeStore {
  puzzleId: PuzzleId;
  /** Chosen N when puzzleId === 'nxn'. */
  nxnSize: number;
  inputMode: InputMode;

  setPuzzle: (id: PuzzleId) => void;
  setNxnSize: (n: number) => void;
  setInputMode: (mode: InputMode) => void;

  /** Effective grid dimension for the current selection. */
  size: () => number;
  /** cubing.js puzzle id for the current selection. */
  twistyId: () => string;
}

export const useCubeStore = create<CubeStore>((set, get) => ({
  puzzleId: '3x3',
  nxnSize: NXN_DEFAULT,
  inputMode: 'manual',

  setPuzzle: (id) =>
    set((state) => {
      // Shape-mods can't be scanned; force manual input when selected.
      const inputMode = PUZZLES[id].scannable ? state.inputMode : 'manual';
      return { puzzleId: id, inputMode };
    }),

  setNxnSize: (n) => set({ nxnSize: Math.min(NXN_MAX, Math.max(NXN_MIN, Math.round(n))) }),

  setInputMode: (mode) => set({ inputMode: mode }),

  size: () => effectiveSize(get().puzzleId, get().nxnSize),
  twistyId: () => twistyPuzzleId(get().puzzleId, get().nxnSize),
}));
