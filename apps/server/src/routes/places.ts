import { Hono } from 'hono';
import { PLACE_ID_PATTERN, type PlaceDetails } from '@trip-canvas/contracts';
import type { Services } from '../services/index.js';

type PlacesRouteDeps = Pick<Services, 'openTripMap'>;

/**
 * Details for one place, loaded by the PlaceCard after it renders, so the agent's
 * turn doesn't wait for them. Served from the 24 h cache after the first call.
 */
export function createPlacesRoute({ openTripMap }: PlacesRouteDeps) {
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

  return route;
}
