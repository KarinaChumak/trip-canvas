import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PlaceCardData } from '@trip-canvas/catalog';
import { PlaceCard } from '@/components/catalog/PlaceCard';

const CUNHA: PlaceCardData = {
  name: 'Cunha',
  category: 'Café',
  placeId: 'ChIJ8Ztv3W6Z4jARgHrNfHXrbkM',
  description: null,
  address: 'Beco de Santa Helena 13, 1100-117 Lisboa, Portugal',
  rating: 4.5,
  url: null,
};

describe('PlaceCard', () => {
  it('renders the fields searchPlaces returned', () => {
    const html = renderToStaticMarkup(<PlaceCard place={CUNHA} />);
    expect(html).toContain('Cunha');
    expect(html).toContain('Beco de Santa Helena 13, 1100-117 Lisboa, Portugal');
    expect(html).toContain('Rated 4.5 out of 5');
  });

  it('leaves out the address when there is none', () => {
    expect(renderToStaticMarkup(<PlaceCard place={{ ...CUNHA, address: null }} />)).not.toContain('Beco');
  });
});
