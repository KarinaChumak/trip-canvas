import { describe, expect, it, vi } from 'vitest';
import { cached, memoryCache, type Cache } from '../../src/lib/cache.js';

describe('cached', () => {
  it('loads on a miss and serves the saved value on a hit', async () => {
    const cache = memoryCache();
    const load = vi.fn(async () => ({ temp: 21 }));

    expect(await cached(cache, 'k', 60, load)).toEqual({ temp: 21 });
    expect(await cached(cache, 'k', 60, load)).toEqual({ temp: 21 });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('still loads when the cache is down', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken: Cache = {
      get: async () => Promise.reject(new Error('down')),
      set: async () => Promise.reject(new Error('down')),
    };

    expect(await cached(broken, 'k', 60, async () => 'fresh')).toBe('fresh');
  });
});
