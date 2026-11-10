import { afterEach, describe, expect, it, vi } from 'vitest';
import { memoryCache } from '../../src/lib/cache.js';
import { createIgnavClient, type FlightSearch } from '../../src/services/ignav.js';

const BKK_CNX: FlightSearch = { origin: 'dmk', destination: 'cnx', departureDate: '2026-12-10', adults: 1, cabinClass: 'economy', market: 'th' };

function segment(code: string, number: string, from: string, to: string, departs: string, arrives: string, minutes: number) {
  return { marketing_carrier_code: code, flight_number: number, operating_carrier_name: null, departure_airport: from, departure_time_local: departs, arrival_airport: to, arrival_time_local: arrives, duration_minutes: minutes, aircraft: 'Airbus A320' };
}

// Shaped like Ignav's documented answer, trimmed to the fields we read (D-046).
const FARES = {
  itineraries: [
    {
      ignav_id: 'tg102',
      price: { amount: 2190, currency: 'THB', status: 'verified' },
      cabin_class: 'economy',
      outbound: { carrier: 'Thai Airways', duration_minutes: 80, segments: [segment('TG', '102', 'BKK', 'CNX', '2026-12-10T10:15:00', '2026-12-10T11:35:00', 80)] },
    },
    {
      ignav_id: 'fd3433',
      price: { amount: 1290, currency: 'THB', status: 'unverified' },
      cabin_class: 'economy',
      outbound: {
        carrier: null,
        duration_minutes: null,
        segments: [
          segment('FD', '3433', 'DMK', 'HKT', '2026-12-10T22:50:00', '2026-12-11T00:20:00', 90),
          segment('FD', '3150', 'HKT', 'CNX', '2026-12-11T06:00:00', '2026-12-11T08:00:00', 120),
        ],
      },
    },
  ],
};

const ignav = () => createIgnavClient({ apiKey: 'test-key', cache: memoryCache() });

function stubFetch(body: unknown, status = 200) {
  const fetch = vi.fn(async (_url: URL, _init: RequestInit) => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ignav.searchFlights', () => {
  it('lists fares cheapest first, in local time', async () => {
    stubFetch(FARES);
    const flights = await ignav().searchFlights(BKK_CNX);

    expect(flights.map((f) => [f.id, f.price.amount, f.price.verified])).toEqual([
      ['fd3433', 1290, false],
      ['tg102', 2190, true],
    ]);
    expect(flights[1]).toMatchObject({
      cabinClass: 'economy',
      inbound: null,
      outbound: {
        carrier: 'Thai Airways',
        from: 'BKK',
        to: 'CNX',
        departureDate: '2026-12-10',
        departureTime: '10:15',
        arrivalTime: '11:35',
        durationMinutes: 80,
        stops: 0,
        segments: [{ flight: 'TG 102', aircraft: 'Airbus A320' }],
      },
    });
  });

  it('counts stops and falls back to the flight times when the leg has no duration', async () => {
    stubFetch(FARES);
    const [viaPhuket] = await ignav().searchFlights(BKK_CNX);

    expect(viaPhuket?.outbound).toMatchObject({ from: 'DMK', to: 'CNX', stops: 1, durationMinutes: 210, arrivalDate: '2026-12-11', carrier: null });
    expect(viaPhuket?.outbound.segments.map((s) => s.flight)).toEqual(['FD 3433', 'FD 3150']);
  });

  it('POSTs a one-way search with the key in a header', async () => {
    const fetch = stubFetch(FARES);
    await ignav().searchFlights({ ...BKK_CNX, maxStops: 0 });

    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe('https://ignav.com/api/fares/one-way');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'X-Api-Key': 'test-key' });
    expect(JSON.parse(String(init.body))).toEqual({
      origin: 'DMK',
      destination: 'CNX',
      departure_date: '2026-12-10',
      adults: 1,
      cabin_class: 'economy',
      max_stops: 0,
      market: 'TH',
    });
  });

  it('uses the round-trip endpoint and maps the way back', async () => {
    const outbound = FARES.itineraries[0]!.outbound;
    const fetch = stubFetch({ ...FARES, itineraries: [{ ...FARES.itineraries[0], inbound: outbound }] });
    const [flight] = await ignav().searchFlights({ ...BKK_CNX, returnDate: '2026-12-14' });

    expect(String(fetch.mock.calls[0]![0])).toBe('https://ignav.com/api/fares/round-trip');
    expect(JSON.parse(String(fetch.mock.calls[0]![1].body))).toMatchObject({ return_date: '2026-12-14' });
    expect(flight?.inbound?.segments[0]?.flight).toBe('TG 102');
  });

  it('answers the same search from the cache: a paid request is made once', async () => {
    const fetch = stubFetch(FARES);
    const client = ignav();
    await client.searchFlights(BKK_CNX);
    await client.searchFlights(BKK_CNX);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('throws with the error Ignav gives', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubFetch({ error: { type: 'invalid_request', code: 'departure_date_in_past', message: 'departure_date is in the past.' } }, 400);
    await expect(ignav().searchFlights(BKK_CNX)).rejects.toThrow(/Ignav returned 400.*departure_date_in_past/);
  });
});

describe('ignav.findCheapestFlightDates', () => {
  it('asks for a date range and trip length, and keeps days without a fare as null', async () => {
    const fetch = stubFetch({
      dates: [
        { departure_date: '2027-01-16', return_date: '2027-01-31', price: { amount: 595, currency: 'EUR', status: 'unverified' } },
        { departure_date: '2027-01-17', return_date: '2027-02-01', price: null },
      ],
    });
    const { departureDate: _day, ...search } = BKK_CNX;
    const dates = await ignav().findCheapestFlightDates({ ...search, departureStart: '2027-01-16', departureEnd: '2027-01-17', stayDays: 15 });

    expect(dates).toEqual([
      { departureDate: '2027-01-16', returnDate: '2027-01-31', price: { amount: 595, currency: 'EUR' } },
      { departureDate: '2027-01-17', returnDate: '2027-02-01', price: null },
    ]);
    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe('https://ignav.com/api/fares/cheapest-dates');
    expect(JSON.parse(String(init.body))).toMatchObject({ origin: 'DMK', departure_date_range: { start: '2027-01-16', end: '2027-01-17' }, stay_days: 15 });
  });
});
