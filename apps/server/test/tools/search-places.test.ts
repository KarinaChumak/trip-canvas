import { describe, expect, it, vi } from 'vitest';
import type { NearbyPlace, OpenTripMapClient, PlaceSearch } from '../../src/services/open-trip-map.js';
import { createSearchPlacesTool } from '../../src/tools/search-places.js';

// execute's second argument; the tool only reads its abortSignal.
const options = { toolCallId: 't1', messages: [] } as unknown as Parameters<NonNullable<ReturnType<typeof createSearchPlacesTool>['execute']>>[1];

const SEARCH: PlaceSearch = { latitude: 38.712, longitude: -9.13, radiusMeters: 1000, kinds: ['foods'], minPopularity: 0, limit: 5 };
const PLACE: NearbyPlace = { id: 'N1', name: 'Taberna Sal Grosso', category: 'Restaurant', latitude: 38.712, longitude: -9.129, distanceMeters: 421 };

function searchPlacesTool(places: NearbyPlace[]) {
  const openTripMap: OpenTripMapClient = { searchPlaces: vi.fn(async () => places) };
  return { tool: createSearchPlacesTool({ openTripMap }), openTripMap };
}

describe('searchPlaces tool', () => {
  it('passes the search through and names the source', async () => {
    const { tool, openTripMap } = searchPlacesTool([PLACE]);

    expect(await tool.execute!(SEARCH, options)).toEqual({ places: [PLACE], source: 'OpenTripMap' });
    expect(openTripMap.searchPlaces).toHaveBeenCalledWith(SEARCH, undefined);
  });

  it('returns an error the model can act on when nothing is found', async () => {
    const { tool } = searchPlacesTool([]);
    expect(await tool.execute!(SEARCH, options)).toEqual({
      error: 'No places found. Try a wider radius, other kinds or a lower minPopularity.',
    });
  });
});
