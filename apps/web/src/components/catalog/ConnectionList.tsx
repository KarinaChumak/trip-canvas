import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import type { ConnectionListData } from '@trip-canvas/catalog';
import { Button } from '@/components/shadcn/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { ItemGroup } from '@/components/shadcn/item';
import { initialWindow, showEarlier, showLater } from '@/lib/connection-window';
import { formatDay } from '@/lib/formatting-utils';
import { ConnectionOption } from './ConnectionOption';
import { SourceCredit } from './SourceCredit';

type ConnectionListProps = {
  list: ConnectionListData;
};

/**
 * Connections for one direction. Shows the recommended one and the next, and
 * reveals the others with "Earlier" and "Later", without asking Google again.
 */
export function ConnectionList({ list }: ConnectionListProps) {
  const count = list.options.length;
  const [shown, setShown] = useState(() => initialWindow(count, list.recommendedIndex));
  const firstDate = list.options[0]?.departureDate;

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>{list.title}</CardTitle>
        {firstDate && <CardDescription>{formatDay(firstDate)}</CardDescription>}
        <CardAction>
          {/* Google's terms ask us to name Google Maps as the source. */}
          <SourceCredit credit="Connections from Google Maps" href="https://www.google.com/maps" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {shown.start > 0 && (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setShown(showEarlier(shown))}>
            <ChevronUpIcon data-icon="inline-start" />
            Earlier
          </Button>
        )}
        <ItemGroup className="gap-2">
          {list.options.slice(shown.start, shown.end).map((option, i) => (
            <ConnectionOption
              key={`${option.departureDate}-${option.departureTime}-${option.from}`}
              connection={option}
              recommended={shown.start + i === list.recommendedIndex}
              showDate={option.departureDate !== firstDate}
            />
          ))}
        </ItemGroup>
        {shown.end < count && (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setShown(showLater(shown, count))}>
            <ChevronDownIcon data-icon="inline-start" />
            Later
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
