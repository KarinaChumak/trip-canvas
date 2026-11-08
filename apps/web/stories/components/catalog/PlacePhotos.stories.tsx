import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlacePhotos } from '@/components/catalog/PlacePhotos';
import { photoFails, photosHandler } from '../../fixtures/place-photos';

const meta = {
  title: 'Catalog/PlacePhotos',
  component: PlacePhotos,
  args: { placeId: 'ChIJ0SRzXYJ0GQ0RxsGOW3zPxV8' },
  decorators: [(Story) => <div className="w-md"><Story /></div>],
} satisfies Meta<typeof PlacePhotos>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first photo never arrives, so the placeholder stays. */
export const Loading: Story = {
  beforeEach: ({ msw }) => msw.use(photosHandler(3, 'infinite')),
};

/** Four photos: each loads only when the carousel reaches it. */
export const SeveralPhotos: Story = {
  beforeEach: ({ msw }) => msw.use(photosHandler(4)),
};

/** One photo, so no arrows. */
export const OnePhoto: Story = {
  beforeEach: ({ msw }) => msw.use(photosHandler(1)),
};

/** The place has no photo (404): nothing shows. */
export const NoPhoto: Story = {
  beforeEach: ({ msw }) => msw.use(photosHandler(0)),
};

/** The server can't get the photo (502), so nothing shows; a PlaceCard keeps everything else. */
export const PhotoFails: Story = {
  beforeEach: ({ msw }) => msw.use(photoFails),
};
