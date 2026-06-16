import { useCubeStore } from '../state/cubeStore';
import { PUZZLES } from '../state/puzzles';
import { PRESETS_3X3 } from '../state/presets';
import { InputModeToggle } from '../ui/InputModeToggle';
import { ManualColorGrid } from './ManualColorGrid';
import { CameraScanner } from './webcam/CameraScanner';
import styles from './InputPanel.module.css';

export function InputPanel() {
  const puzzleId = useCubeStore((s) => s.puzzleId);
  const inputMode = useCubeStore((s) => s.inputMode);
  const size = useCubeStore((s) => s.size());
  const solveStatus = useCubeStore((s) => s.solveStatus);
  const solveCurrent = useCubeStore((s) => s.solveCurrent);
  const resetEdit = useCubeStore((s) => s.resetEdit);
  const loadPreset = useCubeStore((s) => s.loadPreset);
  const scrambleCube = useCubeStore((s) => s.scramble);
  const setEditState = useCubeStore((s) => s.setEditState);
  const scanReview = useCubeStore((s) => s.scanReview);
  const setScanReview = useCubeStore((s) => s.setScanReview);

  const def = PUZZLES[puzzleId];
  const solvable = puzzleId === '2x2' || puzzleId === '3x3';
  const colorCube = def.kind === 'color';

  const showCamera = inputMode === 'scan' && !scanReview;
  const showGrid = inputMode === 'manual' || (inputMode === 'scan' && scanReview);

  return (
    <div className={styles.panel}>
      <div className={styles.bar}>
        <InputModeToggle />
        <div className={styles.actions}>
          {puzzleId === '3x3' && inputMode === 'manual' && (
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
          {colorCube && inputMode === 'manual' && (
            <button type="button" className={styles.ghost} onClick={scrambleCube}>
              Scramble
            </button>
          )}
          {inputMode === 'scan' && scanReview && (
            <button type="button" className={styles.ghost} onClick={() => setScanReview(false)}>
              Rescan
            </button>
          )}
          {showGrid && (
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
      {!solvable && colorCube && (
        <p className={styles.note}>
          Solving {def.label} is experimental and not available yet — you can still scan, paint, and
          preview it in 3D.
        </p>
      )}
      {inputMode === 'scan' && scanReview && (
        <p className={styles.note}>Scanned — fix any mis-read stickers below, then Solve.</p>
      )}

      <div className={styles.body}>
        {showCamera ? (
          <CameraScanner
            size={size}
            onComplete={(state) => {
              setEditState(state);
              setScanReview(true);
            }}
          />
        ) : (
          <ManualColorGrid />
        )}
      </div>
    </div>
  );
}
