import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateEmitComponent } from '@trip-canvas/catalog/schema';
import { memoryCache } from '../../src/lib/cache.js';
import {
  categoryFor,
  createOpenTripMapClient,
  formatAddress,
  popularity,
  shortDescription,
  websiteUrl,
  type PlaceSearch,
} from '../../src/services/open-trip-map.js';

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

  it('keeps one place per name, the better ranked one', async () => {
    stubFetch([
      { xid: 'N5', name: 'Miradouro de Santa Luzia', kinds: 'view_points', dist: 90, rate: 3, point: { lon: -9.13, lat: 38.71 } },
      { xid: 'W6', name: 'Miradouro de Santa Luzia', kinds: 'view_points', dist: 80, rate: 3, point: { lon: -9.13, lat: 38.71 } },
    ]);
    expect((await openTripMap().searchPlaces(ALFAMA)).map((place) => place.id)).toEqual(['W6']);
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

  it('gives places that fit a PlaceCard, with the id as placeId', async () => {
    stubFetch(RADIUS);
    const [place] = await openTripMap().searchPlaces(ALFAMA);
    const nulls = { kind: null, description: null, address: null, rating: null, reviewCount: null, priceLevel: null, url: null };
    const props = { name: place!.name, category: place!.category, placeId: place!.id, ...nulls };

    expect(validateEmitComponent({ component: { type: 'PlaceCard', props } })).toMatchObject({ ok: true });
  });

  it('throws on an HTTP error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubFetch({ error: 'Unknown API key' }, 401);
    await expect(openTripMap().searchPlaces(ALFAMA)).rejects.toThrow('OpenTripMap returned 401');
  });
});

// Trimmed from a live response for "Igreja de Santa Luzia".
const CHURCH = {
  xid: 'W96758903',
  name: 'Igreja de Santa Luzia',
  address: { road: 'Largo de Santa Luzia', house: 'Igreja de São Brás e de Santa Luzia', suburb: 'Alfama', city: 'Santa Maria Maior', postcode: '1100-411' },
  wikipedia_extracts: {
    title: 'en:Igreja de Santa Luzia (Lisbon)',
    text: 'Igreja de Santa Luzia is a church in Lisbon, Portugal. It is classified as a National Monument.Catholicism in Portugal',
  },
  rate: '3h',
};

describe('openTripMap.getPlaceDetails', () => {
  it('maps the address, the English description and the website', async () => {
    const fetch = stubFetch({ ...CHURCH, url: 'www.example.pt' });

    expect(await openTripMap().getPlaceDetails('W96758903')).toEqual({
      address: 'Largo de Santa Luzia, Alfama',
      description: 'Igreja de Santa Luzia is a church in Lisbon, Portugal. It is classified as a National Monument.',
      url: 'https://www.example.pt/',
    });
    const [url] = fetch.mock.calls[0] as unknown as [URL];
    expect(url.pathname).toBe('/en/places/xid/W96758903');
  });

  it('returns nulls for a place with only a name', async () => {
    stubFetch({ xid: 'N1', name: 'Cunha' });
    expect(await openTripMap().getPlaceDetails('N1')).toEqual({ address: null, description: null, url: null });
  });
});

describe('detail helpers', () => {
  it('ranks heritage just above its own level', () => {
    expect([popularity(3), popularity(7), popularity(5), popularity('3h'), popularity(undefined)]).toEqual([3, 3.5, 1.5, 3, 0]);
  });

  it('formats the address from street, number and district', () => {
    expect(formatAddress({ road: 'Rua da Saudade', house_number: '12', suburb: 'Alfama' })).toBe('Rua da Saudade 12, Alfama');
    expect(formatAddress({ footway: 'Portas do Sol', suburb: 'Alfama' })).toBe('Portas do Sol, Alfama');
    expect(formatAddress({ country: 'Portugal' })).toBeNull();
  });

  it('describes no food place, whose article is usually about its building', async () => {
    stubFetch({ ...CHURCH, name: 'Farol de Santa Luzia', kinds: 'foods,restaurants' });
    expect((await openTripMap().getPlaceDetails('N7')).description).toBeNull();
  });

  it('strips pronunciations and translations from the description', () => {
    const text = 'The Praça do Comércio (Portuguese pronunciation: [ˈpɾasɐ du kuˈmɛɾsju]; English: Commerce Square) is a large square. It faces the Tagus. It was rebuilt after 1755.';
    expect(shortDescription({ title: 'en:Praça do Comércio', text })).toBe('The Praça do Comércio is a large square. It faces the Tagus.');
  });

  it('skips a Wikipedia extract in another language', () => {
    expect(shortDescription({ title: 'zh:太阳门观景台', text: '太阳门观景台属于里斯本。' })).toBeNull();
  });

  it('drops a website that is not a URL', () => {
    expect(websiteUrl('not a url')).toBeNull();
    expect(websiteUrl('https://www.timeoutmarket.com/lisboa/')).toBe('https://www.timeoutmarket.com/lisboa/');
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
