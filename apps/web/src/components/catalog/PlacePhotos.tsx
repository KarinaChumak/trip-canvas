import { useCallback, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/shadcn/carousel';
import { Skeleton } from '@/components/shadcn/skeleton';
import { usePlacePhotoQuery } from '@/hooks/usePlacePhotoQuery';

// Twice the card's width, for sharp photos on high-density screens.
const PHOTO_WIDTH = 800;

type PlacePhotosProps = {
  placeId: string;
  className?: string;
};

/**
 * A place's photos from Google. Only the first loads at once; each further one loads
 * when the carousel's `select` event reaches it, since every photo is billed (D-050).
 * Without a photo, or when it fails, nothing shows.
 */
export function PlacePhotos({ placeId, className }: PlacePhotosProps) {
  const { data: first, isPending } = usePlacePhotoQuery(placeId, 0, PHOTO_WIDTH);
  // The furthest slide the user has moved to.
  const [furthest, setFurthest] = useState(0);
  // Stable, so the carousel calls it once and the listener is added once.
  const setApi = useCallback((api: CarouselApi) => {
    api?.on('select', () => setFurthest((seen) => Math.max(seen, api.selectedScrollSnap())));
  }, []);

  if (isPending) {
    return (
      <div className={className}>
        <Skeleton className="aspect-4/3 w-full" aria-label="Loading photo" />
      </div>
    );
  }
  if (!first) return null;

  return (
    <div className={className}>
      <Carousel setApi={setApi} aria-label="Photos">
        <CarouselContent>
          {Array.from({ length: first.count }, (_, index) => (
            <CarouselItem key={index}>
              <PlacePhoto placeId={placeId} index={index} enabled={index <= furthest} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {first.count > 1 && <CarouselPrevious className="left-2" />}
        {first.count > 1 && <CarouselNext className="right-2" />}
      </Carousel>
    </div>
  );
}

type PlacePhotoProps = {
  placeId: string;
  index: number;
  enabled: boolean;
};

/** One slide: the photo with its author, as Google requires. */
function PlacePhoto({ placeId, index, enabled }: PlacePhotoProps) {
  const { data, isPending } = usePlacePhotoQuery(placeId, index, PHOTO_WIDTH, enabled);

  if (isPending) return <Skeleton className="aspect-4/3 w-full" />;
  if (!data) return <div className="flex aspect-4/3 w-full items-center justify-center rounded-md bg-muted text-muted-foreground">Photo unavailable</div>;

  return (
    <figure className="flex flex-col gap-1">
      <img src={data.photoUri} alt="" className="aspect-4/3 w-full rounded-md object-cover" />
      {data.author && (
        <figcaption className="text-xs text-muted-foreground">
          {data.author.url ? (
            <a href={data.author.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
              Photo: {data.author.name}
            </a>
          ) : (
            `Photo: ${data.author.name}`
          )}
        </figcaption>
      )}
    </figure>
  );
}
