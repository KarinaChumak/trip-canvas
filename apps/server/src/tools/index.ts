import { EMIT_COMPONENT_TOOL } from '@trip-canvas/catalog/schema';
import type { Services } from '../services/index.js';
import { emitComponent } from './emit-component.js';
import { createFindConnectionsTool } from './find-connections.js';
import { createGeocodeTool } from './geocode.js';
import { createSearchFlightsTool } from './search-flights.js';
import { createSearchPlacesTool } from './search-places.js';
import { createWeatherTool } from './weather.js';
import { webSearch } from './web-search.js';

/** Every tool the agent can call, keyed by the name the model sees. */
export function createTools({ googleRoutes, ignav, nominatim, openMeteo, openTripMap }: Services) {
  // Each tool gets only the services it calls, so this reads as a map of who uses what.
  return {
    [EMIT_COMPONENT_TOOL]: emitComponent,
    findConnections: createFindConnectionsTool({ googleRoutes }),
    geocode: createGeocodeTool({ nominatim }),
    getWeather: createWeatherTool({ nominatim, openMeteo }),
    searchFlights: createSearchFlightsTool({ ignav }),
    searchPlaces: createSearchPlacesTool({ openTripMap }),
    webSearch,
  };
}

export type AgentTools = ReturnType<typeof createTools>;
