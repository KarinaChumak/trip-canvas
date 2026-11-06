import { skipToken, useQuery } from '@tanstack/react-query';
import type { PlaceCardData } from 'catalog';
import { accessHeaders } from '@/lib/access-code';

/** What a PlaceCard loads after it renders; null where OpenTripMap has nothing. */
export type PlaceDetails = Pick<PlaceCardData, 'address' | 'description' | 'url'>;

/** Address, description and website of one place, from the server's 24 h cache. */
export async function fetchPlaceDetails(placeId: string, signal?: AbortSignal): Promise<PlaceDetails> {
  const res = await fetch(`/api/places/${encodeURIComponent(placeId)}`, { headers: accessHeaders(), signal });
  if (!res.ok) throw new Error(`Place details failed with ${res.status}`);
  return res.json();
}

/**
 * Loads a place's details once per session; every card for the same place shares them.
 * Without a placeId (a card the model built without searchPlaces) nothing is loaded.
 */
export function usePlaceDetailsQuery(placeId: string | null) {
  return useQuery({
    queryKey: ['place-details', placeId],
    queryFn: placeId === null ? skipToken : ({ signal }) => fetchPlaceDetails(placeId, signal),
    // Places hardly change; the server caches them for a day.
    staleTime: Infinity,
    retry: 1,
  });
}
