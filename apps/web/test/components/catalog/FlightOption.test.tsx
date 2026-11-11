import { describe, expect, it, vi } from 'vitest';
import { prerender } from 'react-dom/static';
import type { FlightOptionData } from '@trip-canvas/catalog';
import { FlightOption } from '@/components/catalog/FlightOption';

// The lazy city chunk fails to load, as it would offline or after a deploy replaced it.
vi.mock('@/components/catalog/LayoverCity', () => {
  throw new Error('Failed to fetch dynamically imported module');
});

const TIMES = { departureDate: '2026-12-10', arrivalDate: '2026-12-10', durationMinutes: 375 };
const FLIGHT: FlightOptionData = {
  id: 'g9-384-841',
  price: { amount: 412, currency: 'EUR', verified: true },
  cabinClass: 'economy',
  outbound: {
    ...TIMES,
    carrier: 'Air Arabia',
    from: 'NUE',
    to: 'BKK',
    departureTime: '15:20',
    arrivalTime: '22:35',
    stops: 1,
    segments: [
      { ...TIMES, flight: 'G9 384', operatingCarrier: null, aircraft: null, from: 'NUE', to: 'SHJ', departureTime: '15:20', arrivalTime: '23:35' },
      { ...TIMES, flight: 'G9 841', operatingCarrier: null, aircraft: null, from: 'SHJ', to: 'BKK', departureDate: '2026-12-11', arrivalDate: '2026-12-11', departureTime: '13:20', arrivalTime: '22:35' },
    ],
  },
  inbound: null,
};

describe('FlightOption', () => {
  it('keeps the fare and shows just the stop code when the city chunk fails to load', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { prelude } = await prerender(<FlightOption flight={FLIGHT} recommended={false} />);
    // Without React's text and Suspense markers, e.g. "<!--$-->".
    const html = (await new Response(prelude).text()).replaceAll(/<!--.*?-->/g, '');

    expect(html).toContain('1 stop SHJ · 13 h 45 min');
    expect(html).toContain('€412');
    expect(warn).toHaveBeenCalledWith('Layover cities failed to load', expect.any(Error));
  });
});
