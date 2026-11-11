import { Fragment } from 'react';
import {
  CalendarDaysIcon,
  CoffeeIcon,
  LandmarkIcon,
  LibraryBigIcon,
  MapPinIcon,
  MusicIcon,
  NavigationIcon,
  ShoppingBagIcon,
  TramFrontIcon,
  UtensilsIcon,
  type LucideIcon,
} from 'lucide-react';
import type { DayItineraryData } from '@trip-canvas/catalog';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shadcn/card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/shadcn/item';
import { formatDay, formatDuration } from '@/lib/formatting-utils';
import { buildWalkingDirectionsLinks } from '@/lib/google-maps-link-utils';
import { cn } from '@/lib/utils';

type StopKind = DayItineraryData['stops'][number]['kind'];

type KindStyle = {
  icon: LucideIcon;
  /** Full class strings, so Tailwind can find them. */
  tint: string;
};

const KIND_STYLES: Record<StopKind, KindStyle> = {
  sight: { icon: LandmarkIcon, tint: 'bg-secondary text-secondary-foreground' },
  museum: { icon: LibraryBigIcon, tint: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300' },
  food: { icon: UtensilsIcon, tint: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  coffee: { icon: CoffeeIcon, tint: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300' },
  shopping: { icon: ShoppingBagIcon, tint: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  nightlife: { icon: MusicIcon, tint: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
  transport: { icon: TramFrontIcon, tint: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  other: { icon: MapPinIcon, tint: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-400/15 dark:text-yellow-300' },
};

type DayItineraryProps = {
  day: DayItineraryData;
};

export function DayItinerary({ day }: DayItineraryProps) {
  const subtitle = day.date ? `${day.city} · ${formatDay(day.date)}` : day.city;
  const directionsLinks = buildWalkingDirectionsLinks(day.stops);

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>{day.title}</CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          <CalendarDaysIcon className="size-3.5 text-primary" aria-hidden />
          {subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* No group gap: the separators already space the stops. */}
        <ItemGroup className="gap-0">
          {day.stops.map((stop, i) => {
            const { icon: Icon, tint } = KIND_STYLES[stop.kind];
            return (
              <Fragment key={stop.id}>
                {i > 0 && <ItemSeparator />}
                <Item size="sm">
                  <ItemMedia variant="icon" className={cn('size-8 rounded-md', tint)}>
                    <Icon aria-label={stop.kind} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{stop.title}</ItemTitle>
                    {stop.note && <ItemDescription>{stop.note}</ItemDescription>}
                  </ItemContent>
                  <ItemActions>
                    {stop.durationMinutes !== null && (
                      <ItemDescription>{formatDuration(stop.durationMinutes)}</ItemDescription>
                    )}
                    <Badge variant="secondary">{stop.time}</Badge>
                  </ItemActions>
                </Item>
              </Fragment>
            );
          })}
        </ItemGroup>
      </CardContent>
      {directionsLinks.length > 0 && (
        // Hands the walk to the Google Maps app, which navigates and tracks the location.
        // A long day needs two links, named by the times they cover.
        <CardFooter className="flex-wrap gap-2">
          {directionsLinks.map((link) => (
            <Button key={link.from.id} asChild size="sm" variant="outline">
              <a href={link.url} target="_blank" rel="noreferrer">
                <NavigationIcon aria-hidden />
                {directionsLinks.length === 1 ? 'Open in Google Maps' : `Google Maps · ${link.from.time}–${link.to.time}`}
              </a>
            </Button>
          ))}
        </CardFooter>
      )}
    </Card>
  );
}
