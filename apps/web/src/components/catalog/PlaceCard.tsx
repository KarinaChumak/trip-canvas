import { ExternalLinkIcon, MapPinIcon, StarIcon } from 'lucide-react';
import type { PlaceCardData } from '@trip-canvas/catalog';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
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

/** Renders only what the agent sent: searchPlaces already returned every field it shows. */
export function PlaceCard({ place }: PlaceCardProps) {
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
