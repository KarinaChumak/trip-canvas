import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PlaceCardData } from '@trip-canvas/catalog';
import { PlaceCard } from '@/components/catalog/PlaceCard';

/** The same hours on all 7 days. */
const everyDay = (day: string): NonNullable<PlaceCardData['hours']> => [day, day, day, day, day, day, day];

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
  hours: null,
  utcOffsetMinutes: null,
};

// Lisbon is on UTC+0 in winter; 13 Nov 2026 is a Friday.
const FRIDAY_NOON = new Date('2026-11-13T12:00:00Z');
const LUNCH_AND_DINNER = everyDay('11:00-14:00,17:00-22:00');

const render = (place: PlaceCardData, now = FRIDAY_NOON) => renderToStaticMarkup(<PlaceCard place={place} now={now} />);

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

  it("shows open now with today's hours", () => {
    const html = render({ ...CUNHA, hours: LUNCH_AND_DINNER, utcOffsetMinutes: 0 });
    expect(html).toContain('Open now');
    expect(html).toContain('Today 11:00–14:00, 17:00–22:00');
  });

  it('shows closed between ranges, and on a day with no hours', () => {
    expect(render({ ...CUNHA, hours: LUNCH_AND_DINNER, utcOffsetMinutes: 0 }, new Date('2026-11-13T15:00:00Z'))).toContain('Closed');
    const html = render({ ...CUNHA, hours: [null, '09:00-17:00', '09:00-17:00', '09:00-17:00', '09:00-17:00', null, null], utcOffsetMinutes: 0 });
    expect(html).toContain('Closed');
    expect(html).toContain('Closed today');
  });

  it('shows open 24 hours as such', () => {
    const html = render({ ...CUNHA, hours: everyDay('00:00-24:00'), utcOffsetMinutes: 0 });
    expect(html).toContain('Open now');
    expect(html).toContain('Open 24 hours');
  });

  it('shows no opening state without hours or an offset', () => {
    for (const place of [CUNHA, { ...CUNHA, hours: LUNCH_AND_DINNER }]) {
      const html = render(place);
      for (const text of ['Open now', 'Closed', 'Today']) expect(html).not.toContain(text);
    }
  });

  it('labels the kind badge with the category, and falls back to other without a kind', () => {
    expect(render(CUNHA)).toContain('data-kind="cafe"');
    expect(render(CUNHA)).toContain('Café');
    expect(render({ ...CUNHA, kind: null })).toContain('data-kind="other"');
  });
});
