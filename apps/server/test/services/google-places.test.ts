import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateEmitComponent } from '@trip-canvas/catalog/schema';
import { categoryFor, createGooglePlacesClient, kindFor, priceLevelFor, type PlaceSearch } from '../../src/services/google-places.js';
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
        'places.id,places.displayName,places.primaryType,places.types,places.location,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri',
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
      ...{ id: 'ChIJq6qq6lmZ4jARSBYHgbzL0pE', name: 'Jay Fai', category: 'Thai restaurant', kind: 'food', latitude: 13.7397361, longitude: 100.5101943 },
      ...{ address: '327 Maha Chai Rd, Samran Rat, Phra Nakhon, Bangkok 10200, Thailand', rating: 4.4, reviewCount: 6214, priceLevel: 1 },
      url: 'https://www.facebook.com/jayfaibangkok/',
    });
    expect(places.map((p) => [p.name, p.category, p.kind, p.priceLevel])).toEqual([
      ['Jay Fai', 'Thai restaurant', 'food', 1],
      ['Yaowarat Road Street Food', 'Market', 'market', null],
      // No primary type: the kind comes from the other types.
      ['Kia Gee Kao Tom Mu', 'Place', 'cafe', null],
      ['Wat Traimit', 'Buddhist temple', 'temple', 0],
    ]);
    expect(places[3]).toMatchObject({ address: null, rating: null, reviewCount: null, url: null });
  });

  it('gives places whose fields a PlaceCard takes as they are', async () => {
    stubFetch(yaowarat);
    for (const { id, latitude: _lat, longitude: _lng, ...fields } of await googlePlaces().searchPlaces(SEARCH)) {
      const props = { ...fields, placeId: id, description: null };
      expect(validateEmitComponent({ component: { type: 'PlaceCard', props } })).toMatchObject({ ok: true });
    }
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

describe('kind, category and price mapping', () => {
  it('groups types into kinds, the primary type first', () => {
    expect(kindFor('art_museum', [])).toBe('museum');
    expect(kindFor('cocktail_bar', [])).toBe('nightlife');
    expect(kindFor('beach', [])).toBe('beach');
    expect(kindFor('observation_deck', ['tourist_attraction'])).toBe('viewpoint');
    expect(kindFor('national_park', [])).toBe('nature');
    expect(kindFor('clothing_store', [])).toBe('shopping');
    expect(kindFor('coffee_shop', ['cafe', 'store'])).toBe('cafe');
    expect(kindFor(undefined, ['point_of_interest', 'establishment'])).toBe('other');
  });

  it('reads primary types as words and maps price levels to 0–4', () => {
    expect(categoryFor('thai_restaurant')).toBe('Thai restaurant');
    expect(categoryFor(undefined)).toBe('Place');
    expect(priceLevelFor('PRICE_LEVEL_FREE')).toBe(0);
    expect(priceLevelFor('PRICE_LEVEL_VERY_EXPENSIVE')).toBe(4);
    expect(priceLevelFor('PRICE_LEVEL_UNSPECIFIED')).toBeNull();
    expect(priceLevelFor(undefined)).toBeNull();
  });
});
