import { z } from 'zod';
import { createApiClient } from '../lib/api-client.js';
import type { Cache } from '../lib/cache.js';

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

export type FlightSearch = {
  /** 3-letter IATA airport or metro code, e.g. "BKK", "DMK" or "LON". */
  origin: string;
  destination: string;
  /** YYYY-MM-DD. */
  departureDate: string;
  /** YYYY-MM-DD; set for a round trip. */
  returnDate?: string;
  adults: number;
  cabinClass: CabinClass;
  /** 0–2; left out for any number of stops. */
  maxStops?: number;
  /** 2-letter country code; sets the currency of the prices (TH → THB). */
  market: string;
};

/** One flight of a leg, in the airports' local time. */
export type FlightSegment = {
  /** Marketing carrier code and number, e.g. "FD 3433". */
  flight: string;
  operatingCarrier: string | null;
  from: string;
  to: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  durationMinutes: number;
  aircraft: string | null;
};

/** One direction of a trip: its flights in order, one means direct. */
export type FlightLeg = {
  carrier: string | null;
  from: string;
  to: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  /** Including layovers. */
  durationMinutes: number;
  stops: number;
  segments: FlightSegment[];
};

export type Flight = {
  /** Ignav's id for this itinerary, to look up its booking links. */
  id: string;
  /** The fare at search time, for all passengers. */
  price: { amount: number; currency: string; verified: boolean };
  cabinClass: string;
  outbound: FlightLeg;
  /** Set for a round trip. */
  inbound: FlightLeg | null;
};

export type IgnavClient = {
  /** Fares for one route and date (or date pair), cheapest first. */
  searchFlights(search: FlightSearch, signal?: AbortSignal): Promise<Flight[]>;
};

type IgnavClientDeps = {
  apiKey: string;
  cache: Cache;
};

const BASE_URL = 'https://ignav.com/api';

const Price = z.object({ amount: z.number(), currency: z.string(), status: z.string() });

const Segment = z.object({
  marketing_carrier_code: z.string(),
  flight_number: z.string(),
  operating_carrier_name: z.string().nullish(),
  departure_airport: z.string(),
  // "2026-12-10T07:15:00": local time, no offset.
  departure_time_local: z.string(),
  arrival_airport: z.string(),
  arrival_time_local: z.string(),
  duration_minutes: z.number(),
  aircraft: z.string().nullish(),
});

const Leg = z.object({
  carrier: z.string().nullish(),
  duration_minutes: z.number().nullish(),
  segments: z.array(Segment).min(1),
});

const FaresResponse = z.object({
  itineraries: z.array(
    z.object({
      ignav_id: z.string(),
      price: Price,
      cabin_class: z.string(),
      outbound: Leg,
      inbound: Leg.nullish(),
    }),
  ),
});

/** "2026-12-10T07:15:00" → { date: "2026-12-10", time: "07:15" }. */
function splitLocal(local: string): { date: string; time: string } {
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

function toLeg({ carrier, duration_minutes, segments }: z.infer<typeof Leg>): FlightLeg {
  const first = segments[0]!;
  const last = segments.at(-1)!;
  const start = splitLocal(first.departure_time_local);
  const end = splitLocal(last.arrival_time_local);
  return {
    carrier: carrier ?? null,
    from: first.departure_airport,
    to: last.arrival_airport,
    departureDate: start.date,
    departureTime: start.time,
    arrivalDate: end.date,
    arrivalTime: end.time,
    durationMinutes: duration_minutes ?? segments.reduce((sum, s) => sum + s.duration_minutes, 0),
    stops: segments.length - 1,
    segments: segments.map((s) => {
      const departure = splitLocal(s.departure_time_local);
      const arrival = splitLocal(s.arrival_time_local);
      return {
        flight: `${s.marketing_carrier_code} ${s.flight_number}`,
        operatingCarrier: s.operating_carrier_name ?? null,
        from: s.departure_airport,
        to: s.arrival_airport,
        departureDate: departure.date,
        departureTime: departure.time,
        arrivalDate: arrival.date,
        arrivalTime: arrival.time,
        durationMinutes: s.duration_minutes,
        aircraft: s.aircraft ?? null,
      };
    }),
  };
}

/** Ignav fares (D-046). Paid per request, so answers are cached for 15 minutes. */
export function createIgnavClient({ apiKey, cache }: IgnavClientDeps): IgnavClient {
  const api = createApiClient({
    service: 'Ignav',
    // A fare search asks the airlines live, so it can take longer than a usual API.
    timeoutMs: 30_000,
    // In a header, so the key never reaches a URL, a log line or a cache key.
    headers: { 'X-Api-Key': apiKey },
    cache: { store: cache, ttlSeconds: 15 * 60 },
  });

  return {
    async searchFlights({ origin, destination, departureDate, returnDate, adults, cabinClass, maxStops, market }, signal) {
      const body = {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departure_date: departureDate,
        ...(returnDate && { return_date: returnDate }),
        adults,
        cabin_class: cabinClass,
        ...(maxStops !== undefined && { max_stops: maxStops }),
        market: market.toUpperCase(),
      };
      const path = returnDate ? 'round-trip' : 'one-way';
      const { itineraries } = await api.postJson(new URL(`${BASE_URL}/fares/${path}`), body, FaresResponse, signal);

      return itineraries
        .map(({ ignav_id, price, cabin_class, outbound, inbound }) => ({
          id: ignav_id,
          price: { amount: price.amount, currency: price.currency, verified: price.status === 'verified' },
          cabinClass: cabin_class,
          outbound: toLeg(outbound),
          inbound: inbound ? toLeg(inbound) : null,
        }))
        .sort((a, b) => a.price.amount - b.price.amount);
    },
  };
}
