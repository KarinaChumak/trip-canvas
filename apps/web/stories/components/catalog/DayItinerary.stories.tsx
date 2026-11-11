import type { Meta, StoryObj } from '@storybook/react-vite';
import { DayItinerary } from '@/components/catalog/DayItinerary';

const meta = {
  title: 'Catalog/DayItinerary',
  component: DayItinerary,
} satisfies Meta<typeof DayItinerary>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One stop of every kind, so each icon shows up. */
export const AllStopKinds: Story = {
  args: {
    day: {
      title: 'A day in Lisbon',
      city: 'Lisbon',
      date: '2026-11-07',
      stops: [
        { id: 's1', time: '08:30', title: 'Tram 28 to Graça', kind: 'transport', durationMinutes: 40, note: 'Board at Martim Moniz', placeId: null, latitude: null, longitude: null },
        { id: 's2', time: '09:15', title: 'Café A Brasileira', kind: 'coffee', durationMinutes: 30, note: null, placeId: null, latitude: null, longitude: null },
        { id: 's3', time: '10:00', title: 'Belém Tower', kind: 'sight', durationMinutes: 60, note: null, placeId: null, latitude: null, longitude: null },
        { id: 's4', time: '12:30', title: 'Time Out Market', kind: 'food', durationMinutes: 75, note: 'Busy after 13:00', placeId: null, latitude: null, longitude: null },
        { id: 's5', time: '14:30', title: 'MAAT', kind: 'museum', durationMinutes: 120, note: 'Closed on Tuesdays', placeId: null, latitude: null, longitude: null },
        { id: 's6', time: '17:00', title: 'Embaixada', kind: 'shopping', durationMinutes: 45, note: null, placeId: null, latitude: null, longitude: null },
        { id: 's7', time: '18:30', title: 'Miradouro da Graça', kind: 'other', durationMinutes: null, note: 'Sunset spot', placeId: null, latitude: null, longitude: null },
        { id: 's8', time: '20:00', title: 'Fado in Alfama', kind: 'nightlife', durationMinutes: 120, note: 'Book ahead', placeId: null, latitude: null, longitude: null },
      ],
    },
  },
};

/** No date, no notes, no durations, no coordinates: the bare minimum the model can send. */
export const Minimal: Story = {
  args: {
    day: {
      title: 'A morning in Alfama',
      city: 'Lisbon',
      date: null,
      stops: [{ id: 's1', time: '09:30', title: 'São Jorge Castle', kind: 'sight', durationMinutes: null, note: null, placeId: null, latitude: null, longitude: null }],
    },
  },
};

/** Stops from searchPlaces carry coordinates, so the card links the walk to Google Maps; the tuk-tuk ride has none and is left out. Place ids stay null: made-up ones would send Google Maps to the wrong place. */
export const WithGoogleMapsLink: Story = {
  args: {
    day: {
      title: 'Temples of the old city',
      city: 'Chiang Mai',
      date: '2026-12-11',
      stops: [
        { id: 's1', time: '08:30', title: 'Wat Phra Singh', kind: 'sight', durationMinutes: 60, note: 'Cover shoulders and knees', placeId: null, latitude: 18.7884, longitude: 98.9819 },
        { id: 's2', time: '09:45', title: 'Wat Chedi Luang', kind: 'sight', durationMinutes: 60, note: null, placeId: null, latitude: 18.7869, longitude: 98.9865 },
        { id: 's3', time: '11:00', title: 'Khao soi lunch', kind: 'food', durationMinutes: 45, note: null, placeId: null, latitude: 18.7905, longitude: 98.9903 },
        { id: 's4', time: '12:00', title: 'Tuk-tuk to Nimman', kind: 'transport', durationMinutes: 15, note: null, placeId: null, latitude: null, longitude: null },
        { id: 's5', time: '12:30', title: 'Ristr8to', kind: 'coffee', durationMinutes: 30, note: null, placeId: null, latitude: 18.7998, longitude: 98.9677 },
      ],
    },
  },
};

/** 12 stops are more than one Google Maps link holds (9 waypoints), so the day gets two links that share the middle stop. */
export const LongDayTwoLinks: Story = {
  args: {
    day: {
      title: 'A long day in Lisbon',
      city: 'Lisbon',
      date: '2026-12-06',
      stops: Array.from({ length: 12 }, (_, i) => ({
        id: `s${i + 1}`,
        time: `${String(8 + i).padStart(2, '0')}:00`,
        title: `Stop ${i + 1}`,
        kind: 'sight' as const,
        durationMinutes: 45,
        note: null,
        placeId: null,
        latitude: 38.71 + i * 0.002,
        longitude: -9.14 + i * 0.002,
      })),
    },
  },
};
