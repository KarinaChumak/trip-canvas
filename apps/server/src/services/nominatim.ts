import { z } from 'zod';
import { createApiClient } from '../lib/api-client.js';
import type { Cache } from '../lib/cache.js';

/** The area a match covers, in degrees: a whole city for "Lisbon", a few streets for "Alfama". */
export type BoundingBox = { south: number; north: number; west: number; east: number };

export type Place = { name: string; displayName: string; latitude: number; longitude: number; boundingBox: BoundingBox };

export type NominatimClient = {
  /** The first match for a place name, or null when nothing matches. */
  getGeocode(query: string, signal?: AbortSignal): Promise<Place | null>;
};

type NominatimClientDeps = {
  cache: Cache;
  /** Nominatim asks every app to identify itself in the User-Agent. */
  userAgent: string;
};

const NominatimResponse = z.array(
  z.object({
    name: z.string(),
    display_name: z.string(),
    lat: z.coerce.number(),
    lon: z.coerce.number(),
    // [south, north, west, east], as strings.
    boundingbox: z.tuple([z.coerce.number(), z.coerce.number(), z.coerce.number(), z.coerce.number()]),
  }),
);

export function createNominatimClient({ cache, userAgent }: NominatimClientDeps): NominatimClient {
  const api = createApiClient({
    service: 'Nominatim',
    cache,
    // Place coordinates hardly change, so keep them for a month.
    ttlSeconds: 30 * 24 * 60 * 60,
    // Nominatim's usage policy allows at most one request a second.
    minIntervalMs: 1000,
    headers: { 'User-Agent': userAgent },
  });

  return {
    async getGeocode(query, signal) {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      // Normalised, so "Lisbon" and " lisbon" share one cache entry.
      const q = query.trim().replace(/\s+/g, ' ').toLowerCase();
      url.search = new URLSearchParams({ q, format: 'jsonv2', limit: '1', 'accept-language': 'en' }).toString();

      const place = (await api.getJson(url, NominatimResponse, signal))[0];
      if (!place) return null;
      const [south, north, west, east] = place.boundingbox;
      return {
        name: place.name,
        displayName: place.display_name,
        latitude: place.lat,
        longitude: place.lon,
        boundingBox: { south, north, west, east },
      };
    },
  };
}
