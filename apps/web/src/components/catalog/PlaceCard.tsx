import { ExternalLinkIcon, MapPinIcon, StarIcon, TagIcon } from 'lucide-react';
import type { PlaceCardData } from '@trip-canvas/catalog';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Skeleton } from '@/components/shadcn/skeleton';
import { usePlaceDetailsQuery } from '@/hooks/usePlaceDetailsQuery';
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

type PlaceCardProps = {
  place: PlaceCardData;
};

/**
 * Renders at once from what the agent sent. A card with a `placeId` then loads its
 * address, description and website, so the agent's turn never waits for them.
 */
export function PlaceCard({ place: sent }: PlaceCardProps) {
  // `isLoading`, not `isPending`: a skipped query (no placeId) stays pending forever.
  // On an error the card just stays without details.
  const { data, isLoading } = usePlaceDetailsQuery(sent.placeId);
  // What the agent sent wins over what was loaded.
  const place: PlaceCardData = {
    ...sent,
    address: sent.address ?? data?.address ?? null,
    description: sent.description ?? data?.description ?? null,
    url: sent.url ?? data?.url ?? null,
  };

  return (
    <Card className="w-full max-w-md" aria-busy={isLoading}>
      <CardHeader>
        <CardTitle>{place.name}</CardTitle>
        {isLoading && <Skeleton className="h-4 w-48" />}
        {place.address && (
          <CardDescription className="flex items-center gap-1.5">
            <MapPinIcon className="size-3.5 shrink-0 text-primary" aria-hidden />
            {place.address}
          </CardDescription>
        )}
        <CardAction className="flex items-center gap-1">
          {place.rating !== null && (
            <Badge
              className="bg-rating text-rating-foreground"
              aria-label={`Rated ${place.rating} out of 5`}
            >
              <StarIcon data-icon="inline-start" className="fill-rating-star text-rating-star" />
              {place.rating.toFixed(1)}
            </Badge>
          )}
          {/* OpenTripMap's data is under ODbL and built on OpenStreetMap, which asks for this credit. */}
          <SourceCredit credit="Places by OpenTripMap · © OpenStreetMap contributors" href="https://opentripmap.com/" />
        </CardAction>
      </CardHeader>
      {isLoading && (
        <CardContent className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      )}
      {place.description && <CardContent>{place.description}</CardContent>}
      <CardFooter className="justify-between gap-2">
        <Badge variant="secondary">
          <TagIcon data-icon="inline-start" />
          {place.category}
        </Badge>
        {place.url && (
          <Button asChild size="sm" variant="link">
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
