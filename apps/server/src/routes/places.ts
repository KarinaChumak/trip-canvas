import { Hono } from 'hono';
import { z } from 'zod';
import { PLACE_ID_PATTERN, type PlacePhoto } from '@trip-canvas/contracts';
import type { Services } from '../services/index.js';
import { PlacePhotoNotFoundError } from '../services/google-places.js';

// Google returns at most 10 photos; wider than 1600 px is more than a card needs.
const PhotoQuery = z.object({
  index: z.coerce.number().int().min(0).max(9),
  width: z.coerce.number().int().min(100).max(1600),
});

type PlacesRouteDeps = Pick<Services, 'googlePlaces'>;

/**
 * Photos for one place, loaded by the PlaceCard after it renders, so the agent's turn
 * doesn't wait for them.
 */
export function createPlacesRoute({ googlePlaces }: PlacesRouteDeps) {
  const route = new Hono();

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
