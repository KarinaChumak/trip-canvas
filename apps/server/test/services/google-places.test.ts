import { afterEach, describe, expect, it, vi } from 'vitest';
import { categoryFor, createGooglePlacesClient, type PlaceSearch } from '../../src/services/google-places.js';
// Hand-made in the shape of a Text Search answer with our field mask: the dev key is
// not enabled for the Places API yet, so no live response could be recorded.
import yaowarat from '../fixtures/google-places-yaowarat-street-food.json' with { type: 'json' };

const SEARCH: PlaceSearch = { query: 'street food', latitude: 13.7406, longitude: 100.51, radiusMeters: 1000, limit: 5 };

const googlePlaces = () => createGooglePlacesClient({ apiKey: 'test-key' });

function stubFetch(body: unknown, status = 200) {
  const fetch = vi.fn(async (_url: URL, _init: RequestInit) => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('googlePlaces.searchPlaces', () => {
  it('POSTs a Text Search biased to the circle, with the key and the Enterprise mask in headers', async () => {
    const fetch = stubFetch(yaowarat);
    await googlePlaces().searchPlaces(SEARCH);

    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe('https://places.googleapis.com/v1/places:searchText');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'X-Goog-Api-Key': 'test-key',
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.primaryType,places.location,places.formattedAddress,places.rating,places.websiteUri',
    });
    expect(JSON.parse(String(init.body))).toEqual({
      textQuery: 'street food',
      pageSize: 5,
      languageCode: 'en',
      locationBias: { circle: { center: { latitude: 13.7406, longitude: 100.51 }, radius: 1000 } },
    });
  });

  it('parses each place, with null for what Google left out', async () => {
    stubFetch(yaowarat);
    const places = await googlePlaces().searchPlaces(SEARCH);

    expect(places[0]).toEqual({
      ...{ id: 'ChIJq6qq6lmZ4jARSBYHgbzL0pE', name: 'Jay Fai', category: 'Thai restaurant', latitude: 13.7397361, longitude: 100.5101943 },
      ...{ address: '327 Maha Chai Rd, Samran Rat, Phra Nakhon, Bangkok 10200, Thailand', rating: 4.4 },
      url: 'https://www.facebook.com/jayfaibangkok/',
    });
    expect(places.map((p) => [p.name, p.category])).toEqual([
      ['Jay Fai', 'Thai restaurant'],
      ['Yaowarat Road Street Food', 'Market'],
      ['Kia Gee Kao Tom Mu', 'Place'],
      ['Wat Traimit', 'Buddhist temple'],
    ]);
    expect(places[3]).toMatchObject({ address: null, rating: null, url: null });
  });

  it('returns no places when Google answers {}', async () => {
    stubFetch({});
    expect(await googlePlaces().searchPlaces(SEARCH)).toEqual([]);
  });

  it('throws on an HTTP error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubFetch({ error: { code: 403, status: 'PERMISSION_DENIED' } }, 403);
    await expect(googlePlaces().searchPlaces(SEARCH)).rejects.toThrow(/Google Places returned 403/);
  });
});

it('reads primary types as words', () => {
  expect(categoryFor('thai_restaurant')).toBe('Thai restaurant');
  expect(categoryFor(undefined)).toBe('Place');
});
