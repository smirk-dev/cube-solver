import { useEffect } from 'react';
import { useCubeStore } from '../state/cubeStore';
import { moveCue } from './moveCues';
import styles from './StepController.module.css';

export function StepController() {
  const solveStatus = useCubeStore((s) => s.solveStatus);
  const solveError = useCubeStore((s) => s.solveError);
  const solution = useCubeStore((s) => s.solution);
  const stepIndex = useCubeStore((s) => s.stepIndex);
  const nextStep = useCubeStore((s) => s.nextStep);
  const prevStep = useCubeStore((s) => s.prevStep);
  const toStart = useCubeStore((s) => s.toStart);
  const goToStep = useCubeStore((s) => s.goToStep);

  const total = solution?.length ?? 0;
  const atEnd = stepIndex >= total;
  const ready = solveStatus === 'ready' && total > 0;

  // Keyboard stepping (arrows / home / end).
  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') {
        nextStep();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
        e.preventDefault();
      } else if (e.key === 'Home') {
        toStart();
        e.preventDefault();
      } else if (e.key === 'End') {
        goToStep(total);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready, total, nextStep, prevStep, toStart, goToStep]);

  if (solveStatus === 'solving') {
    return (
      <div className={styles.panel}>
        <div className={styles.stage} aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <p className={styles.cue}>Solving…</p>
        </div>
      </div>
    );
  }

  if (solveStatus === 'error') {
    return (
      <div className={styles.panel}>
        <div className={styles.head}>
          <span className={styles.counter}>Can’t solve</span>
        </div>
        <div className={styles.stage} aria-live="polite">
          <p className={styles.move} aria-hidden="true">
            !
          </p>
          <p className={styles.error}>{solveError}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className={styles.panel}>
        <div className={styles.head}>
          <span className={styles.counter}>Step 0 of 0</span>
        </div>
        <div className={styles.stage} aria-live="polite">
          <p className={styles.move} aria-hidden="true">
            –
          </p>
          <p className={styles.cue}>Enter or scan a scramble, then press Solve to get a step-by-step solve.</p>
        </div>
      </div>
    );
  }

  const cue = atEnd ? null : moveCue(solution![stepIndex]);
  const nextMove = stepIndex + 1 < total ? solution![stepIndex + 1] : null;
  const progress = total === 0 ? 0 : (stepIndex / total) * 100;

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.counter}>
          {atEnd ? 'Solved' : `Step ${stepIndex + 1} of ${total}`}
        </span>
        <span className={styles.moveCount}>{total} moves</span>
      </div>

      <div className={styles.stage} aria-live="polite">
        {atEnd ? (
          <>
            <p className={styles.solved} aria-hidden="true">
              ✓
            </p>
            <p className={styles.cue}>Solved! Step back to review any move.</p>
          </>
        ) : (
          <>
            <p className={styles.move}>
              <span className={styles.arrow} aria-hidden="true">
                {cue!.arrow}
              </span>
              {cue!.move}
            </p>
            <p className={styles.cue}>{cue!.text}</p>
          </>
        )}
      </div>

      <div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={stepIndex}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {solution && (
        <div className={styles.strip} aria-hidden="true">
          {solution.map((mv, i) => (
            <button
              key={i}
              type="button"
              className={styles.chip}
              data-state={i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'todo'}
              onClick={() => goToStep(i)}
              tabIndex={-1}
            >
              {mv}
            </button>
          ))}
        </div>
      )}

      <div className={styles.controls}>
        <button type="button" className={styles.nav} onClick={prevStep} disabled={stepIndex === 0}>
          Back
        </button>
        <span className={styles.next}>{nextMove ? `Next: ${nextMove}` : ' '}</span>
        <button type="button" className={styles.nav} data-primary onClick={nextStep} disabled={atEnd}>
          Next
        </button>
      </div>
    </div>
  );
}
