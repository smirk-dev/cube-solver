import { useEffect, useRef } from 'react';
import { useCubeStore } from '../state/cubeStore';
import { FACES, centerIndex, type Face } from '../state/facelets';
import styles from './ManualColorGrid.module.css';

const COLOR_NAME: Record<Face, string> = {
  U: 'White',
  R: 'Red',
  F: 'Green',
  D: 'Yellow',
  L: 'Orange',
  B: 'Blue',
};

const FACE_LABEL: Record<Face, string> = {
  U: 'Up',
  R: 'Right',
  F: 'Front',
  D: 'Down',
  L: 'Left',
  B: 'Back',
};

// Net layout: U on top, the L F R B band in the middle, D on the bottom.
const NET_AREA: Record<Face, string> = { U: 'u', L: 'l', F: 'f', R: 'r', B: 'b', D: 'd' };

function FaceGrid({
  face,
  size,
  stickers,
  locked,
  onPaint,
}: {
  face: Face;
  size: number;
  stickers: (Face | null)[];
  locked: number;
  onPaint: (index: number) => void;
}) {
  return (
    <div
      className={styles.face}
      style={{ gridArea: NET_AREA[face], gridTemplateColumns: `repeat(${size}, 1fr)` }}
      aria-label={`${FACE_LABEL[face]} face`}
    >
      {stickers.map((value, index) => {
        const isLocked = index === locked;
        return (
          <button
            key={index}
            type="button"
            className={styles.sticker}
            data-locked={isLocked}
            style={{ background: value ? `var(--sticker-${value})` : 'var(--sticker-empty)' }}
            aria-label={`${FACE_LABEL[face]} ${index + 1}: ${value ? COLOR_NAME[value] : 'empty'}`}
            disabled={isLocked}
            onPointerDown={() => !isLocked && onPaint(index)}
            onPointerEnter={(e) => {
              if (!isLocked && e.buttons === 1) onPaint(index);
            }}
          />
        );
      })}
    </div>
  );
}

export function ManualColorGrid() {
  const editState = useCubeStore((s) => s.editState);
  const paintColor = useCubeStore((s) => s.paintColor);
  const setPaintColor = useCubeStore((s) => s.setPaintColor);
  const setSticker = useCubeStore((s) => s.setSticker);

  const size = editState.size;
  const locked = size % 2 === 1 ? centerIndex(size) : -1;

  // Prevent text selection while drag-painting.
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const prevent = (e: Event) => e.preventDefault();
    el.addEventListener('dragstart', prevent);
    return () => el.removeEventListener('dragstart', prevent);
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.palette} role="radiogroup" aria-label="Paint color">
        {FACES.map((face) => (
          <button
            key={face}
            type="button"
            role="radio"
            aria-checked={paintColor === face}
            aria-label={COLOR_NAME[face]}
            title={COLOR_NAME[face]}
            className={styles.swatch}
            data-active={paintColor === face}
            style={{ background: `var(--sticker-${face})` }}
            onClick={() => setPaintColor(face)}
          />
        ))}
      </div>

      <div className={styles.net} ref={gridRef}>
        {FACES.map((face) => (
          <FaceGrid
            key={face}
            face={face}
            size={size}
            stickers={editState.stickers[face]}
            locked={locked}
            onPaint={(index) => setSticker(face, index, paintColor)}
          />
        ))}
      </div>
    </div>
  );
}
