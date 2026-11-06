import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlockErrorBoundary } from '@/blocks/BlockErrorBoundary';

// Server rendering never runs error boundaries, so the caught state is checked directly.
describe('BlockErrorBoundary', () => {
  it('renders its children while nothing has failed', () => {
    const html = renderToStaticMarkup(
      <BlockErrorBoundary type="MapView">
        <p>map</p>
      </BlockErrorBoundary>,
    );
    expect(html).toBe('<p>map</p>');
  });

  it('switches to the fallback once a child throws', () => {
    expect(BlockErrorBoundary.getDerivedStateFromError()).toEqual({ failed: true });

    const boundary = new BlockErrorBoundary({ type: 'MapView', children: null });
    boundary.state = { failed: true };
    const html = renderToStaticMarkup(boundary.render());
    expect(html).toContain('This MapView can');
    expect(html).toContain('Something went wrong while showing it.');
  });
});
