import { ExternalLinkIcon, MapPinIcon, StarIcon, TagIcon } from 'lucide-react';
import type { PlaceCardData } from '@trip-canvas/catalog';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
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
              aria-label={`Rated ${place.rating} out of 5`}
            >
              <StarIcon data-icon="inline-start" className="fill-amber-400 text-amber-500" />
              {place.rating.toFixed(1)}
            </Badge>
          )}
          {/* Google's terms require this credit wherever its place data is shown. */}
          <SourceCredit credit="Google Maps" href="https://www.google.com/maps" />
        </CardAction>
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
    </Card>
  );
}
