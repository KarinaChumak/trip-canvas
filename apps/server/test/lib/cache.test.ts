import { describe, expect, it } from 'vitest';
import { memoryCache } from '../../src/lib/cache.js';

describe('memoryCache', () => {
  it('returns what was set, and undefined for a missing key', async () => {
    const cache = memoryCache();
    await cache.set('k', { temp: 21 }, 60);

    expect(await cache.get('k')).toEqual({ temp: 21 });
    expect(await cache.get('other')).toBeUndefined();
  });
});
