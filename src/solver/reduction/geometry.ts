/* ----------------------------------------------------------------------------
   Geometry helpers for reduction: group the edge "wing" stickers of an NxN cube
   by which edge they belong to, so we can tell when an edge is fully paired.
---------------------------------------------------------------------------- */

import { FACES, type Face, type FaceletState } from '../../state/facelets';
import { faceletPose } from '../../state/faceletMoves';

export interface Wing {
  /** The two stickers of one wing cubelet, ordered by face name. */
  a: [Face, number];
  b: [Face, number];
}

/**
 * For each edge (unordered face pair) return its n-2 wing cubelets. Each wing
 * is the pair of stickers (one per adjoining face) at that edge position.
 */
export function edgeWings(n: number): Map<string, Wing[]> {
  const max = n - 1;
  // Position → the (face, idx) stickers sitting there (an edge cell has two).
  const byPos = new Map<string, [Face, number][]>();
  for (const face of FACES) {
    for (let idx = 0; idx < n * n; idx++) {
      const r = Math.floor(idx / n);
      const c = idx % n;
      const { pos } = faceletPose(face, r, c, n);
      const extremes = pos.filter((v) => Math.abs(v) === max).length;
      if (extremes !== 2) continue; // not an edge sticker
      const key = pos.join(',');
      const list = byPos.get(key) ?? [];
      list.push([face, idx]);
      byPos.set(key, list);
    }
  }

  const edges = new Map<string, Wing[]>();
  for (const stickers of byPos.values()) {
    if (stickers.length !== 2) continue;
    const sorted = stickers.slice().sort((p, q) => (p[0] < q[0] ? -1 : 1));
    const edgeKey = `${sorted[0][0]}${sorted[1][0]}`;
    const wing: Wing = { a: sorted[0], b: sorted[1] };
    const arr = edges.get(edgeKey) ?? [];
    arr.push(wing);
    edges.set(edgeKey, arr);
  }
  return edges;
}

/** An edge is paired when all its wings show one color per face. */
export function edgePaired(state: FaceletState, wings: Wing[]): boolean {
  const a0 = state.stickers[wings[0].a[0]][wings[0].a[1]];
  const b0 = state.stickers[wings[0].b[0]][wings[0].b[1]];
  return wings.every(
    (w) => state.stickers[w.a[0]][w.a[1]] === a0 && state.stickers[w.b[0]][w.b[1]] === b0,
  );
}

/** Number of fully paired edges in the state. */
export function pairedEdgeCount(state: FaceletState, edges: Map<string, Wing[]>): number {
  let count = 0;
  for (const wings of edges.values()) if (edgePaired(state, wings)) count++;
  return count;
}
