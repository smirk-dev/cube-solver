import { useCubeStore } from '../state/cubeStore';
import { PUZZLES } from '../state/puzzles';
import { PRESETS_3X3 } from '../state/presets';
import { InputModeToggle } from '../ui/InputModeToggle';
import { ManualColorGrid } from './ManualColorGrid';
import styles from './InputPanel.module.css';

export function InputPanel() {
  const puzzleId = useCubeStore((s) => s.puzzleId);
  const inputMode = useCubeStore((s) => s.inputMode);
  const solveStatus = useCubeStore((s) => s.solveStatus);
  const solveCurrent = useCubeStore((s) => s.solveCurrent);
  const resetEdit = useCubeStore((s) => s.resetEdit);
  const loadPreset = useCubeStore((s) => s.loadPreset);

  const def = PUZZLES[puzzleId];
  const solvable = puzzleId === '3x3'; // Phase 1 scope

  return (
    <div className={styles.panel}>
      <div className={styles.bar}>
        <InputModeToggle />
        <div className={styles.actions}>
          {solvable && inputMode === 'manual' && (
            <select
              className={styles.select}
              value=""
              aria-label="Load a scramble preset"
              onChange={(e) => {
                if (e.target.value) loadPreset(e.target.value);
              }}
            >
              <option value="">Load scramble…</option>
              {PRESETS_3X3.map((p) => (
                <option key={p.name} value={p.scramble}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          {inputMode === 'manual' && (
            <button type="button" className={styles.ghost} onClick={resetEdit}>
              Reset
            </button>
          )}
          <button
            type="button"
            className={styles.solve}
            disabled={!solvable || solveStatus === 'solving'}
            onClick={solveCurrent}
          >
            {solveStatus === 'solving' ? 'Solving…' : 'Solve'}
          </button>
        </div>
      </div>

      {def.note && <p className={styles.note}>{def.note}</p>}
      {!solvable && (
        <p className={styles.note}>
          Solving {def.label} arrives in a later phase — you can still paint and preview it.
        </p>
      )}

      <div className={styles.body}>
        {inputMode === 'scan' ? (
          <p className={styles.placeholder}>Camera scanning lands in Phase 2.</p>
        ) : (
          <ManualColorGrid />
        )}
      </div>
    </div>
  );
}
