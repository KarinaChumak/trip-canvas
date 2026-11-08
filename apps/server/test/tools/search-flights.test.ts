import { describe, expect, it, vi } from 'vitest';
import type { Flight, FlightSearch, IgnavClient } from '../../src/services/ignav.js';
import { createSearchFlightsTool, SearchFlightsInput } from '../../src/tools/search-flights.js';

// execute's second argument; the tool only reads its abortSignal.
const options = { toolCallId: 't1', messages: [] } as unknown as Parameters<NonNullable<ReturnType<typeof createSearchFlightsTool>['execute']>>[1];

function flight(id: string, from: string, amount: number): Flight {
  const leg = { carrier: 'AirAsia', from, to: 'CNX', departureDate: '2026-12-10', departureTime: '07:00', arrivalDate: '2026-12-10', arrivalTime: '08:20', durationMinutes: 80, stops: 0, segments: [] };
  return { id, price: { amount, currency: 'THB', verified: true }, cabinClass: 'economy', outbound: leg, inbound: null };
}

function searchFlightsTool(byOrigin: Record<string, Flight[]>) {
  const ignav: IgnavClient = {
    searchFlights: vi.fn(async ({ origin }: FlightSearch) => byOrigin[origin] ?? []),
  };
  return { tool: createSearchFlightsTool({ ignav }), ignav };
}

const INPUT = SearchFlightsInput.parse({ from: ['BKK', 'DMK'], to: ['CNX'], departureDate: '2026-12-10', market: 'TH' });

describe('searchFlights tool', () => {
  it('searches each airport pair and merges the fares, cheapest first', async () => {
    const { tool, ignav } = searchFlightsTool({ BKK: [flight('tg', 'BKK', 2190)], DMK: [flight('fd', 'DMK', 1290)] });

    const result = (await tool.execute!(INPUT, options)) as { flights: Flight[]; source: string };
    expect(result.source).toBe('Ignav');
    expect(result.flights.map((f) => f.id)).toEqual(['fd', 'tg']);
    expect(ignav.searchFlights).toHaveBeenCalledTimes(2);
    expect(ignav.searchFlights).toHaveBeenCalledWith(
      { origin: 'DMK', destination: 'CNX', departureDate: '2026-12-10', adults: 1, cabinClass: 'economy', market: 'TH' },
      undefined,
    );
  });

  it('keeps only the ten cheapest', async () => {
    const many = Array.from({ length: 12 }, (_, i) => flight(`f${i}`, 'BKK', 1000 + i));
    const { tool } = searchFlightsTool({ BKK: many });

    const result = (await tool.execute!({ ...INPUT, from: ['BKK'] }, options)) as { flights: Flight[] };
    expect(result.flights).toHaveLength(10);
  });

  it('returns an error the model can act on when nothing flies', async () => {
    const { tool } = searchFlightsTool({});
    expect(await tool.execute!(INPUT, options)).toEqual({
      error: 'No flights found from BKK/DMK to CNX on 2026-12-10. Try another date or nearby airports.',
    });
  });

  it('rejects anything but 3-letter airport codes', () => {
    expect(SearchFlightsInput.safeParse({ ...INPUT, from: ['Bangkok'] }).success).toBe(false);
  });
});
