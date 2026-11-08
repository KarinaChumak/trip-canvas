import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PLACE_KINDS } from '@trip-canvas/catalog';
import { PlaceKindBadge } from '@/components/catalog/PlaceKindBadge';

describe('PlaceKindBadge', () => {
  it('shows the label, not the kind', () => {
    const html = renderToStaticMarkup(<PlaceKindBadge kind="food" label="Thai restaurant" />);
    expect(html).toContain('Thai restaurant');
    expect(html).toContain('data-kind="food"');
  });

  it('gives every kind its own icon and tint', () => {
    const icons = new Set<string>();
    const tints = new Set<string>();
    for (const kind of PLACE_KINDS) {
      const html = renderToStaticMarkup(<PlaceKindBadge kind={kind} label={kind} />);
      icons.add(html.match(/lucide-([a-z-]+)/)![1]!);
      tints.add(html.match(/class="([^"]+)"/)![1]!);
    }
    expect(icons.size).toBe(PLACE_KINDS.length);
    expect(tints.size).toBe(PLACE_KINDS.length);
  });
});
