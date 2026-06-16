import { describe, it, expect } from 'vitest';
import { moveCue } from './moveCues';

describe('moveCue', () => {
  it('maps a clockwise quarter turn', () => {
    const c = moveCue('R');
    expect(c.faceName).toBe('right');
    expect(c.dir).toBe('cw');
    expect(c.text).toMatch(/right face clockwise/i);
  });

  it('maps a counter-clockwise turn', () => {
    const c = moveCue("U'");
    expect(c.faceName).toBe('top');
    expect(c.dir).toBe('ccw');
    expect(c.text).toMatch(/counter-clockwise/i);
  });

  it('maps a double turn', () => {
    const c = moveCue('F2');
    expect(c.faceName).toBe('front');
    expect(c.dir).toBe('double');
    expect(c.text).toMatch(/180/);
  });

  it('gives every face a human name', () => {
    expect(moveCue('L').faceName).toBe('left');
    expect(moveCue('D').faceName).toBe('bottom');
    expect(moveCue('B').faceName).toBe('back');
  });
});
