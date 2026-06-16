import { CubeTypePills } from './CubeTypePills';
import styles from './TopBar.module.css';

export function TopBar() {
  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className={styles.word}>Cube Solver</span>
      </div>
      <CubeTypePills />
    </header>
  );
}
