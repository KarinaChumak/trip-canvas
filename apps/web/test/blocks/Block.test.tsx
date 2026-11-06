import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { EmitComponentInput } from 'catalog/schema';
import { Block } from '@/blocks/Block';

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
    expect(renderToStaticMarkup(<Block input={place} />)).toContain('MAAT');
  });

  it('falls back for a component the catalog no longer has', () => {
    const html = renderToStaticMarkup(<Block input={stale({ component: { type: 'OldWidget', props: {} } })} />);
    expect(html).toContain('This OldWidget can');
  });

  it('falls back for props that no longer match the catalog', () => {
    const input = stale({ component: { ...place.component, props: { ...place.component.props, rating: 'five' } } });
    const html = renderToStaticMarkup(<Block input={input} />);

    expect(html).toContain('This PlaceCard can');
    expect(html).not.toContain('MAAT');
  });

  it('falls back for input without a component at all', () => {
    expect(renderToStaticMarkup(<Block input={stale({})} />)).toContain('This component can');
  });
});
