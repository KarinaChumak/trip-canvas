import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlacePhotos } from '@/components/catalog/PlacePhotos';

const ID = 'ChIJ0SRzXYJ0GQ0RxsGOW3zPxV8';
const key = (index: number) => ['place-photo', ID, index, 800];
const photo = (count: number) => ({ photoUri: 'https://lh3.googleusercontent.com/p/first', author: { name: 'Ana S.', url: 'https://maps.google.com/maps/contrib/1' }, count });

/** Renders with the first photo's query already in `state`: pending when left out. */
function render(state?: { data: unknown } | { error: Error }) {
  // retryOnMount: false, so a failed query stays failed instead of starting a retry.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retryOnMount: false } } });
  if (state && 'data' in state) queryClient.setQueryData(key(0), state.data);
  if (state && 'error' in state) queryClient.getQueryCache().build(queryClient, { queryKey: key(0) }).setState({ status: 'error', error: state.error });
  const html = renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <PlacePhotos placeId={ID} />
    </QueryClientProvider>,
  );
  return { html, queryClient };
}

describe('PlacePhotos', () => {
  it('shows a placeholder while the first photo loads', () => {
    expect(render().html).toContain('aria-label="Loading photo"');
  });

  it('shows one photo with its author and no arrows', () => {
    const { html } = render({ data: photo(1) });
    expect(html).toContain('src="https://lh3.googleusercontent.com/p/first"');
    expect(html).toContain('href="https://maps.google.com/maps/contrib/1"');
    expect(html).toContain('Photo: Ana S.');
    expect(html).not.toContain('Next slide');
  });

  it('has arrows for several photos and leaves the others unloaded until the carousel moves', () => {
    const { html, queryClient } = render({ data: photo(3) });
    expect(html).toContain('Next slide');
    expect(html.match(/aria-roledescription="slide"/g)).toHaveLength(3);
    expect(queryClient.getQueryState(key(1))?.fetchStatus).toBe('idle');
  });

  it('shows nothing when the place has no photo or the request failed', () => {
    expect(render({ data: null }).html).toBe('');
    expect(render({ error: new Error('502') }).html).toBe('');
  });
});
