import type { DayItineraryData } from '@trip-canvas/catalog';

type Stop = DayItineraryData['stops'][number];

/** A stop Google Maps can route to: it has coordinates. */
type LocatedStop = Stop & { latitude: number; longitude: number };

export type DirectionsLink = {
  /** The first and last stop the link walks between. */
  from: LocatedStop;
  to: LocatedStop;
  url: string;
};

// A Maps URL takes an origin, a destination and at most 9 waypoints in between
// (https://developers.google.com/maps/documentation/urls/get-started#directions-action).
const MAX_STOPS_PER_LINK = 11;

function isLocatedStop(stop: Stop): stop is LocatedStop {
  return stop.latitude !== null && stop.longitude !== null;
}

function formatCoordinates(stop: LocatedStop): string {
  return `${stop.latitude},${stop.longitude}`;
}

/** One Google Maps walking-directions URL through the stops, in order. */
function buildWalkingDirectionsUrl(stops: LocatedStop[]): string {
  const origin = stops[0]!;
  const destination = stops[stops.length - 1]!;
  const waypoints = stops.slice(1, -1);

  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('origin', formatCoordinates(origin));
  url.searchParams.set('destination', formatCoordinates(destination));
  url.searchParams.set('travelmode', 'walking');
  // A place id makes Google Maps open the place itself, not just a pin at its coordinates.
  if (origin.placeId) url.searchParams.set('origin_place_id', origin.placeId);
  if (destination.placeId) url.searchParams.set('destination_place_id', destination.placeId);
  if (waypoints.length > 0) {
    url.searchParams.set('waypoints', waypoints.map(formatCoordinates).join('|'));
    // Google only uses the waypoint ids when every waypoint has one.
    if (waypoints.every((stop) => stop.placeId)) {
      url.searchParams.set('waypoint_place_ids', waypoints.map((stop) => stop.placeId).join('|'));
    }
  }
  return url.toString();
}

/**
 * Walking directions through a day's stops that have coordinates, as Google Maps links.
 * A day with more stops than one link holds splits in two halves that share the middle
 * stop, so the second walk starts where the first ends. Fewer than two such stops: none.
 */
export function buildWalkingDirectionsLinks(stops: Stop[]): DirectionsLink[] {
  const located = stops.filter(isLocatedStop);
  if (located.length < 2) return [];

  // The catalog allows 12 stops, so two links are always enough.
  const parts =
    located.length <= MAX_STOPS_PER_LINK
      ? [located]
      : [located.slice(0, Math.floor(located.length / 2) + 1), located.slice(Math.floor(located.length / 2))];

  return parts.map((part) => ({ from: part[0]!, to: part[part.length - 1]!, url: buildWalkingDirectionsUrl(part) }));
}
