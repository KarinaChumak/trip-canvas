import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { JSONUIProvider, Renderer } from '@json-render/react';
import { toSpec, type EmitComponentInput } from '@trip-canvas/catalog/schema';
import { registry } from '@/registry';

// Renderer reads state, visibility and actions from these providers.
function render(input: EmitComponentInput) {
  return renderToStaticMarkup(
    <JSONUIProvider registry={registry}>
      <Renderer spec={toSpec(input)} registry={registry} />
    </JSONUIProvider>,
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
          kind: 'food',
          placeId: null,
          description: 'Dozens of Lisbon kitchens under one roof.',
          address: 'Av. 24 de Julho 49',
          rating: 4.4,
          reviewCount: 21345,
          priceLevel: 2,
          url: 'https://www.timeoutmarket.com/lisboa/',
          hours: null,
          utcOffsetMinutes: null,
        },
      },
    });
    for (const text of ['Time Out Market', 'Food hall', 'Dozens of Lisbon kitchens', '4.4 (21,345)', '$$']) {
      expect(html).toContain(text);
    }
    expect(html).toContain('href="https://www.timeoutmarket.com/lisboa/"');
  });

  it('leaves out empty optional PlaceCard fields', () => {
    const html = render({
      component: {
        type: 'PlaceCard',
        props: { name: 'MAAT', category: 'Museum', kind: 'museum', placeId: null, description: null, address: null, rating: null, reviewCount: null, priceLevel: null, url: null, hours: null, utcOffsetMinutes: null },
      },
    });
    expect(html).toContain('MAAT');
    expect(html).not.toContain('Rated');
    expect(html).not.toContain('$');
    expect(html).not.toContain('Website');
  });

  it('credits Google Maps behind the PlaceCard info icon', () => {
    const html = render({
      component: {
        type: 'PlaceCard',
        props: { name: 'MAAT', category: 'Museum', kind: 'museum', placeId: null, description: null, address: null, rating: null, reviewCount: null, priceLevel: null, url: null, hours: null, utcOffsetMinutes: null },
      },
    });
    expect(html).toContain('Google Maps');
    expect(html).toContain('href="https://www.google.com/maps"');
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
    expect(html).toContain('aria-label="Weather data by Open-Meteo"');
    expect(html).toContain('href="https://open-meteo.com/"');
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
