import { z } from 'zod';
import type { Cache } from './cache.js';

/** Long enough for a slow answer; a healthy Nominatim or Open-Meteo replies in well under a second. */
const DEFAULT_TIMEOUT_MS = 10_000;

export type ApiClientOptions = {
  /** Name for logs and cache keys, e.g. "Nominatim". */
  service: string;
  timeoutMs?: number;
  /** Minimum gap between two calls to this service, for APIs with a rate limit. */
  minIntervalMs?: number;
  headers?: Record<string, string>;
  /** Query parameters left out of the cache key, such as API keys. */
  secretParams?: string[];
  /**
   * Where responses are kept and for how long. Left out for APIs whose terms
   * forbid storing their answers (Google, D-043).
   */
  cache?: { store: Cache; ttlSeconds: number };
};

export type ApiClient = {
  /**
   * GETs `url` and returns its JSON parsed with `schema`, from the cache when it can.
   * Only a response that parses is cached, so an error never is: an HTTP error, a
   * timeout or a 200 of the wrong shape (a quota message) throws and the next call
   * asks the API again. The raw JSON is cached and parsed on every hit too, so an
   * entry from before a schema change counts as a miss.
   */
  getJson<T>(url: URL, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T>;
  /**
   * POSTs `body` as JSON and returns the answer parsed with `schema`. Cached like
   * `getJson` when the client has a cache (Ignav, whose searches are paid), keyed by
   * the path and the body; never for clients without one (Google, D-043).
   */
  postJson<T>(url: URL, body: unknown, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T>;
};

/**
 * Cache key for a request: the service, path and query parameters sorted by name,
 * without secrets. Parameter order and API keys don't change the key.
 */
export function cacheKey(service: string, url: URL, secretParams: string[] = []): string {
  const params = [...url.searchParams].filter(([name]) => !secretParams.includes(name));
  params.sort(([a], [b]) => a.localeCompare(b));
  return `${service.toLowerCase()}:${url.pathname}?${new URLSearchParams(params)}`;
}

/** JSON with object keys sorted at every level, so field order doesn't change a cache key. */
export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

/** Runs tasks one at a time, starting each at least `minIntervalMs` after the previous one ended. */
export function createRequestQueue(minIntervalMs: number) {
  let previous: Promise<unknown> = Promise.resolve();
  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = previous.then(task);
    const pause = () => new Promise((resolve) => setTimeout(resolve, minIntervalMs));
    previous = result.then(pause, pause);
    return result;
  };
}

/** A client for one outside API: caching, timeout, rate limit and logging in one place. */
export function createApiClient({
  service,
  cache,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  minIntervalMs = 0,
  headers,
  secretParams,
}: ApiClientOptions): ApiClient {
  // Only rate-limited services wait in line; the others run their calls in parallel.
  const enqueue = minIntervalMs > 0 ? createRequestQueue(minIntervalMs) : <T>(task: () => Promise<T>) => task();

  async function fetchJson(url: URL, signal?: AbortSignal, init?: RequestInit): Promise<unknown> {
    // Give up after the timeout, or as soon as the user stops the reply.
    const timeout = AbortSignal.timeout(timeoutMs);
    const started = Date.now();
    const res = await fetch(url, {
      ...init,
      headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
      signal: signal ? AbortSignal.any([timeout, signal]) : timeout,
    });
    const ms = Date.now() - started;

    if (!res.ok) {
      // The start of the body usually says why, e.g. Nominatim's "Access denied".
      const body = (await res.text()).slice(0, 200);
      console.error(`[http] ${service} ${res.status} in ${ms} ms`, { body });
      throw new Error(`${service} returned ${res.status}: ${body}`);
    }
    console.log(`[http] ${service} ${res.status} in ${ms} ms`);
    return res.json();
  }

  // Calls on their way, by cache key: parallel tool calls for the same place (geocode
  // and getWeather for "Lisbon") share one request instead of both missing the cache.
  // A shared call follows the first caller's signal, so its Stop also stops the others.
  const inFlight = new Map<string, Promise<unknown>>();

  async function readCache<T>(key: string, schema: z.ZodType<T>): Promise<T | undefined> {
    if (!cache) return undefined;
    try {
      const hit = await cache.store.get(key);
      if (hit === undefined) return undefined;
      const parsed = schema.safeParse(hit);
      if (parsed.success) {
        console.log('[cache] hit', key);
        return parsed.data;
      }
      console.warn('[cache] stale shape, refetching', key);
    } catch (err) {
      // The cache only saves calls: if it is down, the API still answers.
      console.warn('[cache] read failed', err);
    }
    return undefined;
  }

  async function load<T>(key: string, url: URL, schema: z.ZodType<T>, signal?: AbortSignal, init?: RequestInit): Promise<T> {
    console.log('[cache] miss', key);
    let request = inFlight.get(key);
    if (!request) {
      request = enqueue(() => fetchJson(url, signal, init)).finally(() => inFlight.delete(key));
      inFlight.set(key, request);
    }
    const raw = await request;
    const data = parse(raw, schema);
    try {
      if (cache) await cache.store.set(key, raw, cache.ttlSeconds);
    } catch (err) {
      console.warn('[cache] write failed', err);
    }
    return data;
  }

  function parse<T>(raw: unknown, schema: z.ZodType<T>): T {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      console.error(`[http] ${service} answered in an unexpected shape`, z.prettifyError(parsed.error));
      throw new Error(`${service} answered in an unexpected shape`);
    }
    return parsed.data;
  }

  return {
    async getJson(url, schema, signal) {
      const key = cacheKey(service, url, secretParams);
      return (await readCache(key, schema)) ?? load(key, url, schema, signal);
    },

    async postJson(url, body, schema, signal) {
      const init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
      if (!cache) return parse(await enqueue(() => fetchJson(url, signal, init)), schema);
      const key = `${cacheKey(service, url, secretParams)} ${stableJson(body)}`;
      return (await readCache(key, schema)) ?? load(key, url, schema, signal, init);
    },
  };
}
