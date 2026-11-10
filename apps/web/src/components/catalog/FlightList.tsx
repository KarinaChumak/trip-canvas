import { useState } from 'react';
import { ChevronDownIcon, PlaneIcon } from 'lucide-react';
import type { FlightListData } from '@trip-canvas/catalog';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/shadcn/empty';
import { ItemGroup } from '@/components/shadcn/item';
import { formatDay } from '@/lib/formatting-utils';
import { FlightOption } from './FlightOption';

/** Fares shown before "Show more", and how many more each click adds. */
const STEP = 3;

type FlightListProps = {
  list: FlightListData;
};

/**
 * Fares for one direction, or for one round-trip search, most convenient first as searchFlights
 * sorted them. The recommended fare moves to the top; "Show more" reveals the rest.
 */
export function FlightList({ list }: FlightListProps) {
  const [shownCount, setShownCount] = useState(STEP);
  const first = list.options[0];
  // Claude's index can point past the list; then nothing is recommended.
  const recommended = list.recommendedIndex !== null ? list.options[list.recommendedIndex] : undefined;
  const ordered = recommended ? [recommended, ...list.options.filter((option) => option !== recommended)] : list.options;
  const hidden = ordered.length - shownCount;

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>{list.title}</CardTitle>
        {first && (
          <CardDescription>
            {formatDay(first.outbound.departureDate)} · {formatCabinLabel(first.cabinClass)}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {ordered.length === 0 ? (
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PlaneIcon />
              </EmptyMedia>
              <EmptyTitle>No flights found</EmptyTitle>
              <EmptyDescription>Try another date or nearby airports.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ItemGroup className="gap-2">
            {ordered.slice(0, shownCount).map((option) => (
              <FlightOption key={option.id} flight={option} recommended={option === recommended} />
            ))}
          </ItemGroup>
        )}
        {hidden > 0 && (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setShownCount(shownCount + STEP)}>
            <ChevronDownIcon data-icon="inline-start" />
            Show {Math.min(hidden, STEP)} more
          </Button>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">Price at search time · Ignav</CardFooter>
    </Card>
  );
}

/** "premium_economy" → "Premium economy". */
function formatCabinLabel(cabinClass: string): string {
  const words = cabinClass.toLowerCase().replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
