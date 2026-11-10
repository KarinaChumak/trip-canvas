import { tool } from 'ai';
import { z } from 'zod';
import { getLongestLayoverMinutes, sortByConvenience } from '../lib/flight-utils.js';
import { settleRequests } from '../lib/request-utils.js';
import type { Services } from '../services/index.js';

/** Enough to choose from, without filling the model's context with every fare. */
const MAX_FLIGHTS = 10;

export const Airports = z
  .array(z.string().regex(/^[A-Za-z]{3}$/))
  .min(1)
  .max(2);

export const Day = z.iso.date();

/** Who flies and how, shared with findCheapestFlightDates. */
export const FareFilters = z.object({
  adults: z.number().int().min(1).max(9).default(1),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  maxStops: z.number().int().min(0).max(2).optional().describe('0 for direct only; leave out for any'),
  market: z
    .string()
    .regex(/^[A-Za-z]{2}$/)
    .describe('2-letter country code that sets the currency, e.g. "TH" for THB or "DE" for EUR; one per trip'),
});

export const SearchFlightsInput = z.object({
  from: Airports.describe('IATA airport codes to fly from, e.g. ["NUE"]; for a city with two airports, give both'),
  to: Airports.describe('IATA airport codes to fly to, e.g. ["LIS"]; for a city with two airports, give both'),
  departureDate: Day.describe('YYYY-MM-DD'),
  returnDate: Day.optional().describe('YYYY-MM-DD; only for a round trip'),
  ...FareFilters.shape,
  maxLayoverMinutes: z.number().int().positive().optional().describe("Drop fares with a longer wait at any stop; leave out if the user doesn't mind"),
  limit: z.number().int().min(1).max(MAX_FLIGHTS).default(MAX_FLIGHTS).describe('How many of the most convenient fares to return; 3 when comparing several dates'),
});

type SearchFlightsDeps = Pick<Services, 'ignav'>;

/** Real fares from Ignav (D-046), one paid request per airport pair. */
export function createSearchFlightsTool({ ignav }: SearchFlightsDeps) {
  return tool({
    description:
      'Search real flight fares between airports on a date, one way or round trip, most convenient first (cheap with little layover time). Prices are at search time. Use IATA airport codes. Show the flights in one FlightList per direction, copied as is and in order; a round-trip search gives one list whose fares hold both legs.',
    inputSchema: SearchFlightsInput,
    execute: async ({ from, to, maxLayoverMinutes, limit, ...search }, { abortSignal }) => {
      const pairs = from.flatMap((origin) =>
        to.filter((destination) => destination !== origin).map((destination) => ({ origin, destination })),
      );
      const { results, failed } = await settleRequests(
        pairs,
        (pair) => ignav.searchFlights({ ...pair, ...search }, abortSignal),
        ({ origin, destination }) => `${origin} → ${destination}`,
      );
      // Ignav has no layover filter, so long waits are dropped here.
      const fitting = results.flat().filter((flight) => maxLayoverMinutes === undefined || getLongestLayoverMinutes(flight) <= maxLayoverMinutes);
      const flights = sortByConvenience(fitting).slice(0, limit);

      if (flights.length === 0) {
        return { error: `No flights found from ${from.join('/')} to ${to.join('/')} on ${search.departureDate}. Try another date or nearby airports.` };
      }
      // Name failed airport pairs, so the model can say those weren't searched.
      return { flights, source: 'Ignav', ...(failed.length > 0 && { failed }) };
    },
  });
}
