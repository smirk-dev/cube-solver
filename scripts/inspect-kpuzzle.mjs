// One-off calibration: dump cubing.js's 3x3x3 KPuzzle conventions so we can write
// a correct facelet<->KPattern converter without guessing. Run: node scripts/inspect-kpuzzle.mjs
import { cube3x3x3 } from 'cubing/puzzles';

const kpuzzle = await cube3x3x3.kpuzzle();

console.log('=== ORBITS ===');
console.log(JSON.stringify(kpuzzle.definition.orbits, null, 1));

const solved = kpuzzle.defaultPattern();
console.log('\n=== SOLVED patternData ===');
console.log(JSON.stringify(solved.patternData));

for (const move of ['U', 'R', 'F', 'D', 'L', 'B']) {
  const p = solved.applyMove(move);
  console.log(`\n=== after ${move} ===`);
  console.log(JSON.stringify(p.patternData));
}
