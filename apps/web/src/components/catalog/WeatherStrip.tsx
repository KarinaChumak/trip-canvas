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
  sunny: { icon: SunIcon, tint: 'bg-weather-sunny text-weather-sunny-foreground' },
  'partly-cloudy': { icon: CloudSunIcon, tint: 'bg-weather-partly-cloudy text-weather-partly-cloudy-foreground' },
  cloudy: { icon: CloudIcon, tint: 'bg-weather-cloudy text-weather-cloudy-foreground' },
  rain: { icon: CloudRainIcon, tint: 'bg-weather-rain text-weather-rain-foreground' },
  storm: { icon: CloudLightningIcon, tint: 'bg-weather-storm text-weather-storm-foreground' },
  snow: { icon: SnowflakeIcon, tint: 'bg-weather-snow text-weather-snow-foreground' },
  fog: { icon: CloudFogIcon, tint: 'bg-weather-fog text-weather-fog-foreground' },
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
                      <DropletIcon className="size-3 text-weather-rain-foreground" aria-hidden />
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
