import {
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudRainIcon,
  CloudSunIcon,
  SnowflakeIcon,
  SunIcon,
  type LucideIcon,
} from 'lucide-react';
import type { WeatherStripData } from 'catalog';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/shadcn/item';
import { formatDay } from '@/lib/format';

type Condition = WeatherStripData['days'][number]['condition'];

const CONDITION_ICONS: Record<Condition, LucideIcon> = {
  sunny: SunIcon,
  'partly-cloudy': CloudSunIcon,
  cloudy: CloudIcon,
  rain: CloudRainIcon,
  storm: CloudLightningIcon,
  snow: SnowflakeIcon,
  fog: CloudFogIcon,
};

type WeatherStripProps = {
  forecast: WeatherStripData;
};

export function WeatherStrip({ forecast }: WeatherStripProps) {
  const days = forecast.days.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{forecast.location}</CardTitle>
        <CardDescription>{days === 1 ? 'Forecast' : `${days}-day forecast`}</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2">
          {forecast.days.map((day) => {
            const Icon = CONDITION_ICONS[day.condition];
            return (
              <Item key={day.date} variant="muted" size="sm" className="flex-col items-start">
                <ItemMedia variant="icon">
                  <Icon aria-label={day.condition.replace('-', ' ')} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{formatDay(day.date)}</ItemTitle>
                  <ItemDescription>
                    {Math.round(day.high)}° / {Math.round(day.low)}°{forecast.unit}
                  </ItemDescription>
                  {day.precipitationChance !== null && (
                    <ItemDescription>{day.precipitationChance}% rain</ItemDescription>
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
