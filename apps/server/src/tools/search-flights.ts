import { tool } from 'ai';
import { z } from 'zod';
import type { Services } from '../services/index.js';
import type { Flight } from '../services/ignav.js';

/** Enough to choose from, without filling the model's context with every fare. */
const MAX_FLIGHTS = 10;

const Airports = z
  .array(z.string().regex(/^[A-Za-z]{3}$/))
  .min(1)
  .max(2);

const Day = z.iso.date();

export const SearchFlightsInput = z.object({
  from: Airports.describe('IATA airport codes to fly from, e.g. ["NUE"]. For Bangkok give both airports: ["BKK", "DMK"]'),
  to: Airports.describe('IATA airport codes to fly to, e.g. ["LIS"] or ["CNX"]'),
  departureDate: Day.describe('YYYY-MM-DD'),
  returnDate: Day.optional().describe('YYYY-MM-DD; only for a round trip'),
  adults: z.number().int().min(1).max(9).default(1),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  maxStops: z.number().int().min(0).max(2).optional().describe('0 for direct only; leave out for any'),
  market: z
    .string()
    .regex(/^[A-Za-z]{2}$/)
    .describe('2-letter country code that sets the currency, e.g. "TH" for THB or "DE" for EUR; one per trip'),
});

type SearchFlightsDeps = Pick<Services, 'ignav'>;

/** Real fares from Ignav (D-046), one paid request per airport pair. */
export function createSearchFlightsTool({ ignav }: SearchFlightsDeps) {
  return tool({
    description:
      'Search real flight fares between airports on a date, one way or round trip. Prices are at search time. Use IATA airport codes.',
    inputSchema: SearchFlightsInput,
    execute: async ({ from, to, ...search }, { abortSignal }) => {
      const pairs = from.flatMap((origin) =>
        to.filter((destination) => destination !== origin).map((destination) => ({ origin, destination })),
      );
      const results = await Promise.all(
        pairs.map((pair) => ignav.searchFlights({ ...pair, ...search }, abortSignal)),
      );
      const flights: Flight[] = results
        .flat()
        .sort((a, b) => a.price.amount - b.price.amount)
        .slice(0, MAX_FLIGHTS);

      if (flights.length === 0) {
        return { error: `No flights found from ${from.join('/')} to ${to.join('/')} on ${search.departureDate}. Try another date or nearby airports.` };
      }
      return { flights, source: 'Ignav' };
    },
  });
}
