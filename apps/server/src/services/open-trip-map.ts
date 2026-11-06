import { z } from 'zod';
import { createApiClient } from '../lib/api-client.js';
import type { Cache } from '../lib/cache.js';

/**
 * OpenTripMap categories the model may search for. A fixed list, so the model can't
 * invent one; the full tree is at https://dev.opentripmap.org/catalog.
 */
export const PLACE_KINDS = [
  'interesting_places',
  'cultural',
  'museums',
  'theatres_and_entertainments',
  'historic',
  'architecture',
  'religion',
  'natural',
  'beaches',
  'nature_reserves',
  'view_points',
  'amusements',
  'foods',
  'restaurants',
  'cafes',
  'fast_food',
  'bars',
  'pubs',
  'marketplaces',
] as const;

export type PlaceKind = (typeof PLACE_KINDS)[number];

/**
 * Card labels, most specific first: a place tagged "foods,restaurants" is a
 * "Restaurant", not "Food".
 */
const CATEGORY_LABELS: [kind: string, label: string][] = [
  ['restaurants', 'Restaurant'],
  ['cafes', 'Café'],
  ['fast_food', 'Fast food'],
  ['bars', 'Bar'],
  ['pubs', 'Pub'],
  ['marketplaces', 'Market'],
  ['museums', 'Museum'],
  ['view_points', 'Viewpoint'],
  ['beaches', 'Beach'],
  ['nature_reserves', 'Nature reserve'],
  ['cathedrals', 'Cathedral'],
  ['churches', 'Church'],
  ['monasteries', 'Monastery'],
  ['fortifications', 'Fortification'],
  ['monuments_and_memorials', 'Monument'],
  ['theatres_and_entertainments', 'Theatre'],
  ['bridges', 'Bridge'],
  ['towers', 'Tower'],
  ['amusements', 'Amusement'],
  ['foods', 'Food'],
  ['religion', 'Religious site'],
  ['historic', 'Historic site'],
  ['architecture', 'Architecture'],
  ['natural', 'Nature'],
  ['cultural', 'Culture'],
];

/** The card label for a place's comma-separated OpenTripMap kinds. */
export function categoryFor(kinds: string): string {
  const own = kinds.split(',');
  return CATEGORY_LABELS.find(([kind]) => own.includes(kind))?.[1] ?? 'Place';
}

export type PlaceSearch = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  kinds: PlaceKind[];
  /** OpenTripMap's popularity score, 0 (any) to 3 (the best known). */
  minPopularity: 0 | 1 | 2 | 3;
  limit: number;
};

export type NearbyPlace = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
};

export type OpenTripMapClient = {
  /** Named places around a point, best known first, then nearest. */
  searchPlaces(search: PlaceSearch, signal?: AbortSignal): Promise<NearbyPlace[]>;
};

type OpenTripMapClientDeps = {
  cache: Cache;
  /** The RapidAPI account key; OpenTripMap is reached through RapidAPI. */
  rapidApiKey: string;
};

const RAPIDAPI_HOST = 'opentripmap-places-v1.p.rapidapi.com';

const RadiusResponse = z.array(
  z.object({
    xid: z.string(),
    name: z.string(),
    kinds: z.string(),
    dist: z.number(),
    // A number in JSON results; tolerate the "3h" (heritage) strings of other formats.
    rate: z.union([z.number(), z.string()]).optional(),
    point: z.object({ lon: z.number(), lat: z.number() }),
  }),
);

function popularity(rate: number | string | undefined): number {
  return Number.parseInt(String(rate ?? 0), 10) || 0;
}

export function createOpenTripMapClient({ cache, rapidApiKey }: OpenTripMapClientDeps): OpenTripMapClient {
  const api = createApiClient({
    service: 'OpenTripMap',
    cache,
    // Places hardly change during a day.
    ttlSeconds: 24 * 60 * 60,
    // Headers, not query parameters, so the key never lands in cache keys or logs.
    headers: { 'X-RapidAPI-Key': rapidApiKey, 'X-RapidAPI-Host': RAPIDAPI_HOST },
  });

  return {
    async searchPlaces({ latitude, longitude, radiusMeters, kinds, minPopularity, limit }, signal) {
      const url = new URL(`https://${RAPIDAPI_HOST}/en/places/radius`);
      const params = new URLSearchParams({
        // About 100 m: fine for an 800 m lunch search, and more cache hits.
        lat: latitude.toFixed(3),
        lon: longitude.toFixed(3),
        // To the nearest 100 m, for the same reason.
        radius: String(Math.max(100, Math.round(radiusMeters / 100) * 100)),
        // Sorted, so the same kinds in another order share one cache entry.
        kinds: [...new Set(kinds)].sort().join(','),
        format: 'json',
        // Ask for extra: unnamed places (benches, plaques) are dropped below.
        limit: String(Math.min(limit * 3, 100)),
      });
      if (minPopularity > 0) params.set('rate', String(minPopularity));
      url.search = params.toString();

      return RadiusResponse.parse(await api.getJson(url, signal))
        .filter((place) => place.name.trim() !== '')
        .sort((a, b) => popularity(b.rate) - popularity(a.rate) || a.dist - b.dist)
        .slice(0, limit)
        .map((place) => ({
          id: place.xid,
          name: place.name.trim(),
          category: categoryFor(place.kinds),
          latitude: place.point.lat,
          longitude: place.point.lon,
          distanceMeters: Math.round(place.dist),
        }));
    },
  };
}
