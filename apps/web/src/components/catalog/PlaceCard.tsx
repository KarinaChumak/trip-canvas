import { ExternalLinkIcon, StarIcon } from 'lucide-react';
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
        {place.address && <CardDescription>{place.address}</CardDescription>}
        {place.rating !== null && (
          <CardAction>
            <Badge variant="secondary" aria-label={`Rated ${place.rating} out of 5`}>
              <StarIcon data-icon="inline-start" />
              {place.rating.toFixed(1)}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      {place.description && <CardContent>{place.description}</CardContent>}
      <CardFooter className="justify-between gap-2">
        <Badge variant="outline">{place.category}</Badge>
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
