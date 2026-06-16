/* ----------------------------------------------------------------------------
   Global app store (zustand).

   Holds the puzzle selection, the working facelet state being edited, the
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
import {
  cloneState,
  solvedState,
  type Face,
  type FaceletState,
} from './facelets';
import { presetState } from './presets';
import { solve } from '../solver';

export type InputMode = 'scan' | 'manual';
export type SolveStatus = 'idle' | 'solving' | 'ready' | 'error';

interface CubeStore {
  // Selection
  puzzleId: PuzzleId;
  nxnSize: number;
  inputMode: InputMode;

  // Editing
  editState: FaceletState;
  paintColor: Face;

  // Solve + playback
  solveStatus: SolveStatus;
  solveError: string | null;
  solution: string[] | null;
  setupString: string | null;
  stepIndex: number; // moves completed, 0..solution.length

  // Selection actions
  setPuzzle: (id: PuzzleId) => void;
  setNxnSize: (n: number) => void;
  setInputMode: (mode: InputMode) => void;

  // Editing actions
  setSticker: (face: Face, index: number, value: Face) => void;
  setPaintColor: (value: Face) => void;
  setEditState: (state: FaceletState) => void;
  resetEdit: () => void;
  loadPreset: (scramble: string) => void;

  // Solve + playback actions
  solveCurrent: () => Promise<void>;
  clearSolution: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  toStart: () => void;
  toEnd: () => void;

  // Derived
  size: () => number;
  twistyId: () => string;
}

const clearedSolve = {
  solveStatus: 'idle' as SolveStatus,
  solveError: null,
  solution: null,
  setupString: null,
  stepIndex: 0,
};

export const useCubeStore = create<CubeStore>((set, get) => ({
  puzzleId: '3x3',
  nxnSize: NXN_DEFAULT,
  inputMode: 'manual',

  // Start on a solvable scramble so the app is immediately demoable.
  editState: presetState("R U R' U R U2 R'"),
  paintColor: 'U',

  ...clearedSolve,

  setPuzzle: (id) =>
    set((state) => {
      const inputMode = PUZZLES[id].scannable ? state.inputMode : 'manual';
      const size = effectiveSize(id, state.nxnSize);
      return {
        puzzleId: id,
        inputMode,
        editState: solvedState(size),
        ...clearedSolve,
      };
    }),

  setNxnSize: (n) =>
    set((state) => {
      const nxnSize = Math.min(NXN_MAX, Math.max(NXN_MIN, Math.round(n)));
      const size = effectiveSize(state.puzzleId, nxnSize);
      return { nxnSize, editState: solvedState(size), ...clearedSolve };
    }),

  setInputMode: (mode) => set({ inputMode: mode }),

  setSticker: (face, index, value) =>
    set((state) => {
      const next = cloneState(state.editState);
      next.stickers[face][index] = value;
      return { editState: next, ...clearedSolve };
    }),

  setPaintColor: (value) => set({ paintColor: value }),

  setEditState: (state) => set({ editState: cloneState(state), ...clearedSolve }),

  resetEdit: () => set((state) => ({ editState: solvedState(get().size()), ...clearedSolve, paintColor: state.paintColor })),

  loadPreset: (scramble) => set({ editState: presetState(scramble), ...clearedSolve }),

  solveCurrent: async () => {
    const { editState, puzzleId } = get();
    set({ solveStatus: 'solving', solveError: null, solution: null, setupString: null, stepIndex: 0 });
    const outcome = await solve(editState, puzzleId);
    // Guard against a newer edit having superseded this solve.
    if (get().solveStatus !== 'solving') return;
    if (outcome.ok) {
      set({
        solveStatus: 'ready',
        solution: outcome.moves,
        setupString: outcome.setupString,
        stepIndex: 0,
        solveError: null,
      });
    } else {
      set({ solveStatus: 'error', solveError: outcome.reason });
    }
  },

  clearSolution: () => set({ ...clearedSolve }),

  nextStep: () =>
    set((state) => {
      if (!state.solution) return {};
      return { stepIndex: Math.min(state.solution.length, state.stepIndex + 1) };
    }),

  prevStep: () => set((state) => ({ stepIndex: Math.max(0, state.stepIndex - 1) })),

  goToStep: (index) =>
    set((state) => {
      if (!state.solution) return {};
      return { stepIndex: Math.min(state.solution.length, Math.max(0, index)) };
    }),

  toStart: () => set({ stepIndex: 0 }),

  toEnd: () => set((state) => (state.solution ? { stepIndex: state.solution.length } : {})),

  size: () => effectiveSize(get().puzzleId, get().nxnSize),
  twistyId: () => twistyPuzzleId(get().puzzleId, get().nxnSize),
}));
