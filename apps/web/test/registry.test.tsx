import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSONUIProvider, Renderer } from '@json-render/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toSpec, type EmitComponentInput } from 'catalog/schema';
import { registry } from '@/registry';

// Renderer reads state, visibility and actions from these providers.
function render(input: EmitComponentInput) {
  return renderToStaticMarkup(
    // PlaceCard loads its details through TanStack Query, as in the app.
    <QueryClientProvider client={new QueryClient()}>
      <JSONUIProvider registry={registry}>
        <Renderer spec={toSpec(input)} registry={registry} />
      </JSONUIProvider>
    </QueryClientProvider>,
  );
}

describe('registry', () => {
  it('renders a PlaceCard with its rating and website link', () => {
    const html = render({
      component: {
        type: 'PlaceCard',
        props: {
          name: 'Time Out Market',
          category: 'Food hall',
          placeId: null,
          description: 'Dozens of Lisbon kitchens under one roof.',
          address: 'Av. 24 de Julho 49',
          rating: 4.4,
          url: 'https://www.timeoutmarket.com/lisboa/',
        },
      },
    });
    for (const text of ['Time Out Market', 'Food hall', 'Dozens of Lisbon kitchens', '4.4']) {
      expect(html).toContain(text);
    }
    expect(html).toContain('href="https://www.timeoutmarket.com/lisboa/"');
  });

  it('leaves out empty optional PlaceCard fields', () => {
    const html = render({
      component: {
        type: 'PlaceCard',
        props: { name: 'MAAT', category: 'Museum', placeId: null, description: null, address: null, rating: null, url: null },
      },
    });
    expect(html).toContain('MAAT');
    expect(html).not.toContain('Rated');
    expect(html).not.toContain('Website');
  });

  it('credits OpenTripMap and OpenStreetMap in the PlaceCard footer', () => {
    const html = render({
      component: {
        type: 'PlaceCard',
        props: { name: 'MAAT', category: 'Museum', placeId: null, description: null, address: null, rating: null, url: null },
      },
    });
    expect(html).toContain('Places by OpenTripMap · © OpenStreetMap contributors');
    expect(html).toContain('href="https://opentripmap.com/"');
  });

  it('renders a WeatherStrip with one entry per day', () => {
    const html = render({
      component: {
        type: 'WeatherStrip',
        props: {
          location: 'Lisbon',
          unit: 'C',
          days: [
            { date: '2026-11-07', condition: 'sunny', high: 21, low: 14, precipitationChance: null },
            { date: '2026-11-08', condition: 'rain', high: 18.6, low: 13, precipitationChance: 70 },
          ],
        },
      },
    });
    for (const text of ['Lisbon', '2-day forecast', 'Sat 7 Nov', 'Sun 8 Nov', '19° / 13°C', '70% rain']) {
      expect(html).toContain(text);
    }
  });

  it('renders a DayItinerary with its stops in order', () => {
    const html = render({
      component: {
        type: 'DayItinerary',
        props: {
          title: 'A day in Alfama',
          city: 'Lisbon',
          date: '2026-11-07',
          stops: [
            { id: 's1', time: '09:30', title: 'São Jorge Castle', kind: 'sight', durationMinutes: 90, note: null },
            { id: 's2', time: '12:30', title: 'Lunch at Prado', kind: 'food', durationMinutes: null, note: 'Book ahead' },
          ],
        },
      },
    });
    for (const text of ['A day in Alfama', 'Lisbon · Sat 7 Nov', '09:30', '1 h 30 min', 'Book ahead']) {
      expect(html).toContain(text);
    }
    expect(html.indexOf('São Jorge Castle')).toBeLessThan(html.indexOf('Lunch at Prado'));
  });

  it('renders a MapView title and map credit, with the map itself loading lazily', () => {
    const html = render({
      component: {
        type: 'MapView',
        props: {
          title: 'Sights in Alfama',
          places: [{ name: 'Sé de Lisboa', category: 'Cathedral', latitude: 38.71, longitude: -9.1355 }],
        },
      },
    });
    for (const text of ['Sights in Alfama', 'OpenFreeMap © OpenMapTiles · Data © OpenStreetMap contributors']) {
      expect(html).toContain(text);
    }
  });
});
