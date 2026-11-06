import { EMIT_COMPONENT_TOOL } from 'catalog/schema';
import type { Services } from '../services/index.js';
import { emitComponent } from './emit-component.js';
import { createGeocodeTool } from './geocode.js';
import { createSearchPlacesTool } from './search-places.js';
import { createWeatherTool } from './weather.js';

/** Every tool the agent can call, keyed by the name the model sees. */
export function createTools({ nominatim, openMeteo, openTripMap }: Services) {
  // Each tool gets only the services it calls, so this reads as a map of who uses what.
  return {
    [EMIT_COMPONENT_TOOL]: emitComponent,
    geocode: createGeocodeTool({ nominatim }),
    getWeather: createWeatherTool({ nominatim, openMeteo }),
    searchPlaces: createSearchPlacesTool({ openTripMap }),
  };
}

export type AgentTools = ReturnType<typeof createTools>;
