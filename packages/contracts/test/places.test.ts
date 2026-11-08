import { describe, expect, it } from 'vitest';
import { PLACE_ID_PATTERN, placePhotoPath } from '../src/places.js';

describe('places contract', () => {
  it('accepts Google ids and rejects anything else', () => {
    expect(PLACE_ID_PATTERN.test('ChIJ0SRzXYJ0GQ0RxsGOW3zPxV8')).toBe(true);
    expect(PLACE_ID_PATTERN.test('../admin')).toBe(false);
  });

  it('builds the photo path with the id encoded', () => {
    expect(placePhotoPath('ChIJ0SRzXYJ0GQ0RxsGOW3zPxV8', 2, 800)).toBe('/api/places/ChIJ0SRzXYJ0GQ0RxsGOW3zPxV8/photo?index=2&width=800');
  });
});
