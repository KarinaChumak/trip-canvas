import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { createPlacesRoute } from '../../src/routes/places.js';
import type { OpenTripMapClient, PlaceDetails } from '../../src/services/open-trip-map.js';

const DETAILS: PlaceDetails = { address: 'Largo de Santa Luzia, Alfama', description: null, url: 'http://farolsantaluzia.com/' };

function appWith(getPlaceDetails: OpenTripMapClient['getPlaceDetails']) {
  const openTripMap: OpenTripMapClient = { searchPlaces: vi.fn(), getPlaceDetails: vi.fn(getPlaceDetails) };
  return { app: new Hono().route('/api', createPlacesRoute({ openTripMap })), openTripMap };
}

describe('GET /api/places/:id', () => {
  it('returns the place details', async () => {
    const { app, openTripMap } = appWith(async () => DETAILS);
    const res = await app.request('/api/places/N4712396344');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(DETAILS);
    expect(openTripMap.getPlaceDetails).toHaveBeenCalledWith('N4712396344', expect.any(AbortSignal));
  });

  it('rejects an id that is not an OpenTripMap id', async () => {
    const { app, openTripMap } = appWith(async () => DETAILS);

    expect((await app.request('/api/places/..%2Fsecret')).status).toBe(400);
    expect(openTripMap.getPlaceDetails).not.toHaveBeenCalled();
  });

  it('answers 502 when OpenTripMap fails', async () => {
    const { app } = appWith(async () => {
      throw new Error('OpenTripMap returned 500');
    });
    const res = await app.request('/api/places/N1');

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'Place details are unavailable' });
  });
});
