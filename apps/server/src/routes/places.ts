import { Hono } from 'hono';
import type { Services } from '../services/index.js';

// OpenTripMap ids look like "N4712396344" or "W96758903"; anything else never reaches the API.
const PLACE_ID = /^[A-Za-z0-9_-]{1,40}$/;

type PlacesRouteDeps = Pick<Services, 'openTripMap'>;

/**
 * Details for one place, loaded by the PlaceCard after it renders, so the agent's
 * turn doesn't wait for them. Served from the 24 h cache after the first call.
 */
export function createPlacesRoute({ openTripMap }: PlacesRouteDeps) {
  const route = new Hono();

  route.get('/places/:id', async (c) => {
    const id = c.req.param('id');
    if (!PLACE_ID.test(id)) return c.json({ error: 'Invalid place id' }, 400);

    try {
      return c.json(await openTripMap.getPlaceDetails(id, c.req.raw.signal));
    } catch {
      // The API client has already logged the cause.
      return c.json({ error: 'Place details are unavailable' }, 502);
    }
  });

  return route;
}
