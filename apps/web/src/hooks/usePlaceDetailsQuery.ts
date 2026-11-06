import { skipToken, useQuery } from '@tanstack/react-query';
import { PlaceDetails, placeDetailsPath } from '@trip-canvas/contracts';
import { accessHeaders } from '@/lib/access-code';

/**
 * Address, description and website of one place, from the server's 24 h cache. The
 * response is parsed with the shared contract, so a server change that breaks it shows
 * as a failed query (the card stays without details) instead of wrong data on screen.
 */
export async function fetchPlaceDetails(placeId: string, signal?: AbortSignal): Promise<PlaceDetails> {
  const res = await fetch(placeDetailsPath(placeId), { headers: accessHeaders(), signal });
  if (!res.ok) throw new Error(`Place details failed with ${res.status}`);
  return PlaceDetails.parse(await res.json());
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
