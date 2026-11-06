import { z } from 'zod';

/** OpenTripMap ids look like "N4712396344" or "W96758903"; anything else never reaches the API. */
export const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;

/** `GET /api/places/:id`: what a PlaceCard loads after it renders. */
export function placeDetailsPath(placeId: string): string {
  return `/api/places/${encodeURIComponent(placeId)}`;
}

/** Address, a short English description and the website of one place; null where OpenTripMap has nothing. */
export const PlaceDetails = z.object({
  address: z.string().nullable(),
  description: z.string().nullable(),
  url: z.url().nullable(),
});

export type PlaceDetails = z.infer<typeof PlaceDetails>;
