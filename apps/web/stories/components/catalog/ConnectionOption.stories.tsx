import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConnectionOption } from '@/components/catalog/ConnectionOption';

const meta = {
  title: 'Catalog/ConnectionOption',
  component: ConnectionOption,
} satisfies Meta<typeof ConnectionOption>;

export default meta;
// One row of a ConnectionList. The list stories cover a change, overnight trains and the
// recommended row; this one adds the bus and ferry modes and a segment without a line.
type Story = StoryObj<typeof meta>;

/** A bus to the pier, then a ferry; the ferry has no line name. */
export const BusAndFerry: Story = {
  args: {
    recommended: false,
    showDate: false,
    connection: {
      from: 'Hua Hin Bus Terminal',
      to: 'Mae Haad Pier, Koh Tao',
      departureDate: '2026-12-14',
      departureTime: '08:30',
      arrivalDate: '2026-12-14',
      arrivalTime: '15:15',
      durationMinutes: 405,
      segments: [
        { mode: 'bus', line: 'Lomprayah', from: 'Hua Hin Bus Terminal', to: 'Chumphon Pier', departureTime: '08:30', arrivalTime: '12:15', headsign: 'Chumphon' },
        { mode: 'ferry', line: null, from: 'Chumphon Pier', to: 'Mae Haad Pier, Koh Tao', departureTime: '13:00', arrivalTime: '15:15', headsign: null },
      ],
    },
  },
};
