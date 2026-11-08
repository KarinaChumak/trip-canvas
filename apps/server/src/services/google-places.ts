import { z } from 'zod';
import { createApiClient } from '../lib/api-client.js';

export type PlaceSearch = {
  /** What to look for, e.g. "street food", "temples", "lunch spots". */
  query: string;
  latitude: number;
  longitude: number;
  /** Bias towards this circle; Google may still return places just outside it. */
  radiusMeters: number;
  limit: number;
};

/** Everything a PlaceCard shows; `category` is a readable primary type ("Thai restaurant"). */
export type FoundPlace = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string | null;
  rating: number | null;
  url: string | null;
};

export type GooglePlacesClient = {
  /** Places matching a text query around a point, in Google's order. */
  searchPlaces(search: PlaceSearch, signal?: AbortSignal): Promise<FoundPlace[]>;
};

type GooglePlacesClientDeps = { apiKey: string };

// The mask sets the price: the rating makes this one Enterprise Text Search (1,000 free
// a month), and every field the card shows comes with it, so no card needs a second call.
const SEARCH_FIELD_MASK = 'places.id,places.displayName,places.primaryType,places.location,places.formattedAddress,places.rating,places.websiteUri';

const SearchResponse = z.object({
  // Google answers {} when it finds nothing.
  places: z
    .array(
      z.object({
        id: z.string(),
        displayName: z.object({ text: z.string() }).optional(),
        primaryType: z.string().optional(),
        location: z.object({ latitude: z.number(), longitude: z.number() }),
        formattedAddress: z.string().optional(),
        rating: z.number().optional(),
        websiteUri: z.string().optional(),
      }),
    )
    .default([]),
});

/** "thai_restaurant" → "Thai restaurant". */
export function categoryFor(primaryType: string | undefined): string {
  if (!primaryType) return 'Place';
  const words = primaryType.replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Never cached: Google's terms forbid storing its answers, except place ids (D-043). */
export function createGooglePlacesClient({ apiKey }: GooglePlacesClientDeps): GooglePlacesClient {
  // In headers, so the key never shows up in a URL or a log line.
  const search = createApiClient({ service: 'Google Places', headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': SEARCH_FIELD_MASK } });

  return {
    async searchPlaces({ query, latitude, longitude, radiusMeters, limit }, signal) {
      const { places } = await search.postJson(
        new URL('https://places.googleapis.com/v1/places:searchText'),
        {
          textQuery: query,
          pageSize: limit,
          languageCode: 'en',
          // Google accepts a radius of 0 to 50 km.
          locationBias: { circle: { center: { latitude, longitude }, radius: Math.min(Math.max(radiusMeters, 0), 50_000) } },
        },
        SearchResponse,
        signal,
      );

      return places.flatMap((place) => {
        const name = place.displayName?.text.trim();
        if (!name) return [];
        return {
          id: place.id,
          name,
          category: categoryFor(place.primaryType),
          latitude: place.location.latitude,
          longitude: place.location.longitude,
          address: place.formattedAddress ?? null,
          rating: place.rating ?? null,
          url: place.websiteUri ?? null,
        };
      });
    },
  };
}
