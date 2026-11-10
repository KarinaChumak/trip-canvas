/** The fields of a flight segment that say where and when it lands and leaves. */
type TimedSegment = { to: string; departureDate: string; departureTime: string; arrivalDate: string; arrivalTime: string };

/** A wait between two flights of one leg. */
export type Layover = { airport: string; minutes: number };

/** Minutes since the Unix epoch for a local date and time; only differences in one time zone mean anything. */
function toLocalMinutes(isoDate: string, clockTime: string): number {
  return Date.parse(`${isoDate}T${clockTime}:00Z`) / 60_000;
}

/**
 * The wait at each stop of a leg, in order: one entry per stop, none for a direct flight.
 * Landing and the next take-off are both local to the stop airport, so they compare directly.
 */
export function getLayovers(segments: TimedSegment[]): Layover[] {
  const layovers: Layover[] = [];
  let previous: TimedSegment | undefined;
  for (const segment of segments) {
    if (previous) {
      const minutes = toLocalMinutes(segment.departureDate, segment.departureTime) - toLocalMinutes(previous.arrivalDate, previous.arrivalTime);
      layovers.push({ airport: previous.to, minutes });
    }
    previous = segment;
  }
  return layovers;
}
