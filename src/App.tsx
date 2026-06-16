import { TopBar } from './ui/TopBar';
import { CubeView } from './viz/CubeView';
import { StepController } from './playback/StepController';
import { InputModeToggle } from './ui/InputModeToggle';
import { useCubeStore } from './state/cubeStore';
import { PUZZLES } from './state/puzzles';
import styles from './App.module.css';

function App() {
  const puzzleId = useCubeStore((s) => s.puzzleId);
  const inputMode = useCubeStore((s) => s.inputMode);
  const def = PUZZLES[puzzleId];

  return (
    <div className={styles.app}>
      <TopBar />

      <main className={styles.main}>
        <section className={styles.vizPane} aria-label="Cube">
          <CubeView />
        </section>
        <section className={styles.sidePane} aria-label="Solve steps">
          <StepController />
        </section>
      </main>

      <footer className={styles.inputBar}>
        <div className={styles.inputBarInner}>
          <div className={styles.inputBarHead}>
            <InputModeToggle />
            {def.note && <p className={styles.note}>{def.note}</p>}
          </div>
          <div className={styles.inputArea}>
            <p className={styles.placeholder}>
              {inputMode === 'scan'
                ? 'Camera scanning lands in Phase 2.'
                : 'Manual entry lands in Phase 1.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
