import { describe, expect, it } from 'vitest';
import { getLayovers } from '../src/flight-utils.js';

function getSegment(to: string, departure: [string, string], arrival: [string, string]) {
  return { to, departureDate: departure[0], departureTime: departure[1], arrivalDate: arrival[0], arrivalTime: arrival[1] };
}

describe('getLayovers', () => {
  it('has none for a direct flight', () => {
    expect(getLayovers([getSegment('BKK', ['2027-01-16', '21:05'], ['2027-01-17', '05:50'])])).toEqual([]);
  });

  it('gives the airport and wait of each stop, across midnight too', () => {
    const segments = [
      getSegment('MCT', ['2027-01-16', '20:30'], ['2027-01-17', '06:00']),
      getSegment('DOH', ['2027-01-17', '08:10'], ['2027-01-17', '09:30']),
      getSegment('BKK', ['2027-01-17', '23:30'], ['2027-01-18', '09:00']),
    ];
    expect(getLayovers(segments)).toEqual([
      { airport: 'MCT', minutes: 130 },
      { airport: 'DOH', minutes: 840 },
    ]);
  });
});
