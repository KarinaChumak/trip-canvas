import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { EmitComponentInput } from '@trip-canvas/catalog/schema';
import { Block } from '@/blocks/Block';

// PlaceCard loads its details through TanStack Query, as in the app.
function render(input: EmitComponentInput) {
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <Block input={input} />
    </QueryClientProvider>,
  );
}

const place: EmitComponentInput = {
  component: {
    type: 'PlaceCard',
    props: { name: 'MAAT', category: 'Museum', placeId: null, description: null, address: null, rating: 4.5, url: null },
  },
};

/** Stands in for a saved input the current catalog no longer accepts. */
function stale(input: unknown): EmitComponentInput {
  return input as EmitComponentInput;
}

describe('Block', () => {
  it('renders an accepted component through the registry', () => {
    expect(render(place)).toContain('MAAT');
  });

  it('falls back for a component the catalog no longer has', () => {
    const html = render(stale({ component: { type: 'OldWidget', props: {} } }));
    expect(html).toContain('This OldWidget can');
  });

  it('falls back for props that no longer match the catalog', () => {
    const input = stale({ component: { ...place.component, props: { ...place.component.props, rating: 'five' } } });
    const html = render(input);

    expect(html).toContain('This PlaceCard can');
    expect(html).not.toContain('MAAT');
  });

  it('falls back for input without a component at all', () => {
    expect(render(stale({}))).toContain('This component can');
  });
});
