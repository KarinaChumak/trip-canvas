import { getLayovers } from '@trip-canvas/catalog/flight-utils';
import type { Flight } from '../services/ignav.js';

/** Every wait of both legs, in minutes; empty for direct flights. */
function getLayoverMinutes({ outbound, inbound }: Flight): number[] {
  return [...getLayovers(outbound.segments), ...getLayovers(inbound?.segments ?? [])].map(({ minutes }) => minutes);
}

/** The longest wait at any stop of either leg, in minutes; 0 for direct flights. */
export function getLongestLayoverMinutes(flight: Flight): number {
  return Math.max(0, ...getLayoverMinutes(flight));
}

/** All the waiting of a fare, both legs, in minutes. */
export function getTotalLayoverMinutes(flight: Flight): number {
  return getLayoverMinutes(flight).reduce((sum, minutes) => sum + minutes, 0);
}

/**
 * Most convenient first: each fare is ranked by price and by total layover time, and the
 * two ranks are added, so a slightly dearer fare with far less waiting comes out ahead.
 * Ranks rather than amounts keep it free of currencies and units. Ties go to the cheaper fare.
 */
export function sortByConvenience(flights: Flight[]): Flight[] {
  // A fare's rank is how many fares beat it, so equal values share a rank.
  const getRank = (flight: Flight, getValue: (flight: Flight) => number) =>
    flights.filter((other) => getValue(other) < getValue(flight)).length;
  const getPrice = (flight: Flight) => flight.price.amount;
  const getScore = (flight: Flight) => getRank(flight, getPrice) + getRank(flight, getTotalLayoverMinutes);
  return [...flights].sort((a, b) => getScore(a) - getScore(b) || getPrice(a) - getPrice(b));
}
