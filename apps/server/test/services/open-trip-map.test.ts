import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateEmitComponent } from 'catalog/schema';
import { memoryCache } from '../../src/lib/cache.js';
import { categoryFor, createOpenTripMapClient, type PlaceSearch } from '../../src/services/open-trip-map.js';

const RADIUS = [
  { xid: 'N1', name: 'Taberna Sal Grosso', kinds: 'foods,restaurants,tourist_facilities', dist: 420.7, rate: 1, point: { lon: -9.129, lat: 38.712 } },
  { xid: 'N2', name: '', kinds: 'foods,fast_food', dist: 50, rate: 0, point: { lon: -9.13, lat: 38.711 } },
  { xid: 'N3', name: 'Café da Garagem', kinds: 'foods,cafes', dist: 120.2, rate: 1, point: { lon: -9.131, lat: 38.713 } },
  { xid: 'W4', name: 'Casa de Linhares', kinds: 'foods,restaurants,historic', dist: 610, rate: '3h', point: { lon: -9.128, lat: 38.711 } },
];

const ALFAMA: PlaceSearch = {
  latitude: 38.71189,
  longitude: -9.13024,
  radiusMeters: 830,
  kinds: ['restaurants', 'cafes'],
  minPopularity: 0,
  limit: 5,
};

const openTripMap = () => createOpenTripMapClient({ cache: memoryCache(), rapidApiKey: 'secret-key' });

function stubFetch(body: unknown, status = 200) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('openTripMap.searchPlaces', () => {
  it('returns named places, best known first, then nearest', async () => {
    stubFetch(RADIUS);

    expect(await openTripMap().searchPlaces(ALFAMA)).toEqual([
      { id: 'W4', name: 'Casa de Linhares', category: 'Restaurant', latitude: 38.711, longitude: -9.128, distanceMeters: 610 },
      { id: 'N3', name: 'Café da Garagem', category: 'Café', latitude: 38.713, longitude: -9.131, distanceMeters: 120 },
      { id: 'N1', name: 'Taberna Sal Grosso', category: 'Restaurant', latitude: 38.712, longitude: -9.129, distanceMeters: 421 },
    ]);
  });

  it('keeps to the limit', async () => {
    stubFetch(RADIUS);
    expect(await openTripMap().searchPlaces({ ...ALFAMA, limit: 1 })).toHaveLength(1);
  });

  it('builds a rounded, sorted query and sends the RapidAPI key in headers', async () => {
    const fetch = stubFetch(RADIUS);
    await openTripMap().searchPlaces({ ...ALFAMA, minPopularity: 2 });

    const [url, init] = fetch.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.host).toBe('opentripmap-places-v1.p.rapidapi.com');
    expect(url.pathname).toBe('/en/places/radius');
    expect(init.headers).toEqual({ 'X-RapidAPI-Key': 'secret-key', 'X-RapidAPI-Host': 'opentripmap-places-v1.p.rapidapi.com' });
    expect(Object.fromEntries(url.searchParams)).toEqual({
      lat: '38.712',
      lon: '-9.130',
      radius: '800',
      kinds: 'cafes,restaurants',
      format: 'json',
      limit: '15',
      rate: '2',
    });
  });

  it('leaves the API key out of the cache key and logs, so another key shares the entry', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fetch = stubFetch(RADIUS);
    const cache = memoryCache();

    await createOpenTripMapClient({ cache, rapidApiKey: 'key-a' }).searchPlaces(ALFAMA);
    await createOpenTripMapClient({ cache, rapidApiKey: 'key-b' }).searchPlaces(ALFAMA);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(log.mock.calls)).not.toContain('key-a');
  });

  it('serves nearby coordinates and reordered kinds from the cache', async () => {
    const fetch = stubFetch(RADIUS);
    const client = openTripMap();

    await client.searchPlaces(ALFAMA);
    await client.searchPlaces({ ...ALFAMA, latitude: 38.7121, kinds: ['cafes', 'restaurants'] });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('gives places that fit a PlaceCard once the unknown fields are null', async () => {
    stubFetch(RADIUS);
    const [place] = await openTripMap().searchPlaces(ALFAMA);
    const props = { name: place!.name, category: place!.category, description: null, address: null, rating: null, url: null };

    expect(validateEmitComponent({ component: { type: 'PlaceCard', props } })).toMatchObject({ ok: true });
  });

  it('throws on an HTTP error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubFetch({ error: 'Unknown API key' }, 401);
    await expect(openTripMap().searchPlaces(ALFAMA)).rejects.toThrow('OpenTripMap returned 401');
  });
});

describe('categoryFor', () => {
  it.each([
    ['foods,restaurants,tourist_facilities', 'Restaurant'],
    ['architecture,towers,interesting_places,bell_towers', 'Tower'],
    ['religion,churches,cathedrals,interesting_places', 'Cathedral'],
    ['natural,nature_reserves,interesting_places', 'Nature reserve'],
    ['unclassified_objects', 'Place'],
  ])('labels %s as %s', (kinds, label) => {
    expect(categoryFor(kinds)).toBe(label);
  });
});
