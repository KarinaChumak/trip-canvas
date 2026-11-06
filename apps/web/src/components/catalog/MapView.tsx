import { lazy, Suspense } from 'react';
import type { MapViewData } from 'catalog';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Skeleton } from '@/components/shadcn/skeleton';

// MapLibre is large, so it loads only when a map is first shown.
const PlacesMap = lazy(() => import('./PlacesMap').then(({ PlacesMap }) => ({ default: PlacesMap })));

type MapViewProps = {
  map: MapViewData;
};

export function MapView({ map }: MapViewProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{map.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-72 w-full" />}>
          <PlacesMap places={map.places} />
        </Suspense>
      </CardContent>
      {/* OpenFreeMap's tiles are built with OpenMapTiles from OpenStreetMap data, which both ask for this credit. */}
      <CardFooter>
        <Button asChild size="sm" variant="link" className="h-auto px-0 text-muted-foreground">
          <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">
            OpenFreeMap © OpenMapTiles · Data © OpenStreetMap contributors
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
