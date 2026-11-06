import { describe, expect, it, vi } from 'vitest';
import type { NominatimClient } from '../../src/services/nominatim.js';
import type { OpenMeteoClient } from '../../src/services/open-meteo.js';
import { createWeatherTool } from '../../src/tools/weather.js';

// execute's second argument; the tool only reads its abortSignal.
const options = { toolCallId: 't1', messages: [] } as unknown as Parameters<NonNullable<ReturnType<typeof createWeatherTool>['execute']>>[1];
const forecast = { location: 'Lisbon', unit: 'C' as const, days: [] };

function weatherTool(place: Awaited<ReturnType<NominatimClient['getGeocode']>>) {
  const nominatim: NominatimClient = { getGeocode: vi.fn(async () => place) };
  const openMeteo: OpenMeteoClient = { getWeather: vi.fn(async () => forecast) };
  return { tool: createWeatherTool({ nominatim, openMeteo }), openMeteo };
}

describe('getWeather tool', () => {
  it('looks up the place, then gets the forecast for its coordinates', async () => {
    const { tool, openMeteo } = weatherTool({ name: 'Lisbon', displayName: 'Lisbon, Portugal', latitude: 38.7, longitude: -9.1 });

    expect(await tool.execute!({ place: 'Lisbon', days: 3, unit: 'C' }, options)).toEqual({ ...forecast, source: 'Open-Meteo' });
    expect(openMeteo.getWeather).toHaveBeenCalledWith(
      { location: 'Lisbon', latitude: 38.7, longitude: -9.1, days: 3, unit: 'C' },
      undefined,
    );
  });

  it('returns an error the model can read when the place is unknown', async () => {
    const { tool, openMeteo } = weatherTool(null);

    expect(await tool.execute!({ place: 'Atlantis', days: 3, unit: 'C' }, options)).toEqual({
      error: 'No place found for "Atlantis".',
    });
    expect(openMeteo.getWeather).not.toHaveBeenCalled();
  });
});
