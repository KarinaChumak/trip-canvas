import type { Meta, StoryObj } from '@storybook/react-vite';
import { MapView } from '@/components/catalog/MapView';

const meta = {
  title: 'Catalog/MapView',
  component: MapView,
} satisfies Meta<typeof MapView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Five sights in Alfama; the map fits all pins. Click a pin for its name. */
export const SeveralPlaces: Story = {
  args: {
    map: {
      title: 'Sights in Alfama',
      places: [
        { name: 'Castelo de São Jorge', category: 'Castle', latitude: 38.7139, longitude: -9.1335 },
        { name: 'Miradouro de Santa Luzia', category: 'Viewpoint', latitude: 38.7118, longitude: -9.1302 },
        { name: 'Sé de Lisboa', category: 'Cathedral', latitude: 38.71, longitude: -9.1355 },
        { name: 'Museu do Fado', category: 'Museum', latitude: 38.711, longitude: -9.1278 },
        { name: 'Panteão Nacional', category: 'Monument', latitude: 38.7149, longitude: -9.125 },
      ],
    },
  },
};

/** One place: the map zooms in no further than street level. */
export const SinglePlace: Story = {
  args: {
    map: {
      title: 'Time Out Market',
      places: [{ name: 'Time Out Market', category: 'Food hall', latitude: 38.7069, longitude: -9.1459 }],
    },
  },
};
