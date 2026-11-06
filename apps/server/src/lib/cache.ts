import { Redis } from '@upstash/redis';
import { LRUCache } from 'lru-cache';

/** A key-value store with a TTL per entry. Values must be JSON-serialisable. */
export type Cache = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
};

/** Per-process store for local dev and tests; on Vercel each instance would have its own. */
export function memoryCache(): Cache {
  const store = new LRUCache<string, object>({ max: 500 });
  return {
    get: async (key) => store.get(key),
    set: async (key, value, ttlSeconds) => {
      store.set(key, value as object, { ttl: ttlSeconds * 1000 });
    },
  };
}

/** Upstash Redis, shared by every function instance. */
export function redisCache({ url, token }: { url: string; token: string }): Cache {
  const redis = new Redis({ url, token });
  return {
    get: async (key) => (await redis.get(key)) ?? undefined,
    set: async (key, value, ttlSeconds) => {
      await redis.set(key, value, { ex: ttlSeconds });
    },
  };
}

/**
 * Returns the cached value for `key`, or runs `load` and caches its result.
 * The cache only saves calls: if it is down, `load` still runs and the tool works.
 */
export async function cached<T>(cache: Cache, key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  try {
    const hit = await cache.get(key);
    if (hit !== undefined) {
      console.log('[cache] hit', key);
      return hit as T;
    }
  } catch (err) {
    console.warn('[cache] read failed', err);
  }

  console.log('[cache] miss', key);
  const value = await load();
  try {
    await cache.set(key, value, ttlSeconds);
  } catch (err) {
    console.warn('[cache] write failed', err);
  }
  return value;
}
