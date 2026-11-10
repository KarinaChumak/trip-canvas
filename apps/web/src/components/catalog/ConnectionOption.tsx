import {
  ArrowRightIcon,
  BusIcon,
  ChevronDownIcon,
  RouteIcon,
  ShipIcon,
  TrainFrontIcon,
  TrainFrontTunnelIcon,
  TramFrontIcon,
  type LucideIcon,
} from 'lucide-react';
import type { ConnectionOptionData } from '@trip-canvas/catalog';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/shadcn/collapsible';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/shadcn/item';
import { formatDay, formatDuration } from '@/lib/formatting-utils';

type TransitMode = ConnectionOptionData['segments'][number]['mode'];

const MODE_ICONS: Record<TransitMode, LucideIcon> = {
  train: TrainFrontIcon,
  metro: TrainFrontTunnelIcon,
  tram: TramFrontIcon,
  bus: BusIcon,
  ferry: ShipIcon,
  other: RouteIcon,
};

const DAY_MS = 24 * 60 * 60 * 1000;

type ConnectionOptionProps = {
  connection: ConnectionOptionData;
  recommended: boolean;
  /** Show the departure day, for an option on another day than the list's first. */
  showDate: boolean;
};

/** One row of a ConnectionList; it opens to show each segment. */
export function ConnectionOption({ connection, recommended, showDate }: ConnectionOptionProps) {
  const changes = connection.segments.length - 1;
  // "+1" for an overnight train, as on a timetable.
  const daysLater = Math.round((Date.parse(connection.arrivalDate) - Date.parse(connection.departureDate)) / DAY_MS);
  const lines = connection.segments.flatMap((segment) => segment.line ?? []).join(', ');
  const summary = [formatDuration(connection.durationMinutes), changes === 0 ? 'Direct' : `${changes} ${changes === 1 ? 'change' : 'changes'}`, lines];
  const Icon = MODE_ICONS[connection.segments[0]?.mode ?? 'other'];

  return (
    <Collapsible asChild>
      <Item variant={recommended ? 'outline' : 'muted'} size="sm">
        <ItemMedia variant="icon" className="size-8 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
          <Icon aria-label={connection.segments[0]?.mode} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            {showDate && <span className="font-normal text-muted-foreground">{formatDay(connection.departureDate)}</span>}
            {connection.departureTime}
            <ArrowRightIcon className="size-3.5 text-muted-foreground" aria-label="to" />
            {connection.arrivalTime}
            {daysLater > 0 && <Badge variant="outline">+{daysLater}</Badge>}
            {recommended && <Badge>Recommended</Badge>}
          </ItemTitle>
          <ItemDescription>{summary.filter(Boolean).join(' · ')}</ItemDescription>
          <ItemDescription>
            {connection.from} → {connection.to}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Show segments" className="data-[state=open]:rotate-180">
              <ChevronDownIcon />
            </Button>
          </CollapsibleTrigger>
        </ItemActions>
        <CollapsibleContent className="basis-full">
          <ItemGroup className="gap-1 pt-2">
            {connection.segments.map((segment) => {
              const SegmentIcon = MODE_ICONS[segment.mode];
              return (
                <Item key={`${segment.departureTime}-${segment.from}`} size="sm" className="py-1">
                  <ItemMedia variant="icon" className="size-6 [&_svg]:size-3.5">
                    <SegmentIcon aria-label={segment.mode} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      {segment.line ?? segment.mode}
                      {segment.headsign && <span className="font-normal text-muted-foreground">to {segment.headsign}</span>}
                    </ItemTitle>
                    <ItemDescription>
                      {segment.departureTime} {segment.from} → {segment.arrivalTime} {segment.to}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              );
            })}
          </ItemGroup>
        </CollapsibleContent>
      </Item>
    </Collapsible>
  );
}
