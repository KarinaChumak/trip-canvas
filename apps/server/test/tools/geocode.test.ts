import { describe, expect, it, vi } from 'vitest';
import type { NominatimClient } from '../../src/services/nominatim.js';
import { createGeocodeTool, suggestedRadiusFor } from '../../src/tools/geocode.js';

// execute's second argument; the tool only reads its abortSignal.
const options = { toolCallId: 't1', messages: [] } as unknown as Parameters<NonNullable<ReturnType<typeof createGeocodeTool>['execute']>>[1];

const LISBON = {
  name: 'Lisboa',
  displayName: 'Lisboa, Portugal',
  latitude: 38.7077507,
  longitude: -9.1365919,
  boundingBox: { south: 38.6913994, north: 38.7967584, west: -9.2298356, east: -9.0863328 },
};

function geocodeTool(place: Awaited<ReturnType<NominatimClient['getGeocode']>>) {
  const nominatim: NominatimClient = { getGeocode: vi.fn(async () => place) };
  return createGeocodeTool({ nominatim });
}

describe('geocode tool', () => {
  it('returns the coordinates and a radius that covers the place', async () => {
    expect(await geocodeTool(LISBON).execute!({ query: 'Lisbon' }, options)).toEqual({
      name: 'Lisboa',
      displayName: 'Lisboa, Portugal',
      latitude: 38.7077507,
      longitude: -9.1365919,
      suggestedRadiusMeters: 8600,
    });
  });

  it('returns an error the model can read when the place is unknown', async () => {
    expect(await geocodeTool(null).execute!({ query: 'Atlantis' }, options)).toEqual({
      error: 'No place found for "Atlantis".',
    });
  });
});

describe('suggestedRadiusFor', () => {
  it('keeps a tiny box at 500 m and a huge one at 50 km', () => {
    expect(suggestedRadiusFor({ south: 38.711, north: 38.712, west: -9.131, east: -9.13 })).toBe(500);
    expect(suggestedRadiusFor({ south: 35, north: 42, west: -10, east: -6 })).toBe(50_000);
  });
});
