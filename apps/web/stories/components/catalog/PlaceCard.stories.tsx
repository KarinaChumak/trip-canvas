import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlaceCard } from '@/components/catalog/PlaceCard';

const meta = {
  title: 'Catalog/PlaceCard',
  component: PlaceCard,
} satisfies Meta<typeof PlaceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    place: {
      name: 'Time Out Market',
      category: 'Food hall',
      description: 'Dozens of Lisbon kitchens under one roof.',
      address: 'Av. 24 de Julho 49, Lisbon',
      rating: 4.4,
      url: 'https://www.timeoutmarket.com/lisboa/',
    },
  },
};

/** Only the required fields: no rating, address, description or link. */
export const Minimal: Story = {
  args: {
    place: {
      name: 'Miradouro da Graça',
      category: 'Viewpoint',
      description: null,
      address: null,
      rating: null,
      url: null,
    },
  },
};
