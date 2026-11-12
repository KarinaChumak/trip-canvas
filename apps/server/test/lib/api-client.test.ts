import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { cacheKey, createApiClient, createRequestQueue } from '../../src/lib/api-client.js';
import { memoryCache, type Cache } from '../../src/lib/cache.js';

const Ok = z.object({ ok: z.number() });
const Anything = z.unknown();

function stubFetch(body: unknown, status = 200) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

function client({ timeoutMs, cache = memoryCache() }: { timeoutMs?: number; cache?: Cache } = {}) {
  return createApiClient({ service: 'Test', timeoutMs, cache: { store: cache, ttlSeconds: 60 } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('cacheKey', () => {
  it('ignores the order of query parameters', () => {
    const a = cacheKey('Test', new URL('https://api.test/x?a=1&b=2'));
    const b = cacheKey('Test', new URL('https://api.test/x?b=2&a=1'));
    expect(a).toBe(b);
    expect(a).toBe('test:/x?a=1&b=2');
  });

  it('leaves secret parameters out', () => {
    expect(cacheKey('Test', new URL('https://api.test/x?q=lisbon&apikey=s3cret'), ['apikey'])).toBe('test:/x?q=lisbon');
  });
});

describe('createApiClient', () => {
  it('fetches on a miss and serves the cached JSON on a hit', async () => {
    const fetch = stubFetch({ ok: 1 });
    const api = client();

    expect(await api.getJson(new URL('https://api.test/x?a=1&b=2'), Ok)).toEqual({ ok: 1 });
    expect(await api.getJson(new URL('https://api.test/x?b=2&a=1'), Ok)).toEqual({ ok: 1 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('throws with the start of the body on an HTTP error and caches nothing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetch = stubFetch('Access denied', 403);
    const api = client();
    const url = new URL('https://api.test/x');

    await expect(api.getJson(url, Ok)).rejects.toThrow('Test returned 403: "Access denied"');
    fetch.mockResolvedValueOnce(new Response('{"ok":1}'));
    expect(await api.getJson(url, Ok)).toEqual({ ok: 1 });
  });

  it('never caches a 200 of the wrong shape', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetch = stubFetch({ message: 'You have exceeded the daily quota' });
    const api = client();
    const url = new URL('https://api.test/x');

    await expect(api.getJson(url, Ok)).rejects.toThrow('Test answered in an unexpected shape');
    fetch.mockResolvedValueOnce(new Response('{"ok":1}'));
    expect(await api.getJson(url, Ok)).toEqual({ ok: 1 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('refetches when a cached entry no longer fits the schema', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cache = memoryCache();
    await cache.set('test:/x?', { old: 'shape' }, 60);
    const fetch = stubFetch({ ok: 1 });

    expect(await client({ cache }).getJson(new URL('https://api.test/x'), Ok)).toEqual({ ok: 1 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('still calls the API when the cache is down', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken: Cache = {
      get: async () => Promise.reject(new Error('down')),
      set: async () => Promise.reject(new Error('down')),
    };
    stubFetch({ ok: 1 });

    expect(await client({ cache: broken }).getJson(new URL('https://api.test/x'), Ok)).toEqual({ ok: 1 });
  });

  it('caches a POST by path and body, whatever the order of its fields', async () => {
    const fetch = stubFetch({ ok: 1 });
    const api = client();
    const url = new URL('https://api.test/search');

    expect(await api.postJson(url, { a: 1, b: { c: 2, d: 3 } }, Ok)).toEqual({ ok: 1 });
    expect(await api.postJson(url, { b: { d: 3, c: 2 }, a: 1 }, Ok)).toEqual({ ok: 1 });
    expect(fetch).toHaveBeenCalledTimes(1);
    await api.postJson(url, { a: 2 }, Ok);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('never caches a POST when the client has no cache', async () => {
    const fetch = stubFetch({ ok: 1 });
    const api = createApiClient({ service: 'Test' });
    await api.postJson(new URL('https://api.test/search'), { a: 1 }, Ok);
    await api.postJson(new URL('https://api.test/search'), { a: 1 }, Ok);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('shares one request between parallel calls for the same URL', async () => {
    const fetch = stubFetch({ ok: 1 });
    const api = client();
    const url = new URL('https://api.test/x');

    expect(await Promise.all([api.getJson(url, Ok), api.getJson(url, Ok)])).toEqual([{ ok: 1 }, { ok: 1 }]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('runs calls in parallel when the service has no rate limit', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    vi.stubGlobal('fetch', async () => {
      maxInFlight = Math.max(maxInFlight, ++inFlight);
      await new Promise((resolve) => setTimeout(resolve, 10));
      inFlight--;
      return new Response('{}');
    });
    const api = client();

    await Promise.all([api.getJson(new URL('https://api.test/a'), Anything), api.getJson(new URL('https://api.test/b'), Anything)]);
    expect(maxInFlight).toBe(2);
  });

  describe('retry', () => {
    const retrying = () => createApiClient({ service: 'Test', retry: { statuses: [424], delayMs: 1 } });
    const upstreamError = () => new Response('{"error":"upstream_error"}', { status: 424 });

    it('tries once more on a listed status', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const fetch = stubFetch({ ok: 1 });
      fetch.mockResolvedValueOnce(upstreamError());

      expect(await retrying().postJson(new URL('https://api.test/x'), { a: 1 }, Ok)).toEqual({ ok: 1 });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('gives up when the second try fails too', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const fetch = vi.fn(async () => upstreamError());
      vi.stubGlobal('fetch', fetch);

      await expect(retrying().getJson(new URL('https://api.test/x'), Ok)).rejects.toThrow('Test returned 424');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('does not retry other statuses', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const fetch = stubFetch('Bad request', 400);

      await expect(retrying().getJson(new URL('https://api.test/x'), Ok)).rejects.toThrow('Test returned 400');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('gives up after the timeout', async () => {
    // A fetch that never answers, only rejects when its signal aborts.
    vi.stubGlobal(
      'fetch',
      (_url: URL, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal!.addEventListener('abort', () => reject(init.signal!.reason))),
    );

    await expect(client({ timeoutMs: 20 }).getJson(new URL('https://api.test/x'), Anything)).rejects.toThrow(/timed out|timeout/i);
  });
});

describe('createRequestQueue', () => {
  it('starts each task at least the interval after the previous one ended', async () => {
    const enqueue = createRequestQueue(50);
    const starts: number[] = [];
    const task = async () => {
      starts.push(Date.now());
    };

    await Promise.all([enqueue(task), enqueue(task)]);
    expect(starts[1]! - starts[0]!).toBeGreaterThanOrEqual(45);
  });
});
