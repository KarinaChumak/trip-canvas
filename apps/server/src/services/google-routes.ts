import type { ConnectionOptionData } from '@trip-canvas/catalog';
import { z } from 'zod';
import { createApiClient } from '../lib/api-client.js';

/** One way to make the trip, as a ConnectionList shows it: segments in order, one means direct. */
export type Connection = ConnectionOptionData;

type TransitMode = Connection['segments'][number]['mode'];

export type ConnectionSearch = {
  /** Place names; Google geocodes them itself. */
  from: string;
  to: string;
  /** RFC 3339 with an offset, e.g. "2026-12-10T05:00:00+07:00". */
  when: string;
  /** true: arrive by `when`; false: leave after it. */
  arriveBy: boolean;
};

export type GoogleRoutesClient = {
  /** Public transport connections, earliest first. */
  findConnections(search: ConnectionSearch, signal?: AbortSignal): Promise<Connection[]>;
};

type GoogleRoutesClientDeps = {
  apiKey: string;
};

const COMPUTE_ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

// Only what the card shows: smaller answers, and nothing we may not use (D-053, D-054).
const FIELD_MASK = 'routes.legs.steps.travelMode,routes.legs.steps.transitDetails';

const TransitStep = z.object({
  stopDetails: z.object({
    departureStop: z.object({ name: z.string() }),
    arrivalStop: z.object({ name: z.string() }),
    departureTime: z.string(),
    arrivalTime: z.string(),
  }),
  localizedValues: z.object({
    departureTime: z.object({ timeZone: z.string() }),
    arrivalTime: z.object({ timeZone: z.string() }),
  }),
  headsign: z.string().optional(),
  transitLine: z.object({
    name: z.string().optional(),
    nameShort: z.string().optional(),
    vehicle: z.object({ type: z.string() }),
  }),
});

const RoutesResponse = z.object({
  // Google answers {} when it finds no route.
  routes: z
    .array(
      z.object({
        legs: z.array(z.object({ steps: z.array(z.object({ transitDetails: TransitStep.optional() })).optional() })),
      }),
    )
    .default([]),
});

/** Google's vehicle types, grouped into the card's modes. */
const MODES: Record<string, TransitMode> = {
  RAIL: 'train',
  HEAVY_RAIL: 'train',
  COMMUTER_TRAIN: 'train',
  HIGH_SPEED_TRAIN: 'train',
  LONG_DISTANCE_TRAIN: 'train',
  METRO_RAIL: 'metro',
  SUBWAY: 'metro',
  MONORAIL: 'metro',
  TRAM: 'tram',
  BUS: 'bus',
  INTERCITY_BUS: 'bus',
  TROLLEYBUS: 'bus',
  FERRY: 'ferry',
};

export function modeFor(vehicleType: string): TransitMode {
  return MODES[vehicleType] ?? 'other';
}

/** "2026-12-10T00:30:00Z" in "Asia/Bangkok" → { date: "2026-12-10", time: "07:30" }. */
export function localDateTime(instant: string, timeZone: string): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(instant))
      .map(({ type, value }) => [type, value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

/** One route as card props, or null if it has no transit step (a walk only). */
export function toConnection(steps: z.infer<typeof TransitStep>[]): Connection | null {
  const first = steps[0];
  const last = steps.at(-1);
  if (!first || !last) return null;

  const start = localDateTime(first.stopDetails.departureTime, first.localizedValues.departureTime.timeZone);
  const end = localDateTime(last.stopDetails.arrivalTime, last.localizedValues.arrivalTime.timeZone);
  // From the first departure to the last arrival: the walks to and from the station don't count.
  const durationMs = Date.parse(last.stopDetails.arrivalTime) - Date.parse(first.stopDetails.departureTime);

  return {
    from: first.stopDetails.departureStop.name,
    to: last.stopDetails.arrivalStop.name,
    departureDate: start.date,
    departureTime: start.time,
    arrivalDate: end.date,
    arrivalTime: end.time,
    durationMinutes: Math.max(1, Math.round(durationMs / 60_000)),
    segments: steps.map(({ stopDetails, localizedValues, headsign, transitLine }) => ({
      mode: modeFor(transitLine.vehicle.type),
      line: transitLine.nameShort ?? transitLine.name ?? null,
      from: stopDetails.departureStop.name,
      to: stopDetails.arrivalStop.name,
      departureTime: localDateTime(stopDetails.departureTime, localizedValues.departureTime.timeZone).time,
      arrivalTime: localDateTime(stopDetails.arrivalTime, localizedValues.arrivalTime.timeZone).time,
      headsign: headsign ?? null,
    })),
  };
}

/** Never cached: Google's terms forbid storing its answers (D-043, D-053). */
export function createGoogleRoutesClient({ apiKey }: GoogleRoutesClientDeps): GoogleRoutesClient {
  const api = createApiClient({
    service: 'Google Routes',
    // In headers, so the key never shows up in a URL or a log line.
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELD_MASK },
  });

  return {
    async findConnections({ from, to, when, arriveBy }, signal) {
      const { routes } = await api.postJson(
        new URL(COMPUTE_ROUTES_URL),
        {
          origin: { address: from },
          destination: { address: to },
          travelMode: 'TRANSIT',
          [arriveBy ? 'arrivalTime' : 'departureTime']: when,
          computeAlternativeRoutes: true,
          // A preference: Google still answers with buses where no train runs.
          transitPreferences: { allowedTravelModes: ['TRAIN', 'RAIL'] },
          languageCode: 'en',
        },
        RoutesResponse,
        signal,
      );

      return routes
        .map((route) => toConnection(route.legs.flatMap((leg) => (leg.steps ?? []).flatMap((s) => s.transitDetails ?? []))))
        .filter((connection): connection is Connection => connection !== null)
        .sort((a, b) => `${a.departureDate}${a.departureTime}`.localeCompare(`${b.departureDate}${b.departureTime}`));
    },
  };
}
