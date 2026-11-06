import type { EmitComponentInput } from '../schema.js';

/** A valid `emit_component` input per component, shared by the catalog tests. */
export const validInputs = {
  PlaceCard: {
    component: {
      type: 'PlaceCard',
      props: {
        name: 'Time Out Market',
        category: 'Food hall',
        placeId: null,
        description: 'Dozens of Lisbon kitchens under one roof.',
        address: 'Av. 24 de Julho 49, Lisbon',
        rating: 4.4,
        url: 'https://www.timeoutmarket.com/lisboa/',
      },
    },
  },
  WeatherStrip: {
    component: {
      type: 'WeatherStrip',
      props: {
        location: 'Lisbon',
        unit: 'C',
        days: [{ date: '2026-11-07', condition: 'sunny', high: 21, low: 14, precipitationChance: null }],
      },
    },
  },
  DayItinerary: {
    component: {
      type: 'DayItinerary',
      props: {
        title: 'A day in Alfama',
        city: 'Lisbon',
        date: null,
        stops: [
          { id: 's1', time: '09:30', title: 'São Jorge Castle', kind: 'sight', durationMinutes: 90, note: null },
          { id: 's2', time: '12:30', title: 'Lunch at Prado', kind: 'food', durationMinutes: null, note: 'Book ahead' },
        ],
      },
    },
  },
} satisfies Record<string, EmitComponentInput>;
