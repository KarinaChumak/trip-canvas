import { describe, expect, it } from 'vitest';
import { initialWindow, showEarlier, showLater } from '@/lib/connection-window';

describe('connection window', () => {
  it('starts on the recommended option and the one after it', () => {
    expect(initialWindow(6, 2)).toEqual({ start: 2, end: 4 });
  });

  it('starts at the top without a recommendation or with an index past the list', () => {
    expect(initialWindow(6, null)).toEqual({ start: 0, end: 2 });
    expect(initialWindow(6, 9)).toEqual({ start: 0, end: 2 });
  });

  it('shows one option when there is only one, or the last is recommended', () => {
    expect(initialWindow(1, 0)).toEqual({ start: 0, end: 1 });
    expect(initialWindow(6, 5)).toEqual({ start: 5, end: 6 });
  });

  it('reveals two more each way and stops at the ends', () => {
    expect(showEarlier({ start: 3, end: 5 })).toEqual({ start: 1, end: 5 });
    expect(showEarlier({ start: 1, end: 5 })).toEqual({ start: 0, end: 5 });
    expect(showLater({ start: 0, end: 2 }, 6)).toEqual({ start: 0, end: 4 });
    expect(showLater({ start: 0, end: 5 }, 6)).toEqual({ start: 0, end: 6 });
  });
});
