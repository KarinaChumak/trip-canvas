import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { createPlacesRoute } from '../../src/routes/places.js';
import type { PlaceDetails } from '@trip-canvas/contracts';
import type { OpenTripMapClient } from '../../src/services/open-trip-map.js';
import { PlacePhotoNotFoundError, type GooglePlacesClient } from '../../src/services/google-places.js';

const DETAILS: PlaceDetails = { address: 'Largo de Santa Luzia, Alfama', description: null, url: 'http://farolsantaluzia.com/' };

function appWith(getPlaceDetails: OpenTripMapClient['getPlaceDetails'], getPlacePhoto: GooglePlacesClient['getPlacePhoto'] = vi.fn()) {
  const openTripMap: OpenTripMapClient = { searchPlaces: vi.fn(), getPlaceDetails: vi.fn(getPlaceDetails) };
  const googlePlaces: GooglePlacesClient = { searchPlaces: vi.fn(), getPlacePhoto: vi.fn(getPlacePhoto) };
  return { app: new Hono().route('/api', createPlacesRoute({ openTripMap, googlePlaces })), openTripMap, googlePlaces };
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

describe('GET /api/places/:id/photo', () => {
  const ID = 'ChIJ0SRzXYJ0GQ0RxsGOW3zPxV8';
  const PHOTO = { photoUri: 'https://lh3.googleusercontent.com/p/abc', author: null, count: 3 };
  const photoApp = (getPlacePhoto: GooglePlacesClient['getPlacePhoto']) => appWith(async () => DETAILS, getPlacePhoto);

  it('returns the photo of a Google place', async () => {
    const { app, googlePlaces } = photoApp(async () => PHOTO);
    const res = await app.request(`/api/places/${ID}/photo?index=2&width=800`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PHOTO);
    expect(googlePlaces.getPlacePhoto).toHaveBeenCalledWith(ID, 2, 800, expect.any(AbortSignal));
  });

  it.each(['index=10&width=400', 'index=-1&width=400', 'index=0&width=99', 'index=0&width=1601', 'width=400'])('rejects %s', async (query) => {
    const { app, googlePlaces } = photoApp(async () => PHOTO);
    expect((await app.request(`/api/places/${ID}/photo?${query}`)).status).toBe(400);
    expect(googlePlaces.getPlacePhoto).not.toHaveBeenCalled();
  });

  it('answers 404 when the place has no photo there, 502 when Google fails', async () => {
    const missing = photoApp(async () => {
      throw new PlacePhotoNotFoundError(ID, 0);
    });
    expect((await missing.app.request(`/api/places/${ID}/photo?index=0&width=400`)).status).toBe(404);

    const failing = photoApp(async () => {
      throw new Error('Google Places returned 500');
    });
    const res = await failing.app.request(`/api/places/${ID}/photo?index=0&width=400`);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'Place photo is unavailable' });
  });
});
