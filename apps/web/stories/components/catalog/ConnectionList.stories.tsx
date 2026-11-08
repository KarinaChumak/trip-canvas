import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ConnectionOptionData } from '@trip-canvas/catalog';
import { ConnectionList } from '@/components/catalog/ConnectionList';

const meta = {
  title: 'Catalog/ConnectionList',
  component: ConnectionList,
} satisfies Meta<typeof ConnectionList>;

export default meta;
type Story = StoryObj<typeof meta>;

function ice(line: string, departureTime: string, arrivalTime: string, durationMinutes: number): ConnectionOptionData {
  return {
    from: 'Berlin Hauptbahnhof',
    to: 'Munich Central Station',
    departureDate: '2026-11-13',
    departureTime,
    arrivalDate: '2026-11-13',
    arrivalTime,
    durationMinutes,
    segments: [
      { mode: 'train', line, from: 'Berlin Hauptbahnhof', to: 'Munich Central Station', departureTime, arrivalTime, headsign: 'München Hbf' },
    ],
  };
}

const VIA_FULDA: ConnectionOptionData = {
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
};

const BERLIN_MUNICH = [
  ice('ICE 1003', '06:36', '11:20', 284),
  VIA_FULDA,
  ice('ICE 1503', '07:37', '12:20', 283),
  ice('ICE 703', '07:55', '12:42', 287),
  ice('ICE 1005', '08:36', '13:20', 284),
  ice('ICE 1505', '09:37', '14:21', 284),
];

/** Opens on the recommended train and the next; "Earlier" and "Later" show the rest. */
export const Recommended: Story = {
  args: { list: { title: 'Outbound: Berlin → Munich', recommendedIndex: 2, options: BERLIN_MUNICH } },
};

/** No preference: the first two, and only "Later". */
export const NoRecommendation: Story = {
  args: { list: { title: 'Berlin → Munich', recommendedIndex: null, options: BERLIN_MUNICH } },
};

export const SingleOption: Story = {
  args: { list: { title: 'Return: Munich → Berlin', recommendedIndex: 0, options: [ice('ICE 1004', '17:00', '21:25', 265)] } },
};

/** Google also returned the next morning's train, so that row shows its day. */
export const NextDay: Story = {
  args: {
    list: {
      title: 'Bangkok → Chiang Mai',
      recommendedIndex: 0,
      options: [
        {
          from: 'Krung Thep Aphiwat Central Terminal Station (Bang Sue Grand Station)',
          to: 'Chiang Mai',
          departureDate: '2026-12-10',
          departureTime: '22:30',
          arrivalDate: '2026-12-11',
          arrivalTime: '11:40',
          durationMinutes: 790,
          segments: [{ mode: 'train', line: '51 (Express)', from: 'Krung Thep Aphiwat Central Terminal Station (Bang Sue Grand Station)', to: 'Chiang Mai', departureTime: '22:30', arrivalTime: '11:40', headsign: 'Chiang Mai' }],
        },
        {
          from: 'Krung Thep Aphiwat Central Terminal Station (Bang Sue Grand Station)',
          to: 'Chiang Mai',
          departureDate: '2026-12-11',
          departureTime: '07:30',
          arrivalDate: '2026-12-11',
          arrivalTime: '17:50',
          durationMinutes: 620,
          segments: [{ mode: 'train', line: '7 (Special Express)', from: 'Krung Thep Aphiwat Central Terminal Station (Bang Sue Grand Station)', to: 'Chiang Mai', departureTime: '07:30', arrivalTime: '17:50', headsign: 'Chiang Mai' }],
        },
      ],
    },
  },
};
