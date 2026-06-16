import { TopBar } from './ui/TopBar';
import { CubeView } from './viz/CubeView';
import { StepController } from './playback/StepController';
import { InputPanel } from './input/InputPanel';
import styles from './App.module.css';

function App() {
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
          <InputPanel />
        </div>
      </footer>
    </div>
  );
}

export default App;
