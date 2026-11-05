import { Fragment } from 'react';
import {
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
import type { DayItineraryData } from 'catalog';
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

type StopKind = DayItineraryData['stops'][number]['kind'];

const KIND_ICONS: Record<StopKind, LucideIcon> = {
  sight: LandmarkIcon,
  museum: LibraryBigIcon,
  food: UtensilsIcon,
  coffee: CoffeeIcon,
  shopping: ShoppingBagIcon,
  nightlife: MusicIcon,
  transport: TramFrontIcon,
  other: MapPinIcon,
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
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* No group gap: the separators already space the stops. */}
        <ItemGroup className="gap-0">
          {day.stops.map((stop, i) => {
            const Icon = KIND_ICONS[stop.kind];
            return (
              <Fragment key={stop.id}>
                {i > 0 && <ItemSeparator />}
                <Item size="sm">
                  <ItemMedia variant="icon">
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
                    <Badge variant="outline">{stop.time}</Badge>
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
