import type { Meta, StoryObj } from '@storybook/react-vite';
import type { FlightLegData, FlightOptionData } from '@trip-canvas/catalog';
import { FlightList } from '@/components/catalog/FlightList';

const meta = {
  title: 'Catalog/FlightList',
  component: FlightList,
} satisfies Meta<typeof FlightList>;

export default meta;
type Story = StoryObj<typeof meta>;

type SegmentData = FlightLegData['segments'][number];

/** One flight; `departs` and `arrives` are local, "2026-12-10 07:05". */
type SegmentSpec = { flight: string; from: string; to: string; departs: string; arrives: string; minutes: number };

/** "2026-12-10 07:05" → ["2026-12-10", "07:05"]. */
function splitDateTime(dateTime: string): [string, string] {
  const [date = '', time = ''] = dateTime.split(' ');
  return [date, time];
}

function getSegment({ flight, from, to, departs, arrives, minutes }: SegmentSpec): SegmentData {
  const [departureDate, departureTime] = splitDateTime(departs);
  const [arrivalDate, arrivalTime] = splitDateTime(arrives);
  return { flight, operatingCarrier: null, from, to, departureDate, departureTime, arrivalDate, arrivalTime, durationMinutes: minutes, aircraft: null };
}

/** A leg from its flights in order; its times and stops come from the first and the last. */
function getLeg(carrier: string, durationMinutes: number, segments: [SegmentData, ...SegmentData[]]): FlightLegData {
  const [first] = segments;
  const last = segments.at(-1) ?? first;
  return {
    carrier,
    from: first.from,
    to: last.to,
    departureDate: first.departureDate,
    departureTime: first.departureTime,
    arrivalDate: last.arrivalDate,
    arrivalTime: last.arrivalTime,
    durationMinutes,
    stops: segments.length - 1,
    segments,
  };
}

function getDirectLeg(carrier: string, segment: SegmentSpec): FlightLegData {
  return getLeg(carrier, segment.minutes, [getSegment(segment)]);
}

type FareSpec = { id: string; amount: number; currency?: string; verified?: boolean; outbound: FlightLegData; inbound?: FlightLegData | null };

function getFare({ id, amount, currency = 'THB', verified = true, outbound, inbound = null }: FareSpec): FlightOptionData {
  return { id, price: { amount, currency, verified }, cabinClass: 'economy', outbound, inbound };
}

const DMK_CNX = getDirectLeg('AirAsia', { flight: 'FD 3433', from: 'DMK', to: 'CNX', departs: '2026-12-10 07:05', arrives: '2026-12-10 08:20', minutes: 75 });
const BKK_CNX = getDirectLeg('Thai Vietjet', { flight: 'VZ 100', from: 'BKK', to: 'CNX', departs: '2026-12-10 06:00', arrives: '2026-12-10 07:20', minutes: 80 });

const BANGKOK_CHIANG_MAI = [
  getFare({ id: 'fd-3433', amount: 1290, outbound: DMK_CNX }),
  getFare({ id: 'vz-100', amount: 1350, outbound: BKK_CNX }),
  getFare({ id: 'fd-3435', amount: 1490, outbound: getDirectLeg('AirAsia', { flight: 'FD 3435', from: 'DMK', to: 'CNX', departs: '2026-12-10 09:10', arrives: '2026-12-10 10:25', minutes: 75 }) }),
  getFare({ id: 'tg-102', amount: 2650, outbound: getDirectLeg('Thai Airways', { flight: 'TG 102', from: 'BKK', to: 'CNX', departs: '2026-12-10 10:15', arrives: '2026-12-10 11:30', minutes: 75 }) }),
];

/** The recommended Thai Airways fare moves to the top; "Show more" reveals the rest. */
export const Direct: Story = {
  args: { list: { title: 'Bangkok → Chiang Mai', recommendedIndex: 3, options: BANGKOK_CHIANG_MAI } },
};

