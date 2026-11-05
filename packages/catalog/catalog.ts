import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { z } from 'zod';

// Strict objects with `.nullable()` instead of `.optional()`: strict tool schemas need
// closed objects with every property required, so "no value" is an explicit null.

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const ClockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM, 24-hour');

const PlaceCardProps = z.strictObject({
  name: z.string().min(1),
  category: z.string().min(1).describe('Short kind of place, e.g. "Museum", "Café", "Viewpoint"'),
  description: z.string().nullable().describe('One or two sentences on why it is worth a visit'),
  address: z.string().nullable(),
  rating: z.number().min(0).max(5).nullable().describe('Average rating out of 5'),
  url: z.url().nullable().describe('Official website or listing'),
});

const WeatherCondition = z.enum(['sunny', 'partly-cloudy', 'cloudy', 'rain', 'storm', 'snow', 'fog']);

const WeatherStripProps = z.strictObject({
  location: z.string().min(1),
  unit: z.enum(['C', 'F']),
  days: z
    .array(
      z.strictObject({
        date: IsoDate,
        condition: WeatherCondition,
        high: z.number(),
        low: z.number(),
        precipitationChance: z.number().min(0).max(100).nullable().describe('Percent'),
      }),
    )
    .min(1)
    .max(14),
});

const StopKind = z.enum(['sight', 'museum', 'food', 'coffee', 'shopping', 'nightlife', 'transport', 'other']);

const DayItineraryProps = z.strictObject({
  title: z.string().min(1).describe('e.g. "A day in Alfama"'),
  city: z.string().min(1),
  date: IsoDate.nullable().describe('null when the user gave no date'),
  stops: z
    .array(
      z.strictObject({
        id: z.string().min(1).describe('Unique within the itinerary, e.g. "s1"'),
        time: ClockTime.describe('Start time'),
        title: z.string().min(1),
        kind: StopKind,
        durationMinutes: z.number().int().positive().nullable(),
        note: z.string().nullable().describe('A short tip, e.g. "Book ahead"'),
      }),
    )
    .min(1)
    .max(12),
});

/** Catalog components: Zod props plus the one-line description the model sees. */
export const components = {
  PlaceCard: {
    props: PlaceCardProps,
    description: 'A single place to visit, eat or drink, with category, rating and a short pitch.',
  },
  WeatherStrip: {
    props: WeatherStripProps,
    description: 'A daily forecast for one location over one to fourteen days.',
  },
  DayItinerary: {
    props: DayItineraryProps,
    description: 'A timed plan for one day in one city, as an ordered list of stops.',
  },
} as const;

export type ComponentName = keyof typeof components;
export type PlaceCardProps = z.infer<typeof PlaceCardProps>;
export type WeatherStripProps = z.infer<typeof WeatherStripProps>;
export type DayItineraryProps = z.infer<typeof DayItineraryProps>;

/** The json-render catalog shared by the server (validation) and the web app (registry). */
export const catalog = defineCatalog(schema, { components, actions: {} });

export const componentNames = Object.keys(components) as ComponentName[];
