import { useCubeStore } from '../state/cubeStore';
import { PUZZLES, PUZZLE_ORDER } from '../state/puzzles';
import styles from './CubeTypePills.module.css';

export function CubeTypePills() {
  const puzzleId = useCubeStore((s) => s.puzzleId);
  const setPuzzle = useCubeStore((s) => s.setPuzzle);

  return (
    <nav className={styles.pills} aria-label="Puzzle type">
      {PUZZLE_ORDER.map((id) => {
        const def = PUZZLES[id];
        const active = id === puzzleId;
        return (
          <button
            key={id}
            type="button"
            className={styles.pill}
            data-active={active}
            aria-pressed={active}
            onClick={() => setPuzzle(id)}
          >
            {def.label}
          </button>
        );
      })}
    </nav>
  );
}
