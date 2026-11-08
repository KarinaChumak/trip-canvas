import type { Meta, StoryObj } from '@storybook/react-vite';
import { PLACE_KINDS, type PlaceCardData } from '@trip-canvas/catalog';
import { PlaceCard } from '@/components/catalog/PlaceCard';

const meta = {
  title: 'Catalog/PlaceCard',
  component: PlaceCard,
} satisfies Meta<typeof PlaceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// A fixed moment, so the opening state never depends on when the story is viewed:
// 13 Nov 2026 is a Friday; noon in Lisbon (UTC+0).
const FRIDAY_NOON = new Date('2026-11-13T12:00:00Z');
const BANGKOK = 420;

/** Everything searchPlaces can return: rating with reviews, price level, kind and link. */
export const FullyRated: Story = {
  args: {
    place: {
      name: 'Time Out Market',
      category: 'Food hall',
      kind: 'food',
      placeId: 'ChIJ0SRzXYJ0GQ0RxsGOW3zPxV8',
      description: 'Dozens of Lisbon kitchens under one roof.',
      address: 'Av. 24 de Julho 49, Lisbon',
      rating: 4.4,
      reviewCount: 21345,
      priceLevel: 2,
      url: 'https://www.timeoutmarket.com/lisboa/',
      hours: [null, '10:00-24:00', '10:00-24:00', '10:00-24:00', '10:00-01:00', '10:00-01:00', '11:00-15:00,18:00-01:00'],
      utcOffsetMinutes: 0,
    },
    now: FRIDAY_NOON,
  },
};

/** The same hours on all 7 days. */
const everyDay = (day: string): NonNullable<PlaceCardData['hours']> => [day, day, day, day, day, day, day];

const MINIMAL: PlaceCardData = {
  name: 'Miradouro da Graça',
  category: 'Viewpoint',
  kind: null,
  placeId: null,
  description: null,
  address: null,
  rating: null,
  reviewCount: null,
  priceLevel: null,
  url: null,
  hours: null,
  utcOffsetMinutes: null,
};

const JAY_FAI: PlaceCardData = {
  ...MINIMAL,
  name: 'Jay Fai',
  category: 'Thai restaurant',
  kind: 'food',
  rating: 4.4,
  reviewCount: 6214,
  priceLevel: 1,
  hours: [null, null, null, '09:00-14:00,15:00-19:30', '09:00-14:00,15:00-19:30', '09:00-14:00,15:00-19:30', '09:00-14:00,15:00-19:30'],
  utcOffsetMinutes: BANGKOK,
};

/** Open by the place's own clock: 13:00 on Friday in Bangkok, during the lunch sitting. */
export const OpenNow: Story = {
  args: { place: JAY_FAI, now: new Date('2026-11-13T06:00:00Z') },
};

/** Closed between the two sittings: 14:30 on Friday in Bangkok. */
export const Closed: Story = {
  args: { place: JAY_FAI, now: new Date('2026-11-13T07:30:00Z') },
};

/** Friday's "18:00-02:00" keeps the market open at 01:00 on Saturday. */
export const OpenPastMidnight: Story = {
  args: {
    place: { ...JAY_FAI, name: 'Yaowarat Road Street Food', category: 'Market', kind: 'market', priceLevel: null, hours: everyDay('18:00-02:00') },
    now: new Date('2026-11-13T18:00:00Z'),
  },
};

export const Open24Hours: Story = {
  args: {
    place: { ...JAY_FAI, name: 'Kia Gee Kao Tom Mu', category: 'Dessert shop', kind: 'cafe', hours: everyDay('00:00-24:00') },
    now: FRIDAY_NOON,
  },
};

/** Google had no hours: no badge and no hours line. */
export const NoHours: Story = {
  args: { place: { ...JAY_FAI, hours: null }, now: FRIDAY_NOON },
};

/** Every nullable field null: no kind (plain badge), rating, reviews, price, address or link. */
export const Minimal: Story = {
  args: { place: MINIMAL },
};

/** One card per kind, each with its own badge icon and tint. */
export const AllKinds: Story = {
  args: { place: MINIMAL },
  render: () => (
    <div className="flex flex-col gap-3">
      {PLACE_KINDS.map((kind) => (
        <PlaceCard key={kind} place={{ ...MINIMAL, name: `A ${kind} place`, category: kind, kind }} />
      ))}
    </div>
  ),
};
