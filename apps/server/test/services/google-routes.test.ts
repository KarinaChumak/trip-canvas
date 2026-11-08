import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateEmitComponent } from 'catalog/schema';
import { createGoogleRoutesClient, localDateTime, modeFor, type ConnectionSearch } from '../../src/services/google-routes.js';
import bangkok from '../fixtures/google-routes-bangkok-chiang-mai.json' with { type: 'json' };
import berlin from '../fixtures/google-routes-berlin-munich.json' with { type: 'json' };

const BANGKOK: ConnectionSearch = { from: 'Bangkok', to: 'Chiang Mai', when: '2026-12-10T05:00:00+07:00', arriveBy: false };
const BERLIN: ConnectionSearch = { from: 'Berlin Hbf', to: 'München Hbf', when: '2026-11-13T06:00:00+01:00', arriveBy: false };

const googleRoutes = () => createGoogleRoutesClient({ apiKey: 'test-key' });

function stubFetch(body: unknown, status = 200) {
  const fetch = vi.fn(async (_url: URL, _init: RequestInit) => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('googleRoutes.findConnections', () => {
  it('lists the SRT trains in local time, earliest first', async () => {
    stubFetch(bangkok);
    const connections = await googleRoutes().findConnections(BANGKOK);

    expect(connections.map((c) => [c.segments[0]?.line, c.departureTime, c.arrivalTime])).toEqual([
      ['7 (Special Express)', '07:30', '17:50'],
      ['109 (Rapid)', '14:15', '04:00'],
      ['9 (Special Express)', '18:40', '07:15'],
      ['13 (Special Express)', '20:05', '08:45'],
      ['51 (Express)', '22:30', '11:40'],
      ['7 (Special Express)', '07:30', '17:50'],
    ]);
    expect(connections[0]).toMatchObject({
      from: 'Krung Thep Aphiwat Central Terminal Station (Bang Sue Grand Station)',
      to: 'Chiang Mai',
      departureDate: '2026-12-10',
      arrivalDate: '2026-12-10',
      durationMinutes: 620,
      segments: [{ mode: 'train', headsign: 'Chiang Mai' }],
    });
    // Overnight trains arrive the next day.
    expect(connections[1]?.arrivalDate).toBe('2026-12-11');
    // Google also offers the next morning's train.
    expect(connections[5]?.departureDate).toBe('2026-12-11');
  });

  it('keeps a change as two segments and returns options a ConnectionList accepts', async () => {
    stubFetch(berlin);
    const connections = await googleRoutes().findConnections(BERLIN);

    const viaFulda = connections.find((c) => c.segments.length === 2);
    expect(viaFulda?.segments.map((segment) => [segment.line, segment.from, segment.to, segment.departureTime, segment.arrivalTime])).toEqual([
      ['ICE 595', 'Berlin Hauptbahnhof', 'Fulda', '07:27', '10:47'],
      ['ICE 785', 'Fulda', 'Munich Central Station', '10:56', '14:05'],
    ]);
    expect(connections[0]?.segments[0]?.line).toBe('ICE 1003');
    const list = { title: 'Berlin → Munich', recommendedIndex: 0, options: connections };
    expect(validateEmitComponent({ component: { type: 'ConnectionList', props: list } })).toMatchObject({ ok: true });
  });

  it('POSTs the search with the key and field mask in headers', async () => {
    const fetch = stubFetch(bangkok);
    await googleRoutes().findConnections({ ...BANGKOK, arriveBy: true });

    const [url, init] = fetch.mock.calls[0]!;
    expect(String(url)).toBe('https://routes.googleapis.com/directions/v2:computeRoutes');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'X-Goog-Api-Key': 'test-key', 'X-Goog-FieldMask': expect.any(String) });
    expect(JSON.parse(String(init.body))).toMatchObject({
      origin: { address: 'Bangkok' },
      destination: { address: 'Chiang Mai' },
      travelMode: 'TRANSIT',
      arrivalTime: BANGKOK.when,
    });
  });

  it('never caches: the same search asks Google again', async () => {
    const fetch = stubFetch(bangkok);
    const client = googleRoutes();
    await client.findConnections(BANGKOK);
    await client.findConnections(BANGKOK);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('returns no connections when Google finds no route', async () => {
    stubFetch({});
    expect(await googleRoutes().findConnections(BANGKOK)).toEqual([]);
  });

  it('throws on an HTTP error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubFetch({ error: { message: 'API key not valid' } }, 400);
    await expect(googleRoutes().findConnections(BANGKOK)).rejects.toThrow('Google Routes returned 400');
  });
});

describe('modeFor', () => {
  it.each([
    ['HIGH_SPEED_TRAIN', 'train'],
    ['SUBWAY', 'metro'],
    ['INTERCITY_BUS', 'bus'],
    ['FERRY', 'ferry'],
    ['CABLE_CAR', 'other'],
  ])('maps %s to %s', (type, mode) => {
    expect(modeFor(type)).toBe(mode);
  });
});

describe('localDateTime', () => {
  it('converts an instant to the local date and 24-hour time', () => {
    expect(localDateTime('2026-12-10T17:00:00Z', 'Asia/Bangkok')).toEqual({ date: '2026-12-11', time: '00:00' });
  });
});
