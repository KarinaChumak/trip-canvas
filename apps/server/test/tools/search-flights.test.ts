import { describe, expect, it, vi } from 'vitest';
import { validateEmitComponent } from '@trip-canvas/catalog/schema';
import type { Flight, FlightSearch, IgnavClient } from '../../src/services/ignav.js';
import { createSearchFlightsTool, SearchFlightsInput } from '../../src/tools/search-flights.js';
import { getDirectFlight, getFlightWithStop } from '../fixtures/flights.js';

// execute's second argument; the tool only reads its abortSignal.
const options = { toolCallId: 't1', messages: [] } as unknown as Parameters<NonNullable<ReturnType<typeof createSearchFlightsTool>['execute']>>[1];

function setUpSearchFlightsTool(byOrigin: Record<string, Flight[]>) {
  const ignav: IgnavClient = {
    searchFlights: vi.fn(async ({ origin }: FlightSearch) => byOrigin[origin] ?? []),
    findCheapestFlightDates: vi.fn(),
  };
  return { tool: createSearchFlightsTool({ ignav }), ignav };
}

const INPUT = SearchFlightsInput.parse({ from: ['BKK', 'DMK'], to: ['CNX'], departureDate: '2026-12-10', market: 'TH' });

describe('searchFlights tool', () => {
  it('searches each airport pair and merges the fares, cheapest first when the layovers match', async () => {
    const { tool, ignav } = setUpSearchFlightsTool({ BKK: [getDirectFlight('tg', 'BKK', 2190)], DMK: [getDirectFlight('fd', 'DMK', 1290)] });

    const result = (await tool.execute!(INPUT, options)) as { flights: Flight[]; source: string };
    expect(result.source).toBe('Ignav');
    expect(result.flights.map((f) => f.id)).toEqual(['fd', 'tg']);
    expect(ignav.searchFlights).toHaveBeenCalledTimes(2);
    expect(ignav.searchFlights).toHaveBeenCalledWith(
      { origin: 'DMK', destination: 'CNX', departureDate: '2026-12-10', adults: 1, cabinClass: 'economy', market: 'TH' },
      undefined,
    );
  });

  it('returns flights that a FlightList takes as is', async () => {
    const { tool } = setUpSearchFlightsTool({ DMK: [getDirectFlight('fd', 'DMK', 1290)] });

    const { flights } = (await tool.execute!(INPUT, options)) as { flights: Flight[] };
    const list = { title: 'Bangkok → Chiang Mai', recommendedIndex: 0, options: flights };
    expect(validateEmitComponent({ component: { type: 'FlightList', props: list } }).ok).toBe(true);
  });

  it('puts a dearer direct fare ahead of a cheaper one with a long layover', async () => {
    const cheap = getFlightWithStop('cheap-long-wait', 'BKK', 1000, '18:20', '19:40');
    const nearlyAsCheap = getDirectFlight('direct', 'BKK', 1100);
    const { tool } = setUpSearchFlightsTool({ BKK: [cheap, nearlyAsCheap, getDirectFlight('dear', 'BKK', 3000)] });

    const result = (await tool.execute!({ ...INPUT, from: ['BKK'] }, options)) as { flights: Flight[] };
    expect(result.flights.map((f) => f.id)).toEqual(['direct', 'cheap-long-wait', 'dear']);
  });

  it('keeps only the ten cheapest', async () => {
    const many = Array.from({ length: 12 }, (_, i) => getDirectFlight(`f${i}`, 'BKK', 1000 + i));
    const { tool } = setUpSearchFlightsTool({ BKK: many });

    const result = (await tool.execute!({ ...INPUT, from: ['BKK'] }, options)) as { flights: Flight[] };
    expect(result.flights).toHaveLength(10);
  });

  it('returns only as many as the limit asks for', async () => {
    const many = Array.from({ length: 5 }, (_, i) => getDirectFlight(`f${i}`, 'BKK', 1000 + i));
    const { tool } = setUpSearchFlightsTool({ BKK: many });

    const result = (await tool.execute!({ ...INPUT, from: ['BKK'], limit: 3 }, options)) as { flights: Flight[] };
    expect(result.flights.map((f) => f.id)).toEqual(['f0', 'f1', 'f2']);
  });

  it('drops fares with a longer layover than maxLayoverMinutes', async () => {
    const direct = getDirectFlight('direct', 'BKK', 2000);
    const viaHkt = getFlightWithStop('via-hkt', 'BKK', 1000, '13:20', '15:00');
    const { tool } = setUpSearchFlightsTool({ BKK: [direct, viaHkt] });

    // A 5 h wait in Phuket.
    const strict = (await tool.execute!({ ...INPUT, from: ['BKK'], maxLayoverMinutes: 180 }, options)) as { flights: Flight[] };
    expect(strict.flights.map((f) => f.id)).toEqual(['direct']);
    const relaxed = (await tool.execute!({ ...INPUT, from: ['BKK'], maxLayoverMinutes: 300 }, options)) as { flights: Flight[] };
    expect(relaxed.flights.map((f) => f.id)).toEqual(['via-hkt', 'direct']);
  });

  it('keeps the fares of the airports that answered and names the one that failed', async () => {
    const { tool, ignav } = setUpSearchFlightsTool({ BKK: [getDirectFlight('tg', 'BKK', 2190)] });
    vi.mocked(ignav.searchFlights).mockImplementation(async ({ origin }) => {
      if (origin === 'DMK') throw new Error('Ignav returned 424');
      return [getDirectFlight('tg', 'BKK', 2190)];
    });

    const result = (await tool.execute!(INPUT, options)) as { flights: Flight[]; failed: string[] };
    expect(result.flights.map((f) => f.id)).toEqual(['tg']);
    expect(result.failed).toEqual(['DMK → CNX']);
  });

  it('returns an error the model can act on when nothing flies', async () => {
    const { tool } = setUpSearchFlightsTool({});
    expect(await tool.execute!(INPUT, options)).toEqual({
      error: 'No flights found from BKK/DMK to CNX on 2026-12-10. Try another date or nearby airports.',
    });
  });

  it('rejects anything but 3-letter airport codes', () => {
    expect(SearchFlightsInput.safeParse({ ...INPUT, from: ['Bangkok'] }).success).toBe(false);
  });
});
