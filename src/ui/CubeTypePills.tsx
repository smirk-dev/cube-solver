import { useCubeStore } from '../state/cubeStore';
import { NXN_MAX, NXN_MIN, PUZZLES, PUZZLE_ORDER } from '../state/puzzles';
import styles from './CubeTypePills.module.css';

export function CubeTypePills() {
  const puzzleId = useCubeStore((s) => s.puzzleId);
  const setPuzzle = useCubeStore((s) => s.setPuzzle);
  const nxnSize = useCubeStore((s) => s.nxnSize);
  const setNxnSize = useCubeStore((s) => s.setNxnSize);

  const sizes: number[] = [];
  for (let n = NXN_MIN; n <= NXN_MAX; n++) sizes.push(n);

  return (
    <div className={styles.row}>
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

      {puzzleId === 'nxn' && (
        <div className={styles.sizePicker} role="group" aria-label="Cube size">
          {sizes.map((n) => (
            <button
              key={n}
              type="button"
              className={styles.size}
              data-active={n === nxnSize}
              aria-pressed={n === nxnSize}
              onClick={() => setNxnSize(n)}
            >
              {n}×{n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
