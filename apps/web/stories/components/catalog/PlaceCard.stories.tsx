import type { Meta, StoryObj } from '@storybook/react-vite';
import { delay, http, HttpResponse } from 'msw';
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
      placeId: null,
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
      placeId: null,
      description: null,
      address: null,
      rating: null,
      url: null,
    },
  },
};

/** A card from searchPlaces: it renders at once and loads the rest from /api/places/:id. */
const FROM_SEARCH = {
  name: 'Igreja de Santa Luzia',
  category: 'Church',
  placeId: 'W96758903',
  description: null,
  address: null,
  rating: null,
  url: null,
};

const DETAILS = {
  address: 'Largo de Santa Luzia, Alfama',
  description: 'Igreja de Santa Luzia is a church in Lisbon, Portugal. It is classified as a National Monument.',
  url: 'https://www.patrimoniocultural.gov.pt/',
};

/** The details request never answers, so the placeholders stay. */
export const LoadingDetails: Story = {
  args: { place: FROM_SEARCH },
  beforeEach({ msw }) {
    msw.use(
      http.get('/api/places/:id', async () => {
        await delay('infinite');
        return HttpResponse.json(DETAILS);
      }),
    );
  },
};

/** The details arrive after a moment, replacing the placeholders. */
export const DetailsArrive: Story = {
  args: { place: FROM_SEARCH },
  beforeEach({ msw }) {
    msw.use(
      http.get('/api/places/:id', async () => {
        await delay(1500);
        return HttpResponse.json(DETAILS);
      }),
    );
  },
};

/** The server can't get details, so the card keeps only its name and category. */
export const DetailsFail: Story = {
  args: { place: FROM_SEARCH },
  beforeEach({ msw }) {
    msw.use(
      http.get('/api/places/:id', () => HttpResponse.json({ error: 'Place details are unavailable' }, { status: 502 })),
    );
  },
};
