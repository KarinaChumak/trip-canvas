import { afterEach, describe, expect, it, vi } from 'vitest';
import { cacheKey, createApiClient, createRequestQueue } from '../../src/lib/api-client.js';
import { memoryCache } from '../../src/lib/cache.js';

function stubFetch(body: unknown, status = 200) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

function client(options: { timeoutMs?: number } = {}) {
  return createApiClient({ service: 'Test', cache: memoryCache(), ttlSeconds: 60, ...options });
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

    expect(await api.getJson(new URL('https://api.test/x?a=1&b=2'))).toEqual({ ok: 1 });
    expect(await api.getJson(new URL('https://api.test/x?b=2&a=1'))).toEqual({ ok: 1 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('throws with the start of the body on an HTTP error and caches nothing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetch = stubFetch('Access denied', 403);
    const api = client();
    const url = new URL('https://api.test/x');

    await expect(api.getJson(url)).rejects.toThrow('Test returned 403: "Access denied"');
    fetch.mockResolvedValueOnce(new Response('{"ok":1}'));
    expect(await api.getJson(url)).toEqual({ ok: 1 });
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

    await Promise.all([api.getJson(new URL('https://api.test/a')), api.getJson(new URL('https://api.test/b'))]);
    expect(maxInFlight).toBe(2);
  });

  it('gives up after the timeout', async () => {
    // A fetch that never answers, only rejects when its signal aborts.
    vi.stubGlobal(
      'fetch',
      (_url: URL, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal!.addEventListener('abort', () => reject(init.signal!.reason))),
    );

    await expect(client({ timeoutMs: 20 }).getJson(new URL('https://api.test/x'))).rejects.toThrow(/timed out|timeout/i);
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
