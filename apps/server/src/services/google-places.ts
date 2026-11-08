import type { PlaceKind } from '@trip-canvas/catalog';
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

/** Everything a PlaceCard shows; `category` is a readable primary type ("Thai restaurant"), `priceLevel` 0 (free) to 4. */
export type FoundPlace = {
  id: string;
  name: string;
  category: string;
  kind: PlaceKind;
  latitude: number;
  longitude: number;
  address: string | null;
  rating: number | null;
  reviewCount: number | null;
  priceLevel: number | null;
  url: string | null;
};

export type GooglePlacesClient = {
  /** Places matching a text query around a point, in Google's order. */
  searchPlaces(search: PlaceSearch, signal?: AbortSignal): Promise<FoundPlace[]>;
};

type GooglePlacesClientDeps = { apiKey: string };

// The mask sets the price: the rating makes this one Enterprise Text Search (1,000 free
// a month), and every field the card shows comes with it, so no card needs a second call.
const SEARCH_FIELD_MASK = 'places.id,places.displayName,places.primaryType,places.types,places.location,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.websiteUri';

const SearchResponse = z.object({
  // Google answers {} when it finds nothing.
  places: z
    .array(
      z.object({
        id: z.string(),
        displayName: z.object({ text: z.string() }).optional(),
        primaryType: z.string().optional(),
        types: z.array(z.string()).default([]),
        location: z.object({ latitude: z.number(), longitude: z.number() }),
        formattedAddress: z.string().optional(),
        rating: z.number().optional(),
        userRatingCount: z.number().optional(),
        priceLevel: z.string().optional(),
        websiteUri: z.string().optional(),
      }),
    )
    .default([]),
});

const PRICE_LEVELS = ['FREE', 'INEXPENSIVE', 'MODERATE', 'EXPENSIVE', 'VERY_EXPENSIVE'].map((l) => `PRICE_LEVEL_${l}`);

/** "PRICE_LEVEL_MODERATE" → 2; unspecified or missing → null. */
export function priceLevelFor(level: string | undefined): number | null {
  const index = PRICE_LEVELS.indexOf(level ?? '');
  return index === -1 ? null : index;
}

/** Google's place types (https://developers.google.com/maps/documentation/places/web-service/place-types) by kind. */
const KIND_TYPES: Record<Exclude<PlaceKind, 'other'>, string[]> = {
  museum: ['museum', 'art_gallery', 'cultural_center', 'historical_landmark', 'monument'],
  temple: ['place_of_worship', 'hindu_temple', 'buddhist_temple', 'church', 'mosque', 'synagogue', 'shinto_shrine'],
  nature: ['park', 'national_park', 'state_park', 'garden', 'botanical_garden', 'hiking_area', 'nature_preserve', 'zoo', 'wildlife_park'],
  beach: ['beach'],
  viewpoint: ['observation_deck', 'scenic_spot'],
  food: ['restaurant', 'food', 'food_court', 'meal_takeaway', 'bakery', 'diner', 'deli', 'street_food'],
  cafe: ['cafe', 'coffee_shop', 'tea_house', 'dessert_shop', 'ice_cream_shop', 'juice_shop'],
  nightlife: ['bar', 'pub', 'night_club', 'wine_bar', 'karaoke'],
  shopping: ['store', 'shopping_mall', 'department_store', 'gift_shop', 'book_store'],
  market: ['market', 'farmers_market', 'flea_market'],
};

/** Families of types by their ending: "thai_restaurant", "art_museum", "cocktail_bar". */
const KIND_SUFFIXES: [string, PlaceKind][] = [['_restaurant', 'food'], ['_museum', 'museum'], ['_temple', 'temple'], ['_bar', 'nightlife'], ['_store', 'shopping']];

/** The primary type decides; the other types, most specific first as Google lists them, are the fallback. */
export function kindFor(primaryType: string | undefined, types: string[]): PlaceKind {
  for (const type of primaryType ? [primaryType, ...types] : types) {
    const exact = Object.entries(KIND_TYPES).find(([, members]) => members.includes(type))?.[0] as PlaceKind | undefined;
    const kind = exact ?? KIND_SUFFIXES.find(([suffix]) => type.endsWith(suffix))?.[1];
    if (kind) return kind;
  }
  return 'other';
}

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
          kind: kindFor(place.primaryType, place.types),
          latitude: place.location.latitude,
          longitude: place.location.longitude,
          address: place.formattedAddress ?? null,
          rating: place.rating ?? null,
          reviewCount: place.userRatingCount ?? null,
          priceLevel: priceLevelFor(place.priceLevel),
          url: place.websiteUri ?? null,
        };
      });
    },
  };
}
