import type { Meta, StoryObj } from '@storybook/react-vite';
import { WeatherStrip } from '@/components/catalog/WeatherStrip';

const meta = {
  title: 'Catalog/WeatherStrip',
  component: WeatherStrip,
} satisfies Meta<typeof WeatherStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A week with every condition, with and without a rain chance. */
export const AllConditions: Story = {
  args: {
    forecast: {
      location: 'Porto, Portugal',
      unit: 'C',
      days: [
        { date: '2026-11-06', condition: 'sunny', high: 21, low: 13, precipitationChance: null },
        { date: '2026-11-07', condition: 'partly-cloudy', high: 19, low: 12, precipitationChance: 10 },
        { date: '2026-11-08', condition: 'cloudy', high: 17, low: 12, precipitationChance: 25 },
        { date: '2026-11-09', condition: 'rain', high: 16, low: 11, precipitationChance: 90 },
        { date: '2026-11-10', condition: 'storm', high: 15, low: 11, precipitationChance: 100 },
        { date: '2026-11-11', condition: 'snow', high: 2, low: -3, precipitationChance: 70 },
        { date: '2026-11-12', condition: 'fog', high: 14, low: 9, precipitationChance: null },
      ],
    },
  },
};

export const SingleDay: Story = {
  args: {
    forecast: {
      location: 'New York',
      unit: 'F',
      days: [{ date: '2026-11-07', condition: 'sunny', high: 64, low: 51, precipitationChance: null }],
    },
  },
};
