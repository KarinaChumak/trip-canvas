import { describe, expect, it, vi } from 'vitest';
import type { CheapestFlightDatesSearch, IgnavClient } from '../../src/services/ignav.js';
import { createFindCheapestFlightDatesTool, FindCheapestFlightDatesInput } from '../../src/tools/find-cheapest-flight-dates.js';

// execute's second argument; the tool only reads its abortSignal.
const options = { toolCallId: 't1', messages: [] } as unknown as Parameters<NonNullable<ReturnType<typeof createFindCheapestFlightDatesTool>['execute']>>[1];

const INPUT = FindCheapestFlightDatesInput.parse({
  from: ['FRA'],
  to: ['BKK', 'DMK'],
  departureStart: '2027-01-15',
  departureEnd: '2027-01-17',
  stayDays: [15, 16],
  market: 'DE',
});

/** Ignav's answer: Sat 16 Jan is priced (BKK cheaper), Sun 17 Jan has no fare. */
async function getStubFares({ destination, stayDays }: CheapestFlightDatesSearch) {
  return [
    { departureDate: '2027-01-16', returnDate: stayDays === 15 ? '2027-01-31' : '2027-02-01', price: { amount: destination === 'BKK' ? 600 + (stayDays ?? 0) : 900, currency: 'EUR' } },
    { departureDate: '2027-01-17', returnDate: null, price: null },
  ];
}

function setUpFindCheapestFlightDatesTool(findCheapestFlightDates = getStubFares) {
  const ignav: IgnavClient = { searchFlights: vi.fn(), findCheapestFlightDates: vi.fn(findCheapestFlightDates) };
  return { tool: createFindCheapestFlightDatesTool({ ignav }), ignav };
}

type FareResult = { to: string; departureWeekday: string; returnDate: string | null; price: { amount: number } };

describe('findCheapestFlightDates tool', () => {
  it('asks once per airport pair and trip length, and lists priced days cheapest first with weekdays', async () => {
    const { tool, ignav } = setUpFindCheapestFlightDatesTool();

    const { fares } = (await tool.execute!(INPUT, options)) as { fares: FareResult[] };
    expect(ignav.findCheapestFlightDates).toHaveBeenCalledTimes(4);
    expect(fares.map((fare) => [fare.to, fare.price.amount])).toEqual([['BKK', 615], ['BKK', 616], ['DMK', 900], ['DMK', 900]]);
    expect(fares[0]).toMatchObject({ departureDate: '2027-01-16', departureWeekday: 'Sat', returnDate: '2027-01-31', returnWeekday: 'Sun' });
  });

  it('keeps the fares that came back when one request fails', async () => {
    const { tool } = setUpFindCheapestFlightDatesTool(async (search) => {
      if (search.destination === 'DMK') throw new Error('Ignav returned 424');
      return getStubFares(search);
    });

    const result = (await tool.execute!(INPUT, options)) as { fares: FareResult[]; failed: string[] };
    expect(result.fares.map((fare) => fare.to)).toEqual(['BKK', 'BKK']);
    expect(result.failed).toEqual(['FRA → DMK, 15 days', 'FRA → DMK, 16 days']);
  });

  it('rejects a range longer than Ignav allows', () => {
    expect(FindCheapestFlightDatesInput.safeParse({ ...INPUT, departureEnd: '2027-02-28' }).success).toBe(false);
  });
});
