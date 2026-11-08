import type { PlaceDetails } from '@trip-canvas/contracts';
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
  /** Named places around a point, best known first, then nearest, one per name. */
  searchPlaces(search: PlaceSearch, signal?: AbortSignal): Promise<NearbyPlace[]>;
  /** Address, a short English description and the website of one place. */
  getPlaceDetails(id: string, signal?: AbortSignal): Promise<PlaceDetails>;
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
    // 0–3, or 5–7 for cultural heritage (OpenTripMap's "1h"–"3h").
    rate: z.union([z.number(), z.string()]).optional(),
    point: z.object({ lon: z.number(), lat: z.number() }),
  }),
);

const DetailsResponse = z.object({
  kinds: z.string().optional(),
  address: z.record(z.string(), z.string()).optional(),
  url: z.string().optional(),
  wikipedia_extracts: z.object({ title: z.string().optional(), text: z.string().optional() }).optional(),
});

/** Sort score: heritage ranks just above the same level without it, not above every level. */
export function popularity(rate: number | string | undefined): number {
  const level = Number.parseInt(String(rate ?? 0), 10) || 0;
  return level > 4 ? level - 4 + 0.5 : level;
}

/** "Largo de Santa Luzia 5, Alfama": street and number, then the district. */
export function formatAddress(address: Record<string, string> | undefined): string | null {
  if (!address) return null;
  const street = address.road ?? address.pedestrian ?? address.footway ?? address.square;
  const parts = [
    street && [street, address.house_number].filter(Boolean).join(' '),
    address.suburb ?? address.neighbourhood ?? address.city,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * The first two sentences of the English Wikipedia extract. OpenTripMap sometimes
 * returns another language's article even on /en/; its title then starts with "zh:" etc.
 */
export function shortDescription(extract: { title?: string; text?: string } | undefined): string | null {
  if (!extract?.text || !extract.title?.startsWith('en:')) return null;
  // Drop pronunciations and translations: "[ˈpɾasɐ…]", "(Portuguese: …)".
  const text = extract.text.replace(/\s*\[[^\]]*\]|\s*\([^)]*\)/g, '').trim();
  // Also split "Monument.Catholicism", where the extract glued a category onto a sentence.
  const sentences = text.split(/(?<=[.!?])\s*(?=[A-Z])/);
  return sentences.slice(0, 2).join(' ').trim() || null;
}

/** OpenStreetMap websites sometimes lack the scheme ("www.example.pt"). */
export function websiteUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(/^https?:\/\//.test(value) ? value : `https://${value}`).toString();
  } catch {
    return null;
  }
}

export function createOpenTripMapClient({ cache, rapidApiKey }: OpenTripMapClientDeps): OpenTripMapClient {
  const api = createApiClient({
    service: 'OpenTripMap',
    // Places hardly change during a day.
    cache: { store: cache, ttlSeconds: 24 * 60 * 60 },
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

      const seen = new Set<string>();
      return (await api.getJson(url, RadiusResponse, signal))
        .filter((place) => place.name.trim() !== '')
        .sort((a, b) => popularity(b.rate) - popularity(a.rate) || a.dist - b.dist)
        // OpenStreetMap often maps one viewpoint twice (a point and an area); keep the first.
        .filter((place) => {
          const key = place.name.trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
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

    async getPlaceDetails(id, signal) {
      const url = new URL(`https://${RAPIDAPI_HOST}/en/places/xid/${encodeURIComponent(id)}`);
      const details = await api.getJson(url, DetailsResponse, signal);
      return {
        address: formatAddress(details.address),
        // A restaurant's article is usually the building's ("Farol de Santa Luzia" got the
        // church's), so food places get no description.
        description: details.kinds?.split(',').includes('foods') ? null : shortDescription(details.wikipedia_extracts),
        url: websiteUrl(details.url),
      };
    },
  };
}
