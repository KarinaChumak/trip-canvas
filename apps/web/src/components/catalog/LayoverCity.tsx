import { UnknownAirportError } from 'airport-utils/errors';
import { getAirportInfo } from 'airport-utils/info';

type LayoverCityProps = {
  airport: string;
};

/**
 * " (Sharjah)" after a stop airport's code, so the traveller sees which country the connection
 * goes through; nothing for a code the dataset doesn't know, e.g. the metro code "LON". Ignav sends
 * only IATA codes; the cities come from airport-utils (OurAirports data). Its dataset is large, so
 * FlightOption loads this component lazily, keeping it out of the main bundle.
 */
export function LayoverCity({ airport }: LayoverCityProps) {
  const city = findAirportCity(airport);
  return city && ` (${city})`;
}

/** The city an airport serves, or null when the dataset doesn't know the code. */
function findAirportCity(code: string): string | null {
  try {
    return getAirportInfo(code.toUpperCase()).city || null;
  } catch (error) {
    // Anything else is a real bug, e.g. a broken dataset, so it shouldn't pass for an unknown code.
    if (error instanceof UnknownAirportError) return null;
    throw error;
  }
}
