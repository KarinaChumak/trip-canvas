import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PlaceCardData } from '@trip-canvas/catalog';
import { PlaceCard } from '@/components/catalog/PlaceCard';

const CUNHA: PlaceCardData = {
  name: 'Cunha',
  category: 'Café',
  kind: 'cafe',
  placeId: 'ChIJ8Ztv3W6Z4jARgHrNfHXrbkM',
  description: null,
  address: 'Beco de Santa Helena 13, 1100-117 Lisboa, Portugal',
  rating: 4.5,
  reviewCount: null,
  priceLevel: null,
  url: null,
};

const render = (place: PlaceCardData) => renderToStaticMarkup(<PlaceCard place={place} />);

describe('PlaceCard', () => {
  it('renders the fields searchPlaces returned', () => {
    const html = render(CUNHA);
    expect(html).toContain('Cunha');
    expect(html).toContain('Beco de Santa Helena 13, 1100-117 Lisboa, Portugal');
    expect(html).toContain('Rated 4.5 out of 5');
  });

  it('leaves out the address when there is none', () => {
    expect(render({ ...CUNHA, address: null })).not.toContain('Beco');
  });

  it('shows the rating with its review count and the price level', () => {
    const html = render({ ...CUNHA, rating: 4.6, reviewCount: 1234, priceLevel: 2 });

    expect(html).toContain('4.6 (1,234)');
    expect(html).toContain('aria-label="Rated 4.6 out of 5 from 1,234 reviews"');
    expect(html).toContain('aria-label="Moderate price"');
    expect(html).toContain('>$$<');
  });

  it('shows free places as free', () => {
    expect(render({ ...CUNHA, priceLevel: 0 })).toContain('aria-label="Free"');
  });

  it('leaves out rating and price when they are unknown', () => {
    const html = render({ ...CUNHA, rating: null });
    for (const text of ['Rated', '$']) expect(html).not.toContain(text);
  });

  it('labels the kind badge with the category, and falls back to other without a kind', () => {
    expect(render(CUNHA)).toContain('data-kind="cafe"');
    expect(render(CUNHA)).toContain('Café');
    expect(render({ ...CUNHA, kind: null })).toContain('data-kind="other"');
  });
});
