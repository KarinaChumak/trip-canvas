import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ConnectionListData, ConnectionOptionData } from 'catalog';
import { ConnectionList } from '@/components/catalog/ConnectionList';

function ice(line: string, departureTime: string, departureDate = '2026-11-13'): ConnectionOptionData {
  return {
    from: 'Berlin Hauptbahnhof',
    to: 'Munich Central Station',
    departureDate,
    departureTime,
    arrivalDate: departureDate,
    arrivalTime: '23:00',
    durationMinutes: 284,
    segments: [{ mode: 'train', line, from: 'Berlin Hauptbahnhof', to: 'Munich Central Station', departureTime, arrivalTime: '23:00', headsign: null }],
  };
}

const OPTIONS = [ice('ICE 1003', '06:36'), ice('ICE 1503', '07:37'), ice('ICE 703', '07:55'), ice('ICE 1005', '08:36', '2026-11-14')];

const render = (list: ConnectionListData) => renderToStaticMarkup(<ConnectionList list={list} />);

describe('ConnectionList', () => {
  it('shows the recommended option and the next, with Earlier and Later', () => {
    const html = render({ title: 'Outbound: Berlin → Munich', recommendedIndex: 1, options: OPTIONS });

    expect(html).toContain('Outbound: Berlin → Munich');
    expect(html).toContain('ICE 1503');
    expect(html).toContain('ICE 703');
    expect(html).not.toContain('ICE 1003');
    expect(html).toContain('Recommended');
    expect(html).toContain('Earlier');
    expect(html).toContain('Later');
    expect(html).toContain('aria-label="Connections from Google Maps"');
  });

  it('has no Earlier at the top and no Later at the bottom', () => {
    const html = render({ title: 'Berlin → Munich', recommendedIndex: null, options: OPTIONS.slice(0, 2) });
    expect(html).not.toContain('Earlier');
    expect(html).not.toContain('Later');
    expect(html).not.toContain('Recommended');
  });

  it("shows the day of an option on another day than the first", () => {
    const html = render({ title: 'Berlin → Munich', recommendedIndex: 3, options: OPTIONS });
    expect(html).toContain('Sat 14 Nov');
  });
});
