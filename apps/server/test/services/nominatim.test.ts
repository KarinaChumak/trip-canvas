import { afterEach, describe, expect, it, vi } from 'vitest';
import { memoryCache } from '../../src/lib/cache.js';
import { createNominatimClient } from '../../src/services/nominatim.js';

const LISBON = [{ name: 'Lisboa', display_name: 'Lisboa, Portugal', lat: '38.7077507', lon: '-9.1365919' }];

function stubFetch(body: unknown) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body)));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

const nominatim = () => createNominatimClient({ cache: memoryCache(), userAgent: 'trip-canvas-test' });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('nominatim.getGeocode', () => {
  it('returns the first match as numbers and sends the user agent', async () => {
    const fetch = stubFetch(LISBON);

    expect(await nominatim().getGeocode('Lisbon')).toEqual({
      name: 'Lisboa',
      displayName: 'Lisboa, Portugal',
      latitude: 38.7077507,
      longitude: -9.1365919,
    });
    const [url, init] = fetch.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.searchParams.get('q')).toBe('lisbon');
    expect(init.headers).toEqual({ 'User-Agent': 'trip-canvas-test' });
  });

  it('serves the same place in any case or spacing from one cache entry', async () => {
    const fetch = stubFetch(LISBON);
    const client = nominatim();

    await client.getGeocode('Lisbon');
    await client.getGeocode('  lisbon ');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns null when nothing matches', async () => {
    stubFetch([]);
    expect(await nominatim().getGeocode('Atlantis')).toBeNull();
  });
});
