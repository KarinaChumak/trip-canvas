import { describe, expect, it } from 'vitest';
import { validateEmitComponent } from 'catalog/schema';
import { mockDay } from '../../src/tools/mock-day.js';

describe('mockDay', () => {
  it.each(['Lisbon', 'Porto'])('returns stops for %s that fit a DayItinerary', (city) => {
    const day = mockDay(city);
    const stops = day.stops.map((stop, i) => ({ ...stop, id: `s${i + 1}` }));
    const input = { component: { type: 'DayItinerary', props: { title: `A day in ${city}`, city, date: null, stops } } };

    expect(validateEmitComponent(input)).toMatchObject({ ok: true });
  });
});
