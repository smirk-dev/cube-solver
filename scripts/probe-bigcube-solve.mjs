// Decision probe: can cubing.js's generic twsearch solve a scrambled 4x4/5x5
// in practical time? If not, Phase 3 needs a hand-written reduction solver.
import { puzzles } from 'cubing/puzzles';
import { experimentalSolveTwips } from 'cubing/search';

const SUFFIX = ['', "'", '2'];
function scramble(faces, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(faces[Math.floor(Math.random() * faces.length)] + SUFFIX[Math.floor(Math.random() * 3)]);
  }
  return out.join(' ');
}

for (const id of ['4x4x4']) {
  const faces = ['U', 'R', 'F', 'D', 'L', 'B', 'Uw', 'Rw', 'Fw', 'Dw', 'Lw', 'Bw'];
  const kpuzzle = await puzzles[id].kpuzzle();
  const scr = scramble(faces, 20);
  const pattern = kpuzzle.defaultPattern().applyAlg(scr);
  console.log(`${id} scramble:`, scr);
  const t0 = Date.now();
  try {
    const sol = await experimentalSolveTwips(kpuzzle, pattern);
    const ms = Date.now() - t0;
    const solved = pattern.applyAlg(sol).experimentalIsSolved({
      ignorePuzzleOrientation: true,
      ignoreCenterOrientation: true,
    });
    const len = sol.toString().trim().split(/\s+/).filter(Boolean).length;
    console.log(`${id}: solved=${solved} moves=${len} time=${ms}ms`);
  } catch (e) {
    console.log(`${id}: FAILED ${e?.message || e}`);
  }
}
process.exit(0);
