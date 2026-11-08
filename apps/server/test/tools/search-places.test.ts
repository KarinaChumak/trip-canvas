import { describe, expect, it, vi } from 'vitest';
import type { FoundPlace, GooglePlacesClient, PlaceSearch } from '../../src/services/google-places.js';
import { createSearchPlacesTool } from '../../src/tools/search-places.js';

// execute's second argument; the tool only reads its abortSignal.
const options = { toolCallId: 't1', messages: [] } as unknown as Parameters<NonNullable<ReturnType<typeof createSearchPlacesTool>['execute']>>[1];

const SEARCH: PlaceSearch = { query: 'street food', latitude: 13.7406, longitude: 100.51, radiusMeters: 1000, limit: 5 };
const PLACE: FoundPlace = {
  ...{ id: 'ChIJq6qq6lmZ4jARSBYHgbzL0pE', name: 'Jay Fai', category: 'Thai restaurant', latitude: 13.7397, longitude: 100.5102 },
  ...{ address: '327 Maha Chai Rd, Bangkok 10200, Thailand', rating: 4.4, url: null },
};

function searchPlacesTool(places: FoundPlace[]) {
  const googlePlaces: GooglePlacesClient = { searchPlaces: vi.fn(async () => places) };
  return { tool: createSearchPlacesTool({ googlePlaces }), googlePlaces };
}

describe('searchPlaces tool', () => {
  it('passes the search through and names the source', async () => {
    const { tool, googlePlaces } = searchPlacesTool([PLACE]);

    expect(await tool.execute!(SEARCH, options)).toEqual({ places: [PLACE], source: 'Google Maps' });
    expect(googlePlaces.searchPlaces).toHaveBeenCalledWith(SEARCH, undefined);
  });

  it('returns an error the model can act on when nothing is found', async () => {
    const { tool } = searchPlacesTool([]);
    expect(await tool.execute!(SEARCH, options)).toEqual({
      error: 'No places found. Try a wider radius or a broader query.',
    });
  });
});
