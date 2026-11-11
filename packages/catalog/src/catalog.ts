import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { z } from 'zod';

// Strict objects with `.nullable()` instead of `.optional()`: strict tool schemas need
// closed objects with every property required, so "no value" is an explicit null.

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const ClockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM, 24-hour');

/** What a place is, for the card's badge; searchPlaces groups Google's many types into these. */
export const PLACE_KINDS = ['museum', 'temple', 'nature', 'beach', 'viewpoint', 'food', 'cafe', 'nightlife', 'shopping', 'market', 'other'] as const;

export type PlaceKind = (typeof PLACE_KINDS)[number];

// "09:00-17:00", or several ranges: "11:00-14:00,17:00-22:00". An end before the start
// runs past midnight ("18:00-02:00"); 24:00 is midnight at the end of the day.
const HOURS_RANGE = '([01]\\d|2[0-3]):[0-5]\\d-(([01]\\d|2[0-3]):[0-5]\\d|24:00)';
const DayHours = z.string().regex(new RegExp(`^${HOURS_RANGE}(,${HOURS_RANGE})*$`), 'Expected HH:MM-HH:MM ranges joined by commas').nullable();

const PlaceCardData = z.strictObject({
  name: z.string().min(1),
  placeId: z
    .string()
    .min(1)
    .nullable()
    .describe('The id from searchPlaces, kept with the card; the card loads nothing itself'),
  category: z.string().min(1).describe('Short kind of place, e.g. "Museum", "Café"; searchPlaces\' category when it came from there'),
  kind: z.enum(PLACE_KINDS).nullable().describe('searchPlaces\' kind, copied as is; picks the badge icon; never invented'),
  description: z.string().nullable().describe('One or two sentences on why it is worth a visit'),
  address: z.string().nullable().describe('searchPlaces\' address, copied as is; never invented'),
  rating: z.number().min(0).max(5).nullable().describe('searchPlaces\' average rating out of 5, copied as is; never invented'),
  reviewCount: z.number().int().min(0).nullable().describe('searchPlaces\' reviewCount, copied as is; never invented'),
  priceLevel: z.number().int().min(0).max(4).nullable().describe('searchPlaces\' priceLevel, 0 (free) to 4, copied as is; never invented'),
  url: z.url().nullable().describe('searchPlaces\' url, copied as is; never invented'),
  hours: z
    .tuple([DayHours, DayHours, DayHours, DayHours, DayHours, DayHours, DayHours])
    .nullable()
    .describe('searchPlaces\' hours, copied as is: 7 days from Sunday, null on closed days; never invented'),
  utcOffsetMinutes: z.number().int().min(-720).max(840).nullable().describe('searchPlaces\' utcOffsetMinutes, copied as is; never invented'),
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
        placeId: z.string().min(1).nullable().describe("searchPlaces' id, copied as is; null for a stop not from searchPlaces"),
        latitude: z.number().min(-90).max(90).nullable().describe("searchPlaces' latitude, copied as is; never guessed"),
        longitude: z.number().min(-180).max(180).nullable().describe("searchPlaces' longitude, copied as is; never guessed"),
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

const Iata = z.string().regex(/^[A-Z]{3}$/, 'Expected a 3-letter IATA code');

const FlightLeg = z.strictObject({
  carrier: z.string().min(1).nullable().describe('Airline name, e.g. "AirAsia"'),
  from: Iata,
  to: Iata,
  departureDate: IsoDate.describe('Local date at the start'),
  departureTime: ClockTime.describe('Local time at the start'),
  arrivalDate: IsoDate.describe('Local date at the end'),
  arrivalTime: ClockTime.describe('Local time at the end'),
  durationMinutes: z.number().int().positive().describe('Including layovers'),
  stops: z.number().int().min(0),
  segments: z
    .array(
      z.strictObject({
        flight: z.string().min(1).describe('Carrier code and number, e.g. "FD 3433"'),
        operatingCarrier: z.string().min(1).nullable(),
        from: Iata,
        to: Iata,
        departureDate: IsoDate,
        departureTime: ClockTime,
        arrivalDate: IsoDate,
        arrivalTime: ClockTime,
        durationMinutes: z.number().int().positive(),
        aircraft: z.string().min(1).nullable(),
      }),
    )
    .min(1)
    .max(6)
    .describe('One segment per flight, in order'),
});

const FlightOptionData = z.strictObject({
  id: z.string().min(1).describe('The flight id from searchFlights'),
  price: z.strictObject({
    amount: z.number().nonnegative().describe('Total for all travellers and both legs'),
    currency: z.string().regex(/^[A-Z]{3}$/, 'Expected an ISO 4217 code'),
    verified: z.boolean(),
  }),
  cabinClass: z.string().min(1),
  outbound: FlightLeg,
  inbound: FlightLeg.nullable().describe('The return leg of a round-trip fare; null one way'),
});

const FlightListData = z.strictObject({
  title: z.string().min(1).describe('The route without the date, which the card shows: e.g. "Bangkok → Chiang Mai"'),
  options: z.array(FlightOptionData).max(10).describe("searchFlights' flights, copied as is"),
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
    description: 'A single place to visit, eat or drink, with its kind, rating, reviews, price level and opening hours from searchPlaces; it shows only the props it is given.',
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
  FlightList: {
    props: FlightListData,
    description: 'Flight fares from searchFlights for one direction, or for one round-trip search; prices are at search time.',
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
export type FlightLegData = z.infer<typeof FlightLeg>;
export type FlightOptionData = z.infer<typeof FlightOptionData>;
export type FlightListData = z.infer<typeof FlightListData>;

/** The json-render catalog shared by the server (validation) and the web app (registry). */
export const catalog = defineCatalog(schema, { components, actions: {} });

export const componentNames = Object.keys(components) as ComponentName[];
