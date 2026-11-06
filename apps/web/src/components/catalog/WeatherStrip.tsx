import {
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudRainIcon,
  CloudSunIcon,
  DropletIcon,
  MapPinIcon,
  SnowflakeIcon,
  SunIcon,
  type LucideIcon,
} from 'lucide-react';
import type { WeatherStripData } from 'catalog';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/shadcn/item';
import { formatDay } from '@/lib/format';
import { cn } from '@/lib/utils';

type Condition = WeatherStripData['days'][number]['condition'];

type ConditionStyle = {
  icon: LucideIcon;
  /** Full class strings, so Tailwind can find them. */
  tint: string;
};

const CONDITION_STYLES: Record<Condition, ConditionStyle> = {
  sunny: { icon: SunIcon, tint: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300' },
  'partly-cloudy': { icon: CloudSunIcon, tint: 'bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300' },
  cloudy: { icon: CloudIcon, tint: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  rain: { icon: CloudRainIcon, tint: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300' },
  storm: { icon: CloudLightningIcon, tint: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300' },
  snow: { icon: SnowflakeIcon, tint: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300' },
  fog: { icon: CloudFogIcon, tint: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' },
};

type WeatherStripProps = {
  forecast: WeatherStripData;
};

export function WeatherStrip({ forecast }: WeatherStripProps) {
  const days = forecast.days.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <MapPinIcon className="size-4 text-primary" aria-hidden />
          {forecast.location}
        </CardTitle>
        <CardDescription>{days === 1 ? 'Forecast' : `${days}-day forecast`}</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2">
          {forecast.days.map((day) => {
            const { icon: Icon, tint } = CONDITION_STYLES[day.condition];
            return (
              <Item key={day.date} variant="muted" size="sm" className="flex-col items-start">
                <ItemMedia variant="icon" className={cn('size-9 rounded-md [&_svg]:size-5', tint)}>
                  <Icon aria-label={day.condition.replace('-', ' ')} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{formatDay(day.date)}</ItemTitle>
                  <ItemDescription>
                    {Math.round(day.high)}° / {Math.round(day.low)}°{forecast.unit}
                  </ItemDescription>
                  {day.precipitationChance !== null && (
                    <ItemDescription className="flex items-center gap-1">
                      <DropletIcon className="size-3 text-sky-500" aria-hidden />
                      {day.precipitationChance}% rain
                    </ItemDescription>
                  )}
                </ItemContent>
              </Item>
            );
          })}
        </ItemGroup>
      </CardContent>
      {/* Open-Meteo's licence (CC BY 4.0) asks for this credit. */}
      <CardFooter>
        <Button asChild size="sm" variant="link" className="px-0 text-muted-foreground">
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Weather data by Open-Meteo
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
