/* ----------------------------------------------------------------------------
   Translate move notation (e.g. "R", "U'", "F2") into a human-readable cue and
   a directional indicator for the step UI.
---------------------------------------------------------------------------- */

export type TurnDir = 'cw' | 'ccw' | 'double';

export interface MoveCue {
  /** The raw notation token, e.g. "R'". */
  move: string;
  /** Plain face name, e.g. "right". */
  faceName: string;
  /** Direction of the turn. */
  dir: TurnDir;
  /** One-line instruction, e.g. "Turn the right face clockwise". */
  text: string;
  /** Glyph hinting the rotation direction. */
  arrow: string;
}

const FACE_NAME: Record<string, string> = {
  U: 'top',
  D: 'bottom',
  L: 'left',
  R: 'right',
  F: 'front',
  B: 'back',
};

const ARROW: Record<TurnDir, string> = {
  cw: '↻',
  ccw: '↺',
  double: '⟳',
};

export function moveCue(token: string): MoveCue {
  const faceChar = token[0] ?? '';
  const suffix = token.slice(1);
  const dir: TurnDir = suffix === '2' ? 'double' : suffix === "'" ? 'ccw' : 'cw';
  const faceName = FACE_NAME[faceChar] ?? faceChar;

  const text =
    dir === 'double'
      ? `Turn the ${faceName} face a half turn (180°)`
      : `Turn the ${faceName} face ${dir === 'cw' ? 'clockwise' : 'counter-clockwise'}`;

  return { move: token, faceName, dir, text, arrow: ARROW[dir] };
}
