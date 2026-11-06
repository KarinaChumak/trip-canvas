import { describe, expect, it } from 'vitest';
import { PLACE_ID_PATTERN, PlaceDetails, placeDetailsPath } from '../src/places.js';

describe('places contract', () => {
  it('accepts OpenTripMap ids and rejects anything else', () => {
    expect(PLACE_ID_PATTERN.test('N4712396344')).toBe(true);
    expect(PLACE_ID_PATTERN.test('../admin')).toBe(false);
  });

  it('builds the details path with the id encoded', () => {
    expect(placeDetailsPath('W96758903')).toBe('/api/places/W96758903');
  });

  it('parses details with every field nullable', () => {
    expect(PlaceDetails.parse({ address: null, description: null, url: null })).toEqual({
      address: null,
      description: null,
      url: null,
    });
    expect(PlaceDetails.safeParse({ address: 'Alfama', description: null, url: 'not a url' }).success).toBe(false);
  });
});
