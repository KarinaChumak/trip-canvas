import { cached, type Cache } from './cache.js';

/** Long enough for a slow answer; a healthy Nominatim or Open-Meteo replies in well under a second. */
const DEFAULT_TIMEOUT_MS = 10_000;

export type ApiClientOptions = {
  /** Name for logs and cache keys, e.g. "Nominatim". */
  service: string;
  cache: Cache;
  /** How long a response stays in the cache. */
  ttlSeconds: number;
  timeoutMs?: number;
  /** Minimum gap between two calls to this service, for APIs with a rate limit. */
  minIntervalMs?: number;
  headers?: Record<string, string>;
  /** Query parameters left out of the cache key, such as API keys. */
  secretParams?: string[];
};

export type ApiClient = {
  /**
   * GETs `url` and returns its JSON, from the cache when it can. The raw JSON is
   * cached, so callers parse it on every call, from the API or from the cache alike.
   */
  getJson(url: URL, signal?: AbortSignal): Promise<unknown>;
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
  ttlSeconds,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  minIntervalMs = 0,
  headers,
  secretParams,
}: ApiClientOptions): ApiClient {
  // Only rate-limited services wait in line; the others run their calls in parallel.
  const enqueue = minIntervalMs > 0 ? createRequestQueue(minIntervalMs) : <T>(task: () => Promise<T>) => task();

  async function fetchJson(url: URL, signal?: AbortSignal): Promise<unknown> {
    // Give up after the timeout, or as soon as the user stops the reply.
    const timeout = AbortSignal.timeout(timeoutMs);
    const started = Date.now();
    const res = await fetch(url, { headers, signal: signal ? AbortSignal.any([timeout, signal]) : timeout });
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

  return {
    getJson: (url, signal) =>
      cached(cache, cacheKey(service, url, secretParams), ttlSeconds, () => enqueue(() => fetchJson(url, signal))),
  };
}
