import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PlaceCardData } from '@trip-canvas/catalog';
import { PlaceCard } from '@/components/catalog/PlaceCard';

const CUNHA: PlaceCardData = {
  name: 'Cunha',
  category: 'Café',
  placeId: 'N4627375983',
  description: null,
  address: null,
  rating: null,
  url: null,
};

function render(place: PlaceCardData, queryClient = new QueryClient()) {
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <PlaceCard place={place} />
    </QueryClientProvider>,
  );
}

describe('PlaceCard', () => {
  it('renders the name at once and placeholders while its details load', () => {
    const html = render(CUNHA);
    expect(html).toContain('Cunha');
    expect(html).toContain('aria-busy="true"');
  });

  it('shows the details once they have loaded', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['place-details', 'N4627375983'], {
      address: 'Beco de Santa Helena 13, Alfama',
      description: null,
      url: 'https://example.pt/',
    });
    const html = render(CUNHA, queryClient);

    expect(html).toContain('Beco de Santa Helena 13, Alfama');
    expect(html).toContain('href="https://example.pt/"');
    expect(html).toContain('aria-busy="false"');
  });

  it('loads nothing for a card without a placeId', () => {
    expect(render({ ...CUNHA, placeId: null })).toContain('aria-busy="false"');
  });
});
