import type { EmitComponentInput } from '../src/schema.js';

/** A valid `emit_component` input per component, shared by the catalog tests. */
export const validInputs = {
  PlaceCard: {
    component: {
      type: 'PlaceCard',
      props: {
        name: 'Time Out Market',
        category: 'Food hall',
        kind: 'food',
        placeId: null,
        description: 'Dozens of Lisbon kitchens under one roof.',
        address: 'Av. 24 de Julho 49, Lisbon',
        rating: 4.4,
        reviewCount: 21345,
        priceLevel: 2,
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
  MapView: {
    component: {
      type: 'MapView',
      props: {
        title: 'Sights in Alfama',
        places: [
          { name: 'Castelo de São Jorge', category: 'Castle', latitude: 38.7139, longitude: -9.1335 },
          { name: 'Sé de Lisboa', category: 'Cathedral', latitude: 38.71, longitude: -9.1355 },
        ],
      },
    },
  },
  ConnectionList: {
    component: {
      type: 'ConnectionList',
      props: {
        title: 'Berlin → Munich',
        recommendedIndex: 0,
        options: [
          {
            from: 'Berlin Hauptbahnhof',
            to: 'Munich Central Station',
            departureDate: '2026-11-13',
            departureTime: '07:27',
            arrivalDate: '2026-11-13',
            arrivalTime: '14:05',
            durationMinutes: 398,
            segments: [
              { mode: 'train', line: 'ICE 595', from: 'Berlin Hauptbahnhof', to: 'Fulda', departureTime: '07:27', arrivalTime: '10:47', headsign: null },
              { mode: 'train', line: 'ICE 785', from: 'Fulda', to: 'Munich Central Station', departureTime: '10:56', arrivalTime: '14:05', headsign: 'München Hbf' },
            ],
          },
        ],
      },
    },
  },
} satisfies Record<string, EmitComponentInput>;
