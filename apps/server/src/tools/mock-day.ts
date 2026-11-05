import { tool } from 'ai';
import { z } from 'zod';

// Temporary: gives the agent data to put into a DayItinerary until phase 3 brings
// real places and weather. Remove together with its test in phase 3.

const LISBON_STOPS = [
  { time: '09:30', title: 'São Jorge Castle', kind: 'sight', durationMinutes: 90, note: 'Go early to beat the queue' },
  { time: '11:15', title: 'Miradouro de Santa Luzia', kind: 'sight', durationMinutes: 30, note: null },
  { time: '12:30', title: 'Time Out Market', kind: 'food', durationMinutes: 75, note: null },
  { time: '14:30', title: 'MAAT', kind: 'museum', durationMinutes: 120, note: 'Closed on Tuesdays' },
  { time: '17:00', title: 'Pastéis de Belém', kind: 'coffee', durationMinutes: 30, note: 'Takeaway line moves faster' },
  { time: '20:00', title: 'Fado in Alfama', kind: 'nightlife', durationMinutes: 120, note: 'Book ahead' },
] as const;

const GENERIC_STOPS = [
  { time: '09:30', title: 'Old town walking tour', kind: 'sight', durationMinutes: 120, note: null },
  { time: '12:30', title: 'Lunch at the central market', kind: 'food', durationMinutes: 60, note: null },
  { time: '14:00', title: 'City museum', kind: 'museum', durationMinutes: 120, note: null },
  { time: '19:30', title: 'Dinner in the old town', kind: 'food', durationMinutes: 90, note: null },
] as const;

/** Sample stops for one day; Lisbon gets real places, other cities a generic day. */
export function mockDay(city: string) {
  const stops = city.trim().toLowerCase() === 'lisbon' ? LISBON_STOPS : GENERIC_STOPS;
  return { city, stops, source: 'mock data' };
}

export const getMockDay = tool({
  description:
    'Get sample stops for a one-day plan in a city (mock data). Use it before showing a DayItinerary.',
  inputSchema: z.object({ city: z.string().min(1).describe('City name, e.g. "Lisbon"') }),
  execute: async ({ city }) => mockDay(city),
});
