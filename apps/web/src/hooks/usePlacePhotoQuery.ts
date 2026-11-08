import { skipToken, useQuery } from '@tanstack/react-query';
import { PlacePhoto, placePhotoPath } from '@trip-canvas/contracts';
import { accessHeaders } from '@/lib/access-code';

/**
 * One photo of a place, or null when it has none at that index (404). Any other
 * failure throws, so the query fails and the photo isn't shown.
 */
export async function fetchPlacePhoto(placeId: string, index: number, width: number, signal?: AbortSignal): Promise<PlacePhoto | null> {
  const res = await fetch(placePhotoPath(placeId, index, width), { headers: accessHeaders(), signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Place photo failed with ${res.status}`);
  return PlacePhoto.parse(await res.json());
}

/**
 * Loads photo `index` of a place once per session. Each photo is a billed Google call
 * (D-050), so nothing loads without a placeId or until `enabled` (the carousel got near it).
 */
export function usePlacePhotoQuery(placeId: string | null, index: number, width: number, enabled = true) {
  return useQuery({
    queryKey: ['place-photo', placeId, index, width],
    queryFn: placeId === null || !enabled ? skipToken : ({ signal }) => fetchPlacePhoto(placeId, index, width, signal),
    staleTime: Infinity,
    retry: 1,
  });
}
