import { tool } from 'ai';
import { z } from 'zod';
import type { Services } from '../services/index.js';

export const SearchPlacesInput = z.object({
  query: z.string().min(1).describe('What to look for, e.g. "street food", "temples", "lunch spots"'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z
    .number()
    .int()
    .min(100)
    .max(50_000)
    .describe("geocode's suggestedRadiusMeters; about 1000 for \"near X\", wider for \"around the city\""),
  // At most 10 cards in one answer.
  limit: z.number().int().min(1).max(10),
});

/** Real places around a point, from Google Maps. */
export function createSearchPlacesTool({ googlePlaces }: Pick<Services, 'googlePlaces'>) {
  return tool({
    description:
      'Find real places (food, sights, museums, nature…) matching a text query around coordinates from geocode. Show them as PlaceCards (pass each id as placeId) or use them as DayItinerary stops.',
    inputSchema: SearchPlacesInput,
    execute: async (search, { abortSignal }) => {
      const places = await googlePlaces.searchPlaces(search, abortSignal);
      if (places.length === 0) {
        return { error: 'No places found. Try a wider radius or a broader query.' };
      }
      return { places, source: 'Google Maps' };
    },
  });
}
