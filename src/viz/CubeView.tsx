import { useEffect, useRef } from 'react';
import { TwistyPlayer, type TwistyPlayerConfig } from 'cubing/twisty';
import { useCubeStore } from '../state/cubeStore';
import styles from './CubeView.module.css';

/**
 * Wraps a cubing.js TwistyPlayer. Phase 0 shows the selected puzzle in its
 * solved state; later phases drive `alg`/setup state and step playback from the
 * store. The player is a framework-agnostic web component, so we mount it
 * imperatively into a ref'd container and recreate it when the puzzle changes.
 */
export function CubeView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const twistyId = useCubeStore((s) => s.twistyId());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const player = new TwistyPlayer({
      puzzle: twistyId as TwistyPlayerConfig['puzzle'],
      visualization: '3D',
      background: 'none',
      controlPanel: 'none',
      hintFacelets: 'floating',
      backView: 'top-right',
    });
    player.className = styles.player;
    container.appendChild(player);

    return () => {
      player.remove();
    };
  }, [twistyId]);

  return <div ref={containerRef} className={styles.viewport} aria-label="3D cube view" />;
}
