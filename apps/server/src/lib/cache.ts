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
