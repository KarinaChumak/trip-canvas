import { describe, expect, it } from 'vitest';
import { formatDay, formatDuration } from '@/lib/format';

describe('formatDay', () => {
  it('formats a catalog date without shifting it by time zone', () => {
    expect(formatDay('2026-11-07')).toBe('Sat 7 Nov');
    expect(formatDay('2026-01-01')).toBe('Thu 1 Jan');
  });
});

describe('formatDuration', () => {
  it.each([
    [45, '45 min'],
    [60, '1 h'],
    [90, '1 h 30 min'],
    [120, '2 h'],
  ])('%i minutes → %s', (minutes, text) => {
    expect(formatDuration(minutes)).toBe(text);
  });
});
