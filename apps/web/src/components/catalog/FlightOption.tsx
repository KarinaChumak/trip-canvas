import { Fragment, Suspense, lazy } from 'react';
import { PlaneIcon, PlaneLandingIcon, PlaneTakeoffIcon } from 'lucide-react';
import type { FlightLegData, FlightOptionData } from '@trip-canvas/catalog';
import { getLayovers } from '@trip-canvas/catalog/flight-utils';
import { Badge } from '@/components/shadcn/badge';
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/shadcn/item';
import { Separator } from '@/components/shadcn/separator';
import { cn } from '@/lib/utils';
import { daysBetween, formatDay, formatDuration, formatPrice } from '@/lib/formatting-utils';

// The airport dataset behind the city is ~300 KB gzipped, so it loads on the first layover shown.
const LayoverCity = lazy(() => import('./LayoverCity').then(({ LayoverCity }) => ({ default: LayoverCity })));

type FlightOptionProps = {
  flight: FlightOptionData;
  recommended: boolean;
};

/**
 * One fare of a FlightList: a timeline row per leg, as on a booking site, and the price.
 * "Recommended" sits on the card's top-right corner, so it takes no width from the legs
 * and every fare's rows line up with the fares around it.
 */
export function FlightOption({ flight, recommended }: FlightOptionProps) {
  const { price, inbound } = flight;

  return (
    <Item variant={recommended ? 'outline' : 'muted'} size="sm" className={cn('relative items-start', recommended && 'pt-4')}>
      {recommended && <Badge className="absolute -top-2.5 right-3 px-3">Recommended</Badge>}
      {/* A round trip tags each leg with its direction and day; one way, the card's header has the day. */}
      <ItemContent className="gap-3">
        <FlightLegRow leg={flight.outbound} direction={inbound ? 'outbound' : null} />
        {inbound && <FlightLegRow leg={inbound} direction="return" />}
      </ItemContent>
      <ItemActions className="flex-col items-end gap-1">
        <ItemTitle className="text-base">{formatPrice(price.amount, price.currency)}</ItemTitle>
        {!price.verified && <Badge variant="outline">unverified</Badge>}
      </ItemActions>
    </Item>
  );
}

const DIRECTIONS = {
  outbound: { label: 'Outbound', Icon: PlaneTakeoffIcon, className: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' },
  return: { label: 'Return', Icon: PlaneLandingIcon, className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
};

type FlightLegRowProps = {
  leg: FlightLegData;
  /** Which leg of a round trip this is; null for a one-way fare. */
  direction: keyof typeof DIRECTIONS | null;
};

/**
 * "20:30 FRA ——•—— 06:45+2 BKK": departure, the flight time on a line with a dot per
 * stop, and arrival; under the line each stop with its wait, e.g. "1 stop MCT · 16 h".
 */
function FlightLegRow({ leg, direction }: FlightLegRowProps) {
  // "+1" for an overnight arrival, as on a departures board.
  const daysLater = daysBetween(leg.departureDate, leg.arrivalDate);
  const layovers = getLayovers(leg.segments);
  const flights = leg.segments.map((segment) => segment.flight).join(', ');
  const tag = direction && DIRECTIONS[direction];

  return (
    <ItemContent className="gap-1">
      {tag && (
        <Badge className={tag.className}>
          <tag.Icon data-icon="inline-start" aria-hidden />
          {tag.label} · {formatDay(leg.departureDate)}
        </Badge>
      )}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <AirportTime time={leg.departureTime} airport={leg.from} daysLater={0} />
        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <span>{formatDuration(leg.durationMinutes)}</span>
          <div className="flex w-full items-center gap-1" aria-hidden>
            <Separator className="flex-1" />
            {leg.segments.slice(1).map((segment) => (
              <Fragment key={segment.flight}>
                <span className="size-1.5 rounded-full bg-primary" />
                <Separator className="flex-1" />
              </Fragment>
            ))}
            <PlaneIcon className="size-3.5" />
          </div>
          {leg.stops === 0 ? (
            <span>Direct</span>
          ) : (
            <span className="text-primary">
              {leg.stops} {leg.stops === 1 ? 'stop' : 'stops'}{' '}
              {layovers.map(({ airport, minutes }, index) => (
                <Fragment key={`${airport}-${index}`}>
                  {index > 0 && ', '}
                  <LayoverStop airport={airport} minutes={minutes} />
                </Fragment>
              ))}
            </span>
          )}
        </div>
        <AirportTime time={leg.arrivalTime} airport={leg.to} daysLater={daysLater} />
      </div>
      <ItemDescription className="text-xs">{[leg.carrier, flights].filter(Boolean).join(' · ')}</ItemDescription>
    </ItemContent>
  );
}

type LayoverStopProps = {
  airport: string;
  minutes: number;
};

/** "SHJ (Sharjah) · 13 h 45 min"; just the code until the city dataset has loaded. */
function LayoverStop({ airport, minutes }: LayoverStopProps) {
  return (
    <>
      {airport}
      <Suspense fallback={null}>
        <LayoverCity airport={airport} />
      </Suspense>{' '}
      · {formatDuration(minutes)}
    </>
  );
}

type AirportTimeProps = {
  time: string;
  airport: string;
  /** Days after the leg's departure day; 0 shows no marker. */
  daysLater: number;
};

/** A time over its airport code, with "+1" when it falls on a later day. */
function AirportTime({ time, airport, daysLater }: AirportTimeProps) {
  return (
    <div className="flex flex-col">
      <span className="text-base font-semibold tabular-nums">
        {time}
        {daysLater > 0 && <sup className="ml-0.5 text-xs font-normal text-muted-foreground">+{daysLater}</sup>}
      </span>
      <span className="text-xs text-muted-foreground">{airport}</span>
    </div>
  );
}
