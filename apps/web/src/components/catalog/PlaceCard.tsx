import { ExternalLinkIcon, MapPinIcon, StarIcon, TagIcon } from 'lucide-react';
import type { PlaceCardData } from 'catalog';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Skeleton } from '@/components/shadcn/skeleton';
import { usePlaceDetailsQuery } from '@/lib/place-details';
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
export function PlaceCard({ place }: PlaceCardProps) {
  if (place.placeId === null) return <PlaceCardView place={place} loadingDetails={false} />;
  return <PlaceCardWithDetails place={place} placeId={place.placeId} />;
}

type PlaceCardWithDetailsProps = {
  place: PlaceCardData;
  placeId: string;
};

function PlaceCardWithDetails({ place, placeId }: PlaceCardWithDetailsProps) {
  // On an error the card just stays without details.
  const { data, isPending } = usePlaceDetailsQuery(placeId);
  const withDetails: PlaceCardData = {
    ...place,
    address: place.address ?? data?.address ?? null,
    description: place.description ?? data?.description ?? null,
    url: place.url ?? data?.url ?? null,
  };
  return <PlaceCardView place={withDetails} loadingDetails={isPending} />;
}

type PlaceCardViewProps = {
  place: PlaceCardData;
  loadingDetails: boolean;
};

function PlaceCardView({ place, loadingDetails }: PlaceCardViewProps) {
  return (
    <Card className="w-full max-w-md" aria-busy={loadingDetails}>
      <CardHeader>
        <CardTitle>{place.name}</CardTitle>
        {loadingDetails && <Skeleton className="h-4 w-48" />}
        {place.address && (
          <CardDescription className="flex items-center gap-1.5">
            <MapPinIcon className="size-3.5 shrink-0 text-primary" aria-hidden />
            {place.address}
          </CardDescription>
        )}
        {place.rating !== null && (
          <CardAction>
            <Badge
              className="bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"
              aria-label={`Rated ${place.rating} out of 5`}
            >
              <StarIcon data-icon="inline-start" className="fill-amber-400 text-amber-500" />
              {place.rating.toFixed(1)}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      {loadingDetails && (
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
      {/* OpenTripMap's data is under ODbL and built on OpenStreetMap, which asks for this credit. */}
      <CardFooter>
        <Button asChild size="sm" variant="link" className="px-0 text-muted-foreground">
          <a href="https://opentripmap.com/" target="_blank" rel="noreferrer">
            Places by OpenTripMap · © OpenStreetMap contributors
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
