import { tool } from 'ai';
import { z } from 'zod';
import type { Services } from '../services/index.js';
import { PLACE_KINDS } from '../services/open-trip-map.js';

export const SearchPlacesInput = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z
    .number()
    .int()
    .min(100)
    .max(50_000)
    .describe("geocode's suggestedRadiusMeters; about 1000 for \"near X\", wider for \"around the city\""),
  kinds: z
    .array(z.enum(PLACE_KINDS))
    .min(1)
    .describe('e.g. ["foods"] for lunch, ["interesting_places"] for things to do, ["natural"] for parks'),
  minPopularity: z
    .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
    .describe('0 for any place; 2 or 3 to keep only well-known sights in a wide search'),
  // At most 10: each card loads its details with one more call.
  limit: z.number().int().min(1).max(10),
});

/** Real places around a point, from OpenTripMap. */
export function createSearchPlacesTool({ openTripMap }: Pick<Services, 'openTripMap'>) {
  return tool({
    description:
      'Find real places (food, sights, museums, nature…) around coordinates from geocode. Show them as PlaceCards (pass each id as placeId) or use them as DayItinerary stops.',
    inputSchema: SearchPlacesInput,
    execute: async (search, { abortSignal }) => {
      const places = await openTripMap.searchPlaces(search, abortSignal);
      if (places.length === 0) {
        return { error: 'No places found. Try a wider radius, other kinds or a lower minPopularity.' };
      }
      return { places, source: 'OpenTripMap' };
    },
  });
}
