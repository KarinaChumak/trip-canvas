import type { WeatherStripData } from 'catalog';
import { z } from 'zod';
import { createApiClient } from '../lib/api-client.js';
import type { Cache } from '../lib/cache.js';

type Condition = WeatherStripData['days'][number]['condition'];

/** WMO weather code (what Open-Meteo returns) → the catalog's condition. */
export function conditionFor(code: number): Condition {
  switch (code) {
    case 0:
      return 'sunny';
    case 1: // mainly clear
    case 2: // partly cloudy
      return 'partly-cloudy';
    case 45: // fog
    case 48: // rime fog
      return 'fog';
    case 51: case 53: case 55: case 56: case 57: // drizzle
    case 61: case 63: case 65: case 66: case 67: // rain
    case 80: case 81: case 82: // rain showers
      return 'rain';
    case 71: case 73: case 75: case 77: // snow
    case 85: case 86: // snow showers
      return 'snow';
    case 95: case 96: case 99: // thunderstorm
      return 'storm';
    default: // 3, overcast, and any code Open-Meteo adds later
      return 'cloudy';
  }
}

export type ForecastRequest = {
  location: string;
  latitude: number;
  longitude: number;
  days: number;
  unit: 'C' | 'F';
};

export type OpenMeteoClient = {
  /** The daily forecast in the shape of WeatherStrip props. */
  getWeather(request: ForecastRequest, signal?: AbortSignal): Promise<WeatherStripData>;
};

const OpenMeteoResponse = z.object({
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_probability_max: z.array(z.number().nullable()),
  }),
});

export function createOpenMeteoClient({ cache }: { cache: Cache }): OpenMeteoClient {
  // Forecasts change during the day, so keep them for half an hour.
  const api = createApiClient({ service: 'Open-Meteo', cache: { store: cache, ttlSeconds: 30 * 60 } });

  return {
    async getWeather({ location, latitude, longitude, days, unit }, signal) {
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.search = new URLSearchParams({
        // About a kilometre: plenty for a city forecast, and more cache hits.
        latitude: latitude.toFixed(2),
        longitude: longitude.toFixed(2),
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        forecast_days: String(days),
        temperature_unit: unit === 'F' ? 'fahrenheit' : 'celsius',
        // Dates in the place's own time zone, not UTC.
        timezone: 'auto',
      }).toString();

      const { daily } = await api.getJson(url, OpenMeteoResponse, signal);
      return {
        location,
        unit,
        days: daily.time.map((date, i) => ({
          date,
          condition: conditionFor(daily.weather_code[i]!),
          high: daily.temperature_2m_max[i]!,
          low: daily.temperature_2m_min[i]!,
          precipitationChance: daily.precipitation_probability_max[i] ?? null,
        })),
      };
    },
  };
}
