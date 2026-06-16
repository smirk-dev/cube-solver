import styles from './StepController.module.css';

/**
 * Step panel. Phase 0 renders the empty state and the control layout; Phase 1
 * wires it to the computed solution (current move, human cue, progress, stepping).
 */
export function StepController() {
  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.counter}>Step 0 of 0</span>
      </div>

      <div className={styles.stage}>
        <p className={styles.move} aria-hidden="true">
          –
        </p>
        <p className={styles.cue}>Enter or scan a scramble to get a step-by-step solve.</p>
      </div>

      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: '0%' }} />
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.nav} disabled>
          Back
        </button>
        <span className={styles.next}>Next: —</span>
        <button type="button" className={styles.nav} data-primary disabled>
          Next
        </button>
      </div>
    </div>
  );
}
