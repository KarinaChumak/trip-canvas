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
        { id: 's1', time: '08:30', title: 'Tram 28 to Graça', kind: 'transport', durationMinutes: 40, note: 'Board at Martim Moniz' },
        { id: 's2', time: '09:15', title: 'Café A Brasileira', kind: 'coffee', durationMinutes: 30, note: null },
        { id: 's3', time: '10:00', title: 'Belém Tower', kind: 'sight', durationMinutes: 60, note: null },
        { id: 's4', time: '12:30', title: 'Time Out Market', kind: 'food', durationMinutes: 75, note: 'Busy after 13:00' },
        { id: 's5', time: '14:30', title: 'MAAT', kind: 'museum', durationMinutes: 120, note: 'Closed on Tuesdays' },
        { id: 's6', time: '17:00', title: 'Embaixada', kind: 'shopping', durationMinutes: 45, note: null },
        { id: 's7', time: '18:30', title: 'Miradouro da Graça', kind: 'other', durationMinutes: null, note: 'Sunset spot' },
        { id: 's8', time: '20:00', title: 'Fado in Alfama', kind: 'nightlife', durationMinutes: 120, note: 'Book ahead' },
      ],
    },
  },
};

/** No date, no notes, no durations: the bare minimum the model can send. */
export const Minimal: Story = {
  args: {
    day: {
      title: 'A morning in Alfama',
      city: 'Lisbon',
      date: null,
      stops: [{ id: 's1', time: '09:30', title: 'São Jorge Castle', kind: 'sight', durationMinutes: null, note: null }],
    },
  },
};
