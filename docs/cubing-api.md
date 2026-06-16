# cubing.js API reference (verified against `cubing@0.63.3`)

Distilled from a source-level audit of the installed package's `.d.ts` files.
These are the only cubing.js APIs this project relies on. Anything marked
`experimental*` can be renamed between versions — keep usage funneled through the
thin wrappers in `src/solver/` and `src/viz/` so a rename is a one-file change.

## Packaging
- Pure ESM, ES2022. Subpaths: `cubing/alg`, `cubing/kpuzzle`, `cubing/puzzles`,
  `cubing/scramble`, `cubing/search`, `cubing/twisty`.
- Solve/scramble run in a **web worker** instantiated via `new Worker(new URL(..., import.meta.url))`.
  Vite handles this natively. Fallback if worker instantiation breaks:
  `import { setSearchDebug } from "cubing/search"; setSearchDebug({ prioritizeEsbuildWorkaroundForWorkerInstantiation: true })`.

## TwistyPlayer (`cubing/twisty`)
- `new TwistyPlayer(config)` returns an `HTMLElement`; `appendChild` it. Importing
  the module auto-registers `<twisty-player>` — no manual `customElements.define`.
- Config / settable props (non-experimental): `puzzle`, `alg`, `visualization`
  (`"3D" | "2D" | "PG3D" | "auto" | ...`), `hintFacelets` (`"floating" | "none" | "auto"`),
  `background` (`"none" | "checkered" | ...`), `colorScheme` (`"light" | "dark" | "auto"`),
  `controlPanel` (`"bottom-row" | "none" | "auto"`), `backView`
  (`"none" | "side-by-side" | "top-right" | "auto"`), `cameraLatitude`,
  `cameraLongitude`, `cameraDistance`, `tempoScale`.
- Experimental props: `experimentalSetupAlg`, `experimentalSetupAnchor`
  (`"start" | "end"`), `experimentalPuzzleDescription`, `experimentalStickering`.
- **Setters are write-only** (getters are typed `never`). To read current state use
  `player.experimentalModel.*` or `player.experimentalGet.*`.
- **Valid `puzzle` IDs:** `"2x2x2" | "3x3x3" | "4x4x4" | "5x5x5" | "6x6x6" | "7x7x7" | "40x40x40" | "custom"`
  (plus non-cube puzzles). **8x8x8+ are NOT valid** — arbitrary N needs
  `puzzle: "custom"` + `experimentalPuzzleDescription`. This is why we cap NxN at 7.

### Playback
- `player.play()`, `player.pause()`, `player.togglePlay(play?)`,
  `player.jumpToStart({flash?})`, `player.jumpToEnd({flash?})`.
- Step to a specific move index N along the current alg:
  ```ts
  const indexer = await player.experimentalModel.indexer.get();
  const total = indexer.numAnimatedLeaves();
  player.experimentalModel.timestampRequest.set(indexer.indexToMoveStartTimestamp(N));
  ```
- Append/animate a single live move: `player.experimentalAddMove(move | string)`.
- Set an arbitrary starting state: `player.experimentalSetupAlg = "..."` (anchored per
  `experimentalSetupAnchor`), or inject a transformation via
  `player.experimentalModel.setupTransformation.set(kTransformation | null)`.

## Solvers (`cubing/search`) — async, run in worker
```ts
experimentalSolve3x3x3IgnoringCenters(pattern: KPattern): Promise<Alg>
experimentalSolve2x2x2(pattern: KPattern): Promise<Alg>
random333Pattern(): Promise<KPattern>
```
Input is a **KPattern** (not a facelet string). Scrambles:
`randomScrambleForEvent("333" | "222" | "444" | ...): Promise<Alg>` from `cubing/scramble`.

## KPuzzle / KPattern (`cubing/kpuzzle`, `cubing/puzzles`)
```ts
import { cube2x2x2, cube3x3x3, puzzles } from "cubing/puzzles";
import { KPattern } from "cubing/kpuzzle";

const kpuzzle = await cube3x3x3.kpuzzle();          // or puzzles["4x4x4"].kpuzzle()
const solved  = kpuzzle.defaultPattern();           // KPattern
const p = solved.applyAlg("R U R'");                // applyAlg / applyMove → KPattern
solved.isIdentical(p);                              // exact equality
p.experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true });
new KPattern(kpuzzle, patternData);                 // build from your own data
```
`KPatternData` shape per orbit: `{ pieces: number[], orientation: number[], orientationMod?: number[] }`.
3x3 orbits: `EDGES` (12), `CORNERS` (8), `CENTERS` (6). **Read
`kpuzzle.definition.orbits` at runtime to confirm names/sizes before hardcoding.**

### ⚠️ No facelet helper
cubing.js ships **no** 54-char facelet-string ↔ KPattern converter. We hand-roll
`faceletsToKPattern` / `kpatternToFacelets` in `src/solver/` and verify them with a
round-trip property test: for a random scramble alg, building the pattern via
`solved.applyAlg(scramble)` must be `isIdentical` to building it from the facelets we
derive for that scramble. Corner/edge numbering & orientation conventions are
confirmed empirically by that test, not assumed.

## Alg (`cubing/alg`)
```ts
import { Alg, Move } from "cubing/alg";
new Alg("R U R'");  Alg.fromString(s);  alg.invert();  alg.toString();
[...alg.childAlgNodes()];   // iterate nodes; filter `instanceof Move` for leaf moves
new Move("R"); new Move("R", 2); move.amount; move.toString();
```
For HTM move counts use `cubing/notation` helpers, not `Alg.experimentalNum*`.