const NUE_OPO = getLeg('TAP Air Portugal', 325, [
  getSegment({ flight: 'TP 579', from: 'NUE', to: 'LIS', departs: '2026-12-10 06:10', arrives: '2026-12-10 08:45', minutes: 215 }),
  getSegment({ flight: 'TP 1944', from: 'LIS', to: 'OPO', departs: '2026-12-10 10:40', arrives: '2026-12-10 11:35', minutes: 55 }),
]);

/** One stop in Lisbon, with the wait there. */
export const OneStop: Story = {
  args: { list: { title: 'Nuremberg → Porto', recommendedIndex: null, options: [getFare({ id: 'tp-579-1944', amount: 189.5, currency: 'EUR', outbound: NUE_OPO })] } },
};

const NUE_BKK = getLeg('Air Arabia', 1375, [
  getSegment({ flight: 'G9 384', from: 'NUE', to: 'SHJ', departs: '2026-12-10 15:20', arrives: '2026-12-10 23:35', minutes: 375 }),
  getSegment({ flight: 'G9 841', from: 'SHJ', to: 'BKK', departs: '2026-12-11 13:20', arrives: '2026-12-11 22:35', minutes: 375 }),
]);

/** A long connection abroad: the stop shows its city, so it's clear the wait is in the Emirates. */
export const LongLayoverAbroad: Story = {
  args: { list: { title: 'Nuremberg → Bangkok', recommendedIndex: null, options: [getFare({ id: 'g9-384-841', amount: 412, currency: 'EUR', outbound: NUE_BKK })] } },
};

const DMK_NRT =getDirectLeg('Thai AirAsia X', { flight: 'XJ 606', from: 'DMK', to: 'NRT', departs: '2026-12-10 23:55', arrives: '2026-12-11 08:05', minutes: 370 });

/** A red-eye that lands the next morning, marked "+1". */
export const OvernightArrival: Story = {
  args: { list: { title: 'Bangkok → Tokyo', recommendedIndex: 0, options: [getFare({ id: 'xj-606', amount: 8900, outbound: DMK_NRT })] } },
};

const CNX_DMK = getDirectLeg('AirAsia', { flight: 'FD 3440', from: 'CNX', to: 'DMK', departs: '2026-12-18 18:30', arrives: '2026-12-18 19:45', minutes: 75 });

/** A round-trip fare shows both legs, each tagged with its direction and day. */
export const RoundTrip: Story = {
  args: { list: { title: 'Bangkok ⇄ Chiang Mai', recommendedIndex: null, options: [getFare({ id: 'fd-3433-3440', amount: 2480, outbound: DMK_CNX, inbound: CNX_DMK })] } },
};

const OPO_NUE = getLeg('TAP Air Portugal', 330, [
  getSegment({ flight: 'TP 1946', from: 'OPO', to: 'LIS', departs: '2026-12-20 12:00', arrives: '2026-12-20 12:55', minutes: 55 }),
  getSegment({ flight: 'TP 578', from: 'LIS', to: 'NUE', departs: '2026-12-20 14:30', arrives: '2026-12-20 18:30', minutes: 180 }),
]);

/** A stop each way: the line gets a dot per stop and the stop airport with its wait. */
export const RoundTripWithStops: Story = {
  args: {
    list: {
      title: 'Nuremberg ⇄ Porto',
      recommendedIndex: null,
      options: [getFare({ id: 'tp-579-578', amount: 389, currency: 'EUR', outbound: NUE_OPO, inbound: OPO_NUE })],
    },
  },
};

/** Ignav could not confirm the price with the seller. */
export const UnverifiedPrice: Story = {
  args: { list: { title: 'Bangkok → Chiang Mai', recommendedIndex: null, options: [getFare({ id: 'vz-100', amount: 1350, verified: false, outbound: BKK_CNX })] } },
};

export const Empty: Story = {
  args: { list: { title: 'Bangkok → Chiang Mai', recommendedIndex: null, options: [] } },
};
