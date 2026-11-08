import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { z } from 'zod';

// Strict objects with `.nullable()` instead of `.optional()`: strict tool schemas need
// closed objects with every property required, so "no value" is an explicit null.

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const ClockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM, 24-hour');

const PlaceCardData = z.strictObject({
  name: z.string().min(1),
  placeId: z
    .string()
    .min(1)
    .nullable()
    .describe('The id from searchPlaces, kept with the card; the card loads nothing itself'),
  category: z.string().min(1).describe('Short kind of place, e.g. "Museum", "Café", "Viewpoint"'),
  description: z.string().nullable().describe('One or two sentences on why it is worth a visit'),
  address: z.string().nullable(),
  rating: z.number().min(0).max(5).nullable().describe('Average rating out of 5'),
  url: z.url().nullable().describe('Official website or listing'),
});

const WeatherCondition = z.enum(['sunny', 'partly-cloudy', 'cloudy', 'rain', 'storm', 'snow', 'fog']);

const WeatherStripData = z.strictObject({
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

const DayItineraryData = z.strictObject({
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

const MapViewData = z.strictObject({
  title: z.string().min(1).describe('e.g. "Sights in Alfama"'),
  places: z
    .array(
      z.strictObject({
        name: z.string().min(1),
        category: z.string().min(1),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }),
    )
    .min(1)
    .max(20)
    .describe('Coordinates copied from geocode or searchPlaces results, never guessed'),
});

const TransitMode = z.enum(['train', 'metro', 'tram', 'bus', 'ferry', 'other']);

const ConnectionOptionData = z.strictObject({
  from: z.string().min(1).describe('Station or stop the trip starts at'),
  to: z.string().min(1),
  departureDate: IsoDate.describe('Local date at the start'),
  departureTime: ClockTime.describe('Local time at the start'),
  arrivalDate: IsoDate.describe('Local date at the end; later than departureDate overnight'),
  arrivalTime: ClockTime.describe('Local time at the end'),
  durationMinutes: z.number().int().positive(),
  segments: z
    .array(
      z.strictObject({
        mode: TransitMode,
        line: z.string().min(1).nullable().describe('e.g. "ICE 1003", "7 (Special Express)"'),
        from: z.string().min(1),
        to: z.string().min(1),
        departureTime: ClockTime,
        arrivalTime: ClockTime,
        headsign: z.string().min(1).nullable().describe('Where the vehicle is heading'),
      }),
    )
    .min(1)
    .max(8)
    .describe('One segment per vehicle, in order; one segment means a direct connection'),
});

const ConnectionListData = z.strictObject({
  title: z.string().min(1).describe('The direction without the date, which the card shows: e.g. "Outbound: Nuremberg → Berlin"'),
  options: z.array(ConnectionOptionData).min(1).max(10).describe("findConnections' connections, copied as is"),
  recommendedIndex: z
    .number()
    .int()
    .min(0)
    .nullable()
    .describe('Index in options of the one that fits the request best; it is shown first. null for no preference'),
});

/** Catalog components: Zod props plus the one-line description the model sees. */
export const components = {
  PlaceCard: {
    props: PlaceCardData,
    description: 'A single place to visit, eat or drink, with its category; it shows only the props it is given.',
  },
  WeatherStrip: {
    props: WeatherStripData,
    description: 'A daily forecast for one location over one to fourteen days.',
  },
  DayItinerary: {
    props: DayItineraryData,
    description: 'A timed plan for one day in one city, as an ordered list of stops.',
  },
  MapView: {
    props: MapViewData,
    description: 'A map with a pin per place, for places whose coordinates came from a tool.',
  },
  ConnectionList: {
    props: ConnectionListData,
    description: 'Train, bus or ferry connections for one direction from findConnections; one list per direction.',
  },
} as const;

export type ComponentName = keyof typeof components;
// The data each component shows; the web app's components take it as one prop.
export type PlaceCardData = z.infer<typeof PlaceCardData>;
export type WeatherStripData = z.infer<typeof WeatherStripData>;
export type DayItineraryData = z.infer<typeof DayItineraryData>;
export type MapViewData = z.infer<typeof MapViewData>;
export type ConnectionOptionData = z.infer<typeof ConnectionOptionData>;
export type ConnectionListData = z.infer<typeof ConnectionListData>;

/** The json-render catalog shared by the server (validation) and the web app (registry). */
export const catalog = defineCatalog(schema, { components, actions: {} });

export const componentNames = Object.keys(components) as ComponentName[];
