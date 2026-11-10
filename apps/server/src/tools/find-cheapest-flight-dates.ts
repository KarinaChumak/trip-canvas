import { tool } from 'ai';
import { z } from 'zod';
import { settleRequests } from '../lib/request-utils.js';
import type { Services } from '../services/index.js';
import { Airports, Day, FareFilters } from './search-flights.js';

/** Enough date options to pick from without filling the model's context. */
const MAX_FARES = 15;
const DAY_MS = 24 * 60 * 60 * 1000;
// Catalog dates are plain days, so read their weekday in UTC.
const weekdayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });

export const FindCheapestFlightDatesInput = z
  .object({
    from: Airports.describe('IATA airport codes to fly from, e.g. ["FRA"]'),
    to: Airports.describe('IATA airport codes to fly to; for a city with two airports, give both'),
    departureStart: Day.describe('First departure day to try, YYYY-MM-DD'),
    departureEnd: Day.describe('Last departure day to try, YYYY-MM-DD, at most 30 days after departureStart'),
    stayDays: z
      .array(z.number().int().min(1).max(365))
      .min(1)
      .max(3)
      .optional()
      .describe('Trip lengths in days (return date minus departure date) for a round trip, e.g. [15, 16]; leave out for one way'),
    ...FareFilters.shape,
  })
  .refine(({ departureStart, departureEnd }) => {
    const days = (Date.parse(departureEnd) - Date.parse(departureStart)) / DAY_MS;
    return days >= 0 && days <= 30;
  }, 'departureEnd must be 0–30 days after departureStart');

/** "2027-01-16" → "Sat". */
function getWeekday(date: string): string {
  return weekdayFormat.format(new Date(`${date}T00:00:00Z`));
}

/**
 * The cheapest fare per departure day from Ignav (D-046): one paid request per airport
 * pair and trip length, however many days it covers. Prices are unverified estimates.
 */
export function createFindCheapestFlightDatesTool({ ignav }: Pick<Services, 'ignav'>) {
  return tool({
    description:
      'Find the cheapest days to fly over a range of up to 31 departure days, for one way or for round trips of given lengths. Use it before searchFlights when the dates are flexible, then search the best few date pairs. Prices are estimates.',
    inputSchema: FindCheapestFlightDatesInput,
    execute: async ({ from, to, stayDays, ...search }, { abortSignal }) => {
      const requests = from.flatMap((origin) =>
        to
          .filter((destination) => destination !== origin)
          .flatMap((destination) => (stayDays ?? [undefined]).map((stay) => ({ origin, destination, stayDays: stay }))),
      );
      const { results, failed } = await settleRequests(
        requests,
        async (request) => {
          const dayFares = await ignav.findCheapestFlightDates({ ...search, ...request }, abortSignal);
          // A null price means Ignav found no fare that matches on that day, not an unknown price, so the day is left out.
          return dayFares.flatMap(({ departureDate, returnDate, price }) =>
            price
              ? [
                  {
                    from: request.origin,
                    to: request.destination,
                    departureDate,
                    departureWeekday: getWeekday(departureDate),
                    returnDate,
                    returnWeekday: returnDate && getWeekday(returnDate),
                    price,
                  },
                ]
              : [],
          );
        },
        ({ origin, destination, stayDays: stay }) => `${origin} → ${destination}${stay ? `, ${stay} days` : ''}`,
      );
      const cheapestFares = results
        .flat()
        .sort((a, b) => a.price.amount - b.price.amount)
        .slice(0, MAX_FARES);

      if (cheapestFares.length === 0) {
        return { error: `No fares found from ${from.join('/')} to ${to.join('/')} between ${search.departureStart} and ${search.departureEnd}.` };
      }
      return { fares: cheapestFares, source: 'Ignav', ...(failed.length > 0 && { failed }) };
    },
  });
}
