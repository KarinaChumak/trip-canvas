import { tool } from 'ai';
import { z } from 'zod';
import type { Services } from '../services/index.js';
import type { BoundingBox } from '../services/nominatim.js';

const METERS_PER_DEGREE = 111_320;
const MIN_RADIUS_METERS = 500;
const MAX_RADIUS_METERS = 50_000;

/**
 * A search radius that covers the place: half its bounding box's diagonal, so
 * "Alfama" gets about a kilometre and "Bangkok" tens of kilometres. Rounded to 100 m.
 */
export function suggestedRadiusFor({ south, north, west, east }: BoundingBox): number {
  const middleLatitude = ((south + north) / 2) * (Math.PI / 180);
  const height = (north - south) * METERS_PER_DEGREE;
  const width = (east - west) * METERS_PER_DEGREE * Math.cos(middleLatitude);
  const radius = Math.hypot(height, width) / 2;
  return Math.round(Math.min(Math.max(radius, MIN_RADIUS_METERS), MAX_RADIUS_METERS) / 100) * 100;
}

export const GeocodeInput = z.object({
  query: z.string().min(1).describe('City, neighbourhood, address or landmark, e.g. "Alfama, Lisbon"'),
});

/** Coordinates for a place name, so the model can search around it with searchPlaces. */
export function createGeocodeTool({ nominatim }: Pick<Services, 'nominatim'>) {
  return tool({
    description:
      'Find the coordinates of a place, and a search radius that covers it. Call it before searchPlaces.',
    inputSchema: GeocodeInput,
    execute: async ({ query }, { abortSignal }) => {
      const found = await nominatim.getGeocode(query, abortSignal);
      if (!found) return { error: `No place found for "${query}".` };

      const { name, displayName, latitude, longitude, boundingBox } = found;
      return { name, displayName, latitude, longitude, suggestedRadiusMeters: suggestedRadiusFor(boundingBox) };
    },
  });
}
