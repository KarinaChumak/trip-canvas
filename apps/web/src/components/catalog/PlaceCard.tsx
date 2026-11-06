import { ExternalLinkIcon, MapPinIcon, StarIcon, TagIcon } from 'lucide-react';
import type { PlaceCardData } from 'catalog';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
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
        {place.rating !== null && (
          <CardAction>
            <Badge
              className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              aria-label={`Rated ${place.rating} out of 5`}
            >
              <StarIcon data-icon="inline-start" className="fill-amber-400 text-amber-500" />
              {place.rating.toFixed(1)}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
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
