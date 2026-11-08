import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateEmitComponent } from '@trip-canvas/catalog/schema';
import { memoryCache } from '../../src/lib/cache.js';
import { conditionFor, createOpenMeteoClient, type ForecastRequest } from '../../src/services/open-meteo.js';

const OPEN_METEO = {
  daily: {
    time: ['2026-11-05', '2026-11-06'],
    weather_code: [0, 61],
    temperature_2m_max: [21.4, 18.2],
    temperature_2m_min: [14.1, 13.0],
    precipitation_probability_max: [5, null],
  },
};

const LISBON: ForecastRequest = { location: 'Lisbon', latitude: 38.7077507, longitude: -9.1365919, days: 2, unit: 'C' };

const openMeteo = () => createOpenMeteoClient({ cache: memoryCache() });

function stubFetch(body: unknown, status = 200) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('openMeteo.getWeather', () => {
  it('maps the Open-Meteo forecast to WeatherStrip props', async () => {
    const fetch = stubFetch(OPEN_METEO);
    const forecast = await openMeteo().getWeather(LISBON);

    expect(forecast.days).toEqual([
      { date: '2026-11-05', condition: 'sunny', high: 21.4, low: 14.1, precipitationChance: 5 },
      { date: '2026-11-06', condition: 'rain', high: 18.2, low: 13.0, precipitationChance: null },
    ]);
    expect(validateEmitComponent({ component: { type: 'WeatherStrip', props: forecast } })).toMatchObject({ ok: true });

    const [url] = fetch.mock.calls[0] as unknown as [URL];
    expect(url.searchParams.get('latitude')).toBe('38.71');
    expect(url.searchParams.get('forecast_days')).toBe('2');
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
  });

  it('asks for Fahrenheit when the unit is F', async () => {
    const fetch = stubFetch(OPEN_METEO);
    await openMeteo().getWeather({ ...LISBON, unit: 'F' });

    const [url] = fetch.mock.calls[0] as unknown as [URL];
    expect(url.searchParams.get('temperature_unit')).toBe('fahrenheit');
  });

  it('serves the same request from the cache', async () => {
    const fetch = stubFetch(OPEN_METEO);
    const client = openMeteo();

    await client.getWeather(LISBON);
    await client.getWeather(LISBON);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('throws on an HTTP error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubFetch({}, 500);
    await expect(openMeteo().getWeather(LISBON)).rejects.toThrow('Open-Meteo returned 500');
  });
});

describe('conditionFor', () => {
  it.each([
    [0, 'sunny'],
    [2, 'partly-cloudy'],
    [3, 'cloudy'],
    [45, 'fog'],
    [53, 'rain'],
    [81, 'rain'],
    [73, 'snow'],
    [86, 'snow'],
    [95, 'storm'],
    [42, 'cloudy'],
  ])('maps WMO code %i to %s', (code, condition) => {
    expect(conditionFor(code)).toBe(condition);
  });
});
