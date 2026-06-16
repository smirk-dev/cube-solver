import { GUIDE_FRACTION } from './sampleGrid';
import styles from './AlignmentGuide.module.css';

/**
 * On-screen N×N alignment grid. Marks the exact centered square that
 * sampleGrid() reads, so what the user lines up is what gets sampled.
 */
export function AlignmentGuide({ size }: { size: number }) {
  return (
    <div className={styles.overlay} aria-hidden="true">
      <div
        className={styles.square}
        style={{
          width: `${GUIDE_FRACTION * 100}%`,
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
        }}
      >
        {Array.from({ length: size * size }).map((_, i) => (
          <span key={i} className={styles.cell} />
        ))}
      </div>
    </div>
  );
}
