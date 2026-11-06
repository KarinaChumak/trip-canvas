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
import { cn } from '@/lib/utils';

type StopKind = DayItineraryData['stops'][number]['kind'];

type KindStyle = {
  icon: LucideIcon;
  /** Full class strings, so Tailwind can find them. */
  tint: string;
};

const KIND_STYLES: Record<StopKind, KindStyle> = {
  sight: { icon: LandmarkIcon, tint: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
  museum: { icon: LibraryBigIcon, tint: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
  food: { icon: UtensilsIcon, tint: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  coffee: { icon: CoffeeIcon, tint: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  shopping: { icon: ShoppingBagIcon, tint: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300' },
  nightlife: { icon: MusicIcon, tint: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300' },
  transport: { icon: TramFrontIcon, tint: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  other: { icon: MapPinIcon, tint: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
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
