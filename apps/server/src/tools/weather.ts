import { tool } from 'ai';
import { z } from 'zod';
import type { Services } from '../services/index.js';

export const WeatherInput = z.object({
  place: z.string().min(1).describe('City, area or address, e.g. "Lisbon, Portugal"'),
  days: z.number().int().min(1).max(14).describe('Number of days from today'),
  unit: z.enum(['C', 'F']),
});

/**
 * One tool call for a forecast: it looks up the place itself, so the model doesn't
 * spend a round trip on a separate geocode call.
 */
export function createWeatherTool({ nominatim, openMeteo }: Pick<Services, 'nominatim' | 'openMeteo'>) {
  return tool({
    description: 'Get the real daily forecast for a place. Show the result in a WeatherStrip.',
    inputSchema: WeatherInput,
    execute: async ({ place, days, unit }, { abortSignal }) => {
      const found = await nominatim.getGeocode(place, abortSignal);
      if (!found) return { error: `No place found for "${place}".` };

      const { latitude, longitude, name } = found;
      const forecast = await openMeteo.getWeather({ location: name, latitude, longitude, days, unit }, abortSignal);
      return { ...forecast, source: 'Open-Meteo' };
    },
  });
}
