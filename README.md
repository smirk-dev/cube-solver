# Cube Solver

A fully client-side web app that scans, solves, and walks you step-by-step
through twisty puzzles — 2×2, 3×3, 4×4, 5×5, general NxN, plus mirror and ghost
shape-mods. Everything runs in the browser: **the webcam stream never leaves your
device, there is no backend, and no data is uploaded.**

> Status: **Phase 0 complete** — scaffold, design system, and the live 3D cube
> shell are in place. See the roadmap below for what each phase adds.

## How it works

```text
input (camera / manual)  →  normalized facelet state  →  solver  →  3D step playback
```

- **Input** — webcam scanning (color cubes) or a click-to-paint manual grid; both
  produce the same normalized, size-agnostic facelet model.
- **Solve** — dispatched by puzzle size/type:
  - 3×3 → cubing.js two-phase solver (`min2phase`-style, ~20 moves, instant).
  - 2×2 → cubing.js 2×2 solver.
  - 4×4 / 5×5 / NxN → reduction (centers → edge pairing → 3×3 → parity).
  - mirror / ghost → solved as a 3×3 by piece shape (manual entry only — a single
    color can't be read by a camera).
- **Playback** — the solution animates on a [cubing.js](https://js.cubing.net/)
  `TwistyPlayer`, one move at a time, with each move translated into a plain-English
  cue and a directional arrow.

## Tech

Vite + React 18 + TypeScript · [cubing.js](https://github.com/cubing/cubing.js)
(3D rendering, 2×2/3×3 solvers, puzzle definitions) · zustand · plain CSS Modules.
No UI framework, no backend.

## Run / build / test

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + produce a static build in dist/
npm run preview  # preview the production build
npm run lint     # lint
```

### Deploy

The build is fully static. Deploy `dist/` to any static host:

```bash
npm run build
# then serve dist/ — e.g. drag it to Netlify, `vercel deploy`, GitHub Pages, etc.
```

## Roadmap

| Phase | Scope | Status |
| ----- | ----- | ------ |
| 0 | Scaffold, design system, live 3D cube shell | ✅ |
| 1 | 3×3 core: manual entry → solve → animated step playback | ⏳ |
| 2 | Webcam scanning for color cubes | ⏳ |
| 3 | 4×4 & 5×5 reduction solver (incl. parity) | ⏳ |
| 4 | General NxN (experimental, capped at 7×7) | ⏳ |
| 5 | Mirror & ghost cubes (manual shape entry) | ⏳ |
| 6 | Polish: responsive, accessibility, keyboard, error/loading states | ⏳ |

## Known limits

- **NxN is experimental and capped at 7×7.** cubing.js's `TwistyPlayer` only renders
  cube sizes 2–7; larger cubes also solve slower and non-optimally under reduction.
- **Mirror & ghost cubes are manual-entry only.** They are single-color 3×3 shape-mods,
  so a camera has no color information to read — you enter them by piece shape.
- "Optimal" here means *fast and short* (~20 moves for 3×3 in milliseconds), not
  provably move-optimal.

## Notes for contributors

`docs/cubing-api.md` records the exact cubing.js APIs this project depends on,
verified against the installed version. cubing.js's `experimental*` symbols can be
renamed between releases, so usage is funneled through thin wrappers in `src/solver/`
and `src/viz/`.
