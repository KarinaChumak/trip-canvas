import { z } from 'zod';

/** Google place ids ("ChIJ0SRzXYJ0GQ0RxsGOW3zPxV8", sometimes far longer); anything else never reaches an API. */
export const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{1,256}$/;

/** `GET /api/places/:id/photo`: photo `index` (0–9) of a place, at most `width` pixels wide. */
export function placePhotoPath(placeId: string, index: number, width: number): string {
  return `/api/places/${encodeURIComponent(placeId)}/photo?index=${index}&width=${width}`;
}

/**
 * One place photo: a short-lived image URL without the API key, the author Google
 * requires to be shown with it, and how many photos the place has.
 */
export const PlacePhoto = z.object({
  photoUri: z.url(),
  author: z.object({ name: z.string(), url: z.string().nullable() }).nullable(),
  count: z.number().int().min(1),
});

export type PlacePhoto = z.infer<typeof PlacePhoto>;
