import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPlaceDetails } from '@/lib/place-details';

const DETAILS = { address: 'Beco de Santa Helena 13, Alfama', description: null, url: null };

function stubFetch(status: number, body: unknown = DETAILS) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('fetchPlaceDetails', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads one place with the access code', async () => {
    // Tests run in Node, which has no localStorage.
    vi.stubGlobal('localStorage', { getItem: () => 'open-sesame' });
    const fetch = stubFetch(200);

    expect(await fetchPlaceDetails('N4627375983')).toEqual(DETAILS);
    expect(fetch).toHaveBeenCalledWith('/api/places/N4627375983', {
      headers: { Authorization: 'Bearer open-sesame' },
      signal: undefined,
    });
  });

  it('throws when the server has no details, so the card stays without them', async () => {
    stubFetch(502, { error: 'Place details are unavailable' });
    await expect(fetchPlaceDetails('N1')).rejects.toThrow(/502/);
  });
});
