import { useCubeStore } from '../state/cubeStore';
import { PUZZLES } from '../state/puzzles';
import styles from './InputModeToggle.module.css';

export function InputModeToggle() {
  const puzzleId = useCubeStore((s) => s.puzzleId);
  const inputMode = useCubeStore((s) => s.inputMode);
  const setInputMode = useCubeStore((s) => s.setInputMode);
  const scannable = PUZZLES[puzzleId].scannable;

  return (
    <div className={styles.toggle} role="tablist" aria-label="Input method">
      <button
        type="button"
        role="tab"
        aria-selected={inputMode === 'scan'}
        className={styles.option}
        data-active={inputMode === 'scan'}
        disabled={!scannable}
        title={scannable ? undefined : 'Shape-mods are a single color — scan isn’t possible'}
        onClick={() => setInputMode('scan')}
      >
        Scan
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={inputMode === 'manual'}
        className={styles.option}
        data-active={inputMode === 'manual'}
        onClick={() => setInputMode('manual')}
      >
        Manual
      </button>
    </div>
  );
}
