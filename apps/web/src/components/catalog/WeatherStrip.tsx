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
import type { WeatherStripData } from '@trip-canvas/catalog';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/shadcn/item';
import { formatDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import { SourceCredit } from './SourceCredit';

type Condition = WeatherStripData['days'][number]['condition'];

type ConditionStyle = {
  icon: LucideIcon;
  /** Full class strings, so Tailwind can find them. */
  tint: string;
};

const CONDITION_STYLES: Record<Condition, ConditionStyle> = {
  sunny: { icon: SunIcon, tint: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300' },
  'partly-cloudy': { icon: CloudSunIcon, tint: 'bg-orange-50 text-amber-600 dark:bg-orange-950 dark:text-amber-300' },
  cloudy: { icon: CloudIcon, tint: 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-300' },
  rain: { icon: CloudRainIcon, tint: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  storm: { icon: CloudLightningIcon, tint: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
  snow: { icon: SnowflakeIcon, tint: 'bg-slate-100 text-sky-600 dark:bg-slate-800 dark:text-sky-300' },
  fog: { icon: CloudFogIcon, tint: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' },
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
        <CardAction>
          {/* Open-Meteo's licence (CC BY 4.0) asks for this credit. */}
          <SourceCredit credit="Weather data by Open-Meteo" href="https://open-meteo.com/" />
        </CardAction>
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
                      <DropletIcon className="size-3 text-sky-600 dark:text-sky-400" aria-hidden />
                      {day.precipitationChance}% rain
                    </ItemDescription>
                  )}
                </ItemContent>
              </Item>
            );
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
