import type { Cache } from '../lib/cache.js';
import type { Env } from '../lib/env.js';
import { createGooglePlacesClient } from './google-places.js';
import { createGoogleRoutesClient } from './google-routes.js';
import { createNominatimClient } from './nominatim.js';
import { createOpenMeteoClient } from './open-meteo.js';

type ServicesDeps = {
  cache: Cache;
  /** Only the settings services need; a new API adds its key here. */
  env: Pick<Env, 'NOMINATIM_USER_AGENT' | 'GOOGLE_MAPS_API_KEY'>;
};

/**
 * Every outside API client, created once. Sharing one instance matters: Nominatim's
 * rate limit only holds if every tool calls it through the same request queue.
 */
export function createServices({ cache, env }: ServicesDeps) {
  return {
    googlePlaces: createGooglePlacesClient({ apiKey: env.GOOGLE_MAPS_API_KEY }),
    googleRoutes: createGoogleRoutesClient({ apiKey: env.GOOGLE_MAPS_API_KEY }),
    nominatim: createNominatimClient({ cache, userAgent: env.NOMINATIM_USER_AGENT }),
    openMeteo: createOpenMeteoClient({ cache }),
  };
}

export type Services = ReturnType<typeof createServices>;
