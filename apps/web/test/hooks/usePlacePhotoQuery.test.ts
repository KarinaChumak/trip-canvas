import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPlacePhoto } from '@/hooks/usePlacePhotoQuery';

const ID = 'ChIJ8Ztv3W6Z4jARgHrNfHXrbkM';
const PHOTO = { photoUri: 'https://lh3.googleusercontent.com/p/abc', author: { name: 'Ana S.', url: null }, count: 4 };

function stubFetch(status: number, body: unknown = PHOTO) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('fetchPlacePhoto', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads one photo by index and width with the access code', async () => {
    vi.stubGlobal('localStorage', { getItem: () => 'open-sesame' });
    const fetch = stubFetch(200);

    expect(await fetchPlacePhoto(ID, 2, 800)).toEqual(PHOTO);
    expect(fetch).toHaveBeenCalledWith(`/api/places/${ID}/photo?index=2&width=800`, { headers: { Authorization: 'Bearer open-sesame' }, signal: undefined });
  });

  it('returns null when the place has no photo there, and throws when the server fails or breaks the contract', async () => {
    stubFetch(404, { error: 'No such photo' });
    expect(await fetchPlacePhoto(ID, 0, 800)).toBeNull();
    stubFetch(502, { error: 'Place photo is unavailable' });
    await expect(fetchPlacePhoto(ID, 0, 800)).rejects.toThrow(/502/);
    stubFetch(200, { photoUri: 'not a url', author: null, count: 1 });
    await expect(fetchPlacePhoto(ID, 0, 800)).rejects.toThrow();
  });
});
