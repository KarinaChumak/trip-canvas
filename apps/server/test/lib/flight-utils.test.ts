import { describe, expect, it } from 'vitest';
import { getLongestLayoverMinutes, getTotalLayoverMinutes, sortByConvenience } from '../../src/lib/flight-utils.js';
import { getDirectFlight, getFlightWithStop } from '../fixtures/flights.js';

describe('layover minutes', () => {
  it('are 0 for a direct fare and the wait at the stop otherwise', () => {
    expect(getLongestLayoverMinutes(getDirectFlight('direct', 'BKK', 1000))).toBe(0);
    const viaPhuket = getFlightWithStop('via-hkt', 'BKK', 1000, '13:20', '15:00');
    expect(getLongestLayoverMinutes(viaPhuket)).toBe(300);
    expect(getTotalLayoverMinutes({ ...viaPhuket, inbound: viaPhuket.outbound })).toBe(600);
  });
});

describe('sortByConvenience', () => {
  it('adds the price rank and the layover rank, cheaper first on a tie', () => {
    const fares = [
      getFlightWithStop('cheapest-5h-wait', 'BKK', 900, '13:20', '15:00'),
      getFlightWithStop('cheap-1h-wait', 'BKK', 950, '09:20', '10:40'),
      getDirectFlight('direct', 'BKK', 1500),
      getDirectFlight('direct-dearer', 'BKK', 2500),
    ];
    // Scores (price rank + layover rank): 0+3, 1+2, 2+0, 3+0.
    expect(sortByConvenience(fares).map((fare) => fare.id)).toEqual(['direct', 'cheapest-5h-wait', 'cheap-1h-wait', 'direct-dearer']);
  });
});
