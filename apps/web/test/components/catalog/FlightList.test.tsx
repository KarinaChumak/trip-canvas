import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { prerender } from 'react-dom/static';
import type { FlightLegData, FlightListData, FlightOptionData } from '@trip-canvas/catalog';
import { FlightList } from '@/components/catalog/FlightList';

type SegmentData = FlightLegData['segments'][number];
const TIMES = { from: 'DMK', to: 'CNX', departureDate: '2026-12-10', departureTime: '07:05', arrivalDate: '2026-12-10', arrivalTime: '08:20', durationMinutes: 75 };

function getSegment(flight: string, times: Partial<typeof TIMES> = {}): SegmentData {
  return { ...TIMES, ...times, flight, operatingCarrier: null, aircraft: null };
}

/** A direct AirAsia leg; the times apply to its one flight too. */
function getDirectLeg(flight: string, times: Partial<typeof TIMES> = {}): FlightLegData {
  return { ...TIMES, ...times, carrier: 'AirAsia', stops: 0, segments: [getSegment(flight, times)] };
}

function getFare(id: string, outbound: FlightLegData, overrides: Partial<FlightOptionData> = {}): FlightOptionData {
  return { id, price: { amount: 1290, currency: 'THB', verified: true }, cabinClass: 'economy', outbound, inbound: null, ...overrides };
}

const render = (list: FlightListData) => renderToStaticMarkup(<FlightList list={list} />);

/** Renders after every lazy part has loaded, e.g. the stop airports' cities. */
async function renderLoaded(list: FlightListData): Promise<string> {
  const { prelude } = await prerender(<FlightList list={list} />);
  // Without React's text and Suspense markers, e.g. "<!--$-->".
  return (await new Response(prelude).text()).replaceAll(/<!--.*?-->/g, '');
}

describe('FlightList', () => {
  it('shows a direct flight with its carrier, times, price and source', () => {
    const html = render({ title: 'Bangkok → Chiang Mai', recommendedIndex: null, options: [getFare('a', getDirectLeg('FD 3433'))] });

    expect(html).toContain('Bangkok → Chiang Mai');
    expect(html).toContain('Thu 10 Dec · Economy');
    expect(html).toContain('07:05');
    expect(html).toContain('1 h 15 min');
    expect(html).toContain('Direct');
    expect(html).toContain('AirAsia · FD 3433');
    expect(html).toContain('THB 1,290');
    expect(html).toContain('Price at search time · Ignav');
    expect(html).not.toContain('unverified');
    expect(html).not.toContain('+1');
  });

  it('shows the stop airport with its city, the layover and every flight number of a one-stop leg', async () => {
    const segments = [getSegment('TP 579', { from: 'NUE', to: 'LIS' }), getSegment('TP 1944', { from: 'LIS', to: 'OPO', departureTime: '10:40', arrivalTime: '11:35' })];
    const oneStop = { ...getDirectLeg('TP 579', { from: 'NUE', to: 'OPO', durationMinutes: 270 }), stops: 1, segments };
    const list = { title: 'Nuremberg → Porto', recommendedIndex: null, options: [getFare('a', oneStop)] };
    // The city shows once its dataset has loaded; until then, just the code.
    expect(render(list)).toContain('1 stop LIS · 2 h 20 min');
    const html = await renderLoaded(list);
    expect(html).toContain('1 stop LIS (Lisbon) · 2 h 20 min');
    expect(html).toContain('AirAsia · TP 579, TP 1944');
  });

  it('marks an overnight arrival with +1', () => {
    const html = render({ title: 'Bangkok → Tokyo', recommendedIndex: null, options: [getFare('a', getDirectLeg('XJ 606', { arrivalDate: '2026-12-11' }))] });
    expect(html).toContain('+1');
  });

  it('tags both legs of a round trip with their direction and day', () => {
    const inbound = getDirectLeg('FD 3440', { from: 'CNX', to: 'DMK', departureDate: '2026-12-18', arrivalDate: '2026-12-18' });
    const html = render({ title: 'Bangkok ⇄ Chiang Mai', recommendedIndex: null, options: [getFare('a', getDirectLeg('FD 3433'), { inbound })] });
    expect(html).toContain('Outbound · Thu 10 Dec');
    expect(html).toContain('Return · Fri 18 Dec');
    expect(html).toContain('FD 3440');
  });

  it('says when a price is unverified', () => {
    const unverified = getFare('a', getDirectLeg('VZ 100'), { price: { amount: 89.5, currency: 'EUR', verified: false } });
    const html = render({ title: 'Bangkok → Chiang Mai', recommendedIndex: null, options: [unverified] });
    expect(html).toContain('€89.50');
    expect(html).toContain('unverified');
  });

  it('puts the recommended fare first and hides fares past three behind Show more', () => {
    const options = ['FD 1', 'FD 2', 'FD 3', 'FD 4', 'FD 5'].map((flight) => getFare(flight, getDirectLeg(flight)));
    const html = render({ title: 'Bangkok → Chiang Mai', recommendedIndex: 4, options });
    expect(html.indexOf('FD 5')).toBeLessThan(html.indexOf('FD 1'));
    expect(html).toContain('Recommended');
    expect(html).not.toContain('FD 3');
    expect(html).toContain('Show 2 more');
  });

  it('says so when there are no flights', () => {
    const html = render({ title: 'Bangkok → Chiang Mai', recommendedIndex: null, options: [] });
    expect(html).toContain('No flights found');
    expect(html).not.toContain('Show');
  });
});
