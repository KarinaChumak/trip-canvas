import { ClockIcon, ExternalLinkIcon, MapPinIcon, StarIcon } from 'lucide-react';
import type { PlaceCardData } from '@trip-canvas/catalog';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { hoursToday, isOpenAt } from '@/lib/opening-hours-utils';
import { PlaceKindBadge } from './PlaceKindBadge';
import { SourceCredit } from './SourceCredit';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';

// Google's price levels, 0 to 4: what a screen reader hears instead of the dollar signs.
const PRICE_LABELS = ['Free', 'Inexpensive', 'Moderate price', 'Expensive', 'Very expensive'];

type PlaceCardProps = {
  place: PlaceCardData;
};

/** "11:00-14:00,17:00-22:00" → "Today 11:00–14:00, 17:00–22:00"; null → "Closed today". */
function formatToday(day: string | null): string {
  if (day === null) return 'Closed today';
  return day === '00:00-24:00' ? 'Open 24 hours' : `Today ${day.replaceAll('-', '–').replaceAll(',', ', ')}`;
}

/** Renders only what the agent sent: searchPlaces already returned every field it shows. */
export function PlaceCard({ place }: PlaceCardProps) {
  const now = new Date();
  const open = isOpenAt(place.hours, place.utcOffsetMinutes, now);
  const today = hoursToday(place.hours, place.utcOffsetMinutes, now);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{place.name}</CardTitle>
        {place.address && (
          <CardDescription className="flex items-center gap-1.5">
            <MapPinIcon className="size-3.5 shrink-0 text-primary" aria-hidden />
            {place.address}
          </CardDescription>
        )}
        <CardAction className="flex items-center gap-1">
          {place.rating !== null && (
            <Badge
              className="bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"
              aria-label={
                place.reviewCount === null
                  ? `Rated ${place.rating} out of 5`
                  : `Rated ${place.rating} out of 5 from ${place.reviewCount.toLocaleString('en-US')} reviews`
              }
            >
              <StarIcon data-icon="inline-start" className="fill-amber-400 text-amber-500" />
              {place.rating.toFixed(1)}
              {place.reviewCount !== null && ` (${place.reviewCount.toLocaleString('en-US')})`}
            </Badge>
          )}
          {/* Google's terms require this credit wherever its place data is shown. */}
          <SourceCredit credit="Google Maps" href="https://www.google.com/maps" />
        </CardAction>
      </CardHeader>
      {place.description && <CardContent>{place.description}</CardContent>}
      <CardFooter className="flex-wrap gap-1">
        <PlaceKindBadge kind={place.kind ?? 'other'} label={place.category} />
        {place.priceLevel !== null && (
          <Badge variant="outline" aria-label={PRICE_LABELS[place.priceLevel]}>
            {place.priceLevel === 0 ? 'Free' : '$'.repeat(place.priceLevel)}
          </Badge>
        )}
        {open !== null && (
          <Badge
            className={
              open
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300'
            }
          >
            <ClockIcon data-icon="inline-start" />
            {open ? 'Open now' : 'Closed'}
          </Badge>
        )}
        {open !== null && (
          <span className="text-xs text-muted-foreground">{formatToday(today)}</span>
        )}
        {place.url && (
          <Button asChild size="sm" variant="link" className="ml-auto">
            <a href={place.url} target="_blank" rel="noreferrer">
              Website
              <ExternalLinkIcon data-icon="inline-end" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
