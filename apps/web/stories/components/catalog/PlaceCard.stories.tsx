import type { Meta, StoryObj } from '@storybook/react-vite';
import { PLACE_KINDS, type PlaceCardData } from '@trip-canvas/catalog';
import { PlaceCard } from '@/components/catalog/PlaceCard';

const meta = {
  title: 'Catalog/PlaceCard',
  component: PlaceCard,
} satisfies Meta<typeof PlaceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

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
    },
  },
};

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
