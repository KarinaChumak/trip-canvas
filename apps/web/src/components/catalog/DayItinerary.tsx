import { Fragment } from 'react';
import {
  CalendarDaysIcon,
  CoffeeIcon,
  LandmarkIcon,
  LibraryBigIcon,
  MapPinIcon,
  MusicIcon,
  ShoppingBagIcon,
  TramFrontIcon,
  UtensilsIcon,
  type LucideIcon,
} from 'lucide-react';
import type { DayItineraryData } from '@trip-canvas/catalog';
import { Badge } from '@/components/shadcn/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
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
import { formatDay, formatDuration } from '@/lib/format';
import { cn } from '@/lib/utils';

type StopKind = DayItineraryData['stops'][number]['kind'];

type KindStyle = {
  icon: LucideIcon;
  /** Full class strings, so Tailwind can find them. */
  tint: string;
};

const KIND_STYLES: Record<StopKind, KindStyle> = {
  sight: { icon: LandmarkIcon, tint: 'bg-kind-sight text-kind-sight-foreground' },
  museum: { icon: LibraryBigIcon, tint: 'bg-kind-museum text-kind-museum-foreground' },
  food: { icon: UtensilsIcon, tint: 'bg-kind-food text-kind-food-foreground' },
  coffee: { icon: CoffeeIcon, tint: 'bg-kind-coffee text-kind-coffee-foreground' },
  shopping: { icon: ShoppingBagIcon, tint: 'bg-kind-shopping text-kind-shopping-foreground' },
  nightlife: { icon: MusicIcon, tint: 'bg-kind-nightlife text-kind-nightlife-foreground' },
  transport: { icon: TramFrontIcon, tint: 'bg-kind-transport text-kind-transport-foreground' },
  other: { icon: MapPinIcon, tint: 'bg-kind-other text-kind-other-foreground' },
};

type DayItineraryProps = {
  day: DayItineraryData;
};

export function DayItinerary({ day }: DayItineraryProps) {
  const subtitle = day.date ? `${day.city} · ${formatDay(day.date)}` : day.city;

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
    </Card>
  );
}
