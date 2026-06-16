import { useEffect, useRef, useState } from 'react';
import { FACES, type Face, type FaceletState } from '../../state/facelets';
import { classifyFaces, type FaceSamples, type Rgb } from './colorClassify';
import { centeredSquareRegion, sampleGrid } from './sampleGrid';
import { AlignmentGuide } from './AlignmentGuide';
import styles from './CameraScanner.module.css';

// Capture order + guidance. Orientations are chosen so each sampled grid maps
// directly to our net indices (white up for the side faces; green as the
// reference edge for U/D). Any slip is fixable in the review grid afterward.
const SCAN_ORDER: Face[] = ['F', 'R', 'B', 'L', 'U', 'D'];
const GUIDE: Record<Face, { color: string; hint: string }> = {
  F: { color: 'Green', hint: 'Keep the white face on top' },
  R: { color: 'Red', hint: 'Keep the white face on top' },
  B: { color: 'Blue', hint: 'Keep the white face on top' },
  L: { color: 'Orange', hint: 'Keep the white face on top' },
  U: { color: 'White', hint: 'Tilt up — keep green at the bottom edge' },
  D: { color: 'Yellow', hint: 'Tilt down — keep green at the top edge' },
};

interface Capture {
  samples: Rgb[];
  thumb: string;
}

export function CameraScanner({
  size,
  onComplete,
}: {
  size: number;
  onComplete: (state: FaceletState) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [idx, setIdx] = useState(0);
  const [captured, setCaptured] = useState<Partial<Record<Face, Capture>>>({});

  const evenCube = size % 2 === 0;

  useEffect(() => {
    if (evenCube) return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
          setReady(true);
        }
      } catch (e) {
        setError(
          e instanceof DOMException && e.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow access, or enter the cube manually.'
            : 'No camera available. You can enter the cube manually instead.',
        );
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [evenCube]);

  const target = SCAN_ORDER[Math.min(idx, SCAN_ORDER.length - 1)];
  const allCaptured = SCAN_ORDER.every((f) => captured[f]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const region = centeredSquareRegion(w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const samples = sampleGrid(data, w, h, region, size);

    // Thumbnail of the aligned square for the tray.
    const tc = document.createElement('canvas');
    tc.width = 56;
    tc.height = 56;
    tc.getContext('2d')?.drawImage(canvas, region.x, region.y, region.w, region.h, 0, 0, 56, 56);
    const thumb = tc.toDataURL('image/jpeg', 0.7);

    const face = SCAN_ORDER[idx];
    setCaptured((c) => ({ ...c, [face]: { samples, thumb } }));
    setIdx((i) => Math.min(SCAN_ORDER.length, i + 1));
  }

  function finish() {
    const samples = {} as FaceSamples;
    for (const f of FACES) {
      const cap = captured[f];
      if (!cap) return;
      samples[f] = cap.samples;
    }
    onComplete(classifyFaces(samples, size).state);
  }

  if (evenCube) {
    return (
      <div className={styles.notice}>
        Scanning even-layer cubes (4×4, 6×6) arrives with their solvers. Use manual entry for now.
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.notice}>
        <p>{error}</p>
        <button type="button" className={styles.retry} onClick={() => setError(null)}>
          Try camera again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.scanner}>
      <div className={styles.stage}>
        <div className={styles.videoWrap}>
          <video ref={videoRef} className={styles.video} playsInline muted />
          <AlignmentGuide size={size} />
          {!ready && <div className={styles.loading}>Starting camera…</div>}
        </div>

        <div className={styles.side}>
          <div className={styles.prompt}>
            <span className={styles.swatch} style={{ background: `var(--sticker-${target})` }} />
            <div>
              <p className={styles.promptTitle}>
                {allCaptured ? 'All faces captured' : `Show the ${GUIDE[target].color} face`}
              </p>
              <p className={styles.promptHint}>
                {allCaptured ? 'Review and fix any colors next.' : GUIDE[target].hint}
              </p>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.capture} onClick={capture} disabled={!ready || allCaptured}>
              {captured[target] ? 'Recapture' : 'Capture'}
            </button>
            <button type="button" className={styles.use} onClick={finish} disabled={!allCaptured}>
              Use scan
            </button>
          </div>
        </div>
      </div>

      <div className={styles.tray}>
        {SCAN_ORDER.map((face, i) => {
          const cap = captured[face];
          return (
            <button
              key={face}
              type="button"
              className={styles.slot}
              data-state={cap ? 'done' : i === idx ? 'active' : 'pending'}
              onClick={() => setIdx(i)}
              aria-label={`${GUIDE[face].color} face${cap ? ' (captured)' : ''}`}
            >
              {cap ? (
                <img src={cap.thumb} alt="" className={styles.thumb} />
              ) : (
                <span className={styles.slotDot} style={{ background: `var(--sticker-${face})` }} />
              )}
              <span className={styles.slotLabel}>{GUIDE[face].color}</span>
            </button>
          );
        })}
      </div>

      <canvas ref={canvasRef} className={styles.hiddenCanvas} />
    </div>
  );
}
