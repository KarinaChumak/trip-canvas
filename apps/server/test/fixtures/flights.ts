import type { Flight, FlightLeg, FlightSegment } from '../../src/services/ignav.js';

const DAY = '2026-12-10';

/** One flight on 10 Dec, landing the same day. */
function getSegment(flight: string, from: string, to: string, departureTime: string, arrivalTime: string): FlightSegment {
  return { flight, operatingCarrier: null, from, to, departureDate: DAY, departureTime, arrivalDate: DAY, arrivalTime, durationMinutes: 80, aircraft: null };
}

function getLeg(segments: [FlightSegment, ...FlightSegment[]]): FlightLeg {
  const [first] = segments;
  const last = segments.at(-1) ?? first;
  return {
    carrier: 'AirAsia',
    from: first.from,
    to: last.to,
    departureDate: DAY,
    departureTime: first.departureTime,
    arrivalDate: DAY,
    arrivalTime: last.arrivalTime,
    durationMinutes: 80 * segments.length,
    stops: segments.length - 1,
    segments,
  };
}

/** A one-way fare to Chiang Mai: direct, 07:00 → 08:20. */
export function getDirectFlight(id: string, from: string, amount: number): Flight {
  return { id, price: { amount, currency: 'THB', verified: true }, cabinClass: 'economy', outbound: getLeg([getSegment('FD 3433', from, 'CNX', '07:00', '08:20')]), inbound: null };
}

/** A one-way fare to Chiang Mai with a stop in Phuket: lands there 08:20, flies on at `departs`. */
export function getFlightWithStop(id: string, from: string, amount: number, departs: string, arrives: string): Flight {
  const outbound = getLeg([getSegment('FD 3433', from, 'HKT', '07:00', '08:20'), getSegment('FD 3150', 'HKT', 'CNX', departs, arrives)]);
  return { ...getDirectFlight(id, from, amount), outbound };
}
