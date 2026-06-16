// cubejs ships no types. Minimal ambient declarations for what we use.
declare module 'cubejs' {
  interface CubeInstance {
    solve(maxDepth?: number): string;
    isSolved(): boolean;
    asString(): string;
  }
  interface CubeStatic {
    new (): CubeInstance;
    fromString(s: string): CubeInstance;
    initSolver(): void;
  }
  const Cube: CubeStatic;
  export default Cube;
}

declare module 'cubejs/lib/solve' {
  const _default: unknown;
  export default _default;
}
