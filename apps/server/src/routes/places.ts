import { Hono } from 'hono';
import { z } from 'zod';
import { PLACE_ID_PATTERN, type PlaceDetails, type PlacePhoto } from '@trip-canvas/contracts';
import type { Services } from '../services/index.js';
import { PlacePhotoNotFoundError } from '../services/google-places.js';

// Google returns at most 10 photos; wider than 1600 px is more than a card needs.
const PhotoQuery = z.object({
  index: z.coerce.number().int().min(0).max(9),
  width: z.coerce.number().int().min(100).max(1600),
});

type PlacesRouteDeps = Pick<Services, 'openTripMap' | 'googlePlaces'>;

/**
 * Details and photos for one place, loaded by the PlaceCard after it renders, so the
 * agent's turn doesn't wait for them. Details come from the 24 h cache after the first call.
 */
export function createPlacesRoute({ openTripMap, googlePlaces }: PlacesRouteDeps) {
  const route = new Hono();

  route.get('/places/:id', async (c) => {
    const id = c.req.param('id');
    if (!PLACE_ID_PATTERN.test(id)) return c.json({ error: 'Invalid place id' }, 400);

    try {
      const details: PlaceDetails = await openTripMap.getPlaceDetails(id, c.req.raw.signal);
      return c.json(details);
    } catch {
      // The API client has already logged the cause.
      return c.json({ error: 'Place details are unavailable' }, 502);
    }
  });

  // Each call is billed (Place Photos), so the card asks only for what it shows; Google's
  // terms forbid caching it (D-043, D-050).
  route.get('/places/:id/photo', async (c) => {
    const id = c.req.param('id');
    const query = PhotoQuery.safeParse(c.req.query());
    if (!PLACE_ID_PATTERN.test(id) || !query.success) return c.json({ error: 'Invalid photo request' }, 400);

    try {
      const photo: PlacePhoto = await googlePlaces.getPlacePhoto(id, query.data.index, query.data.width, c.req.raw.signal);
      return c.json(photo);
    } catch (err) {
      return err instanceof PlacePhotoNotFoundError ? c.json({ error: 'No such photo' }, 404) : c.json({ error: 'Place photo is unavailable' }, 502);
    }
  });

  return route;
}
