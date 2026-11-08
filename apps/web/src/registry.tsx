import { defineRegistry } from '@json-render/react';
import { catalog } from '@trip-canvas/catalog';
import { ConnectionList } from '@/components/catalog/ConnectionList';
import { DayItinerary } from '@/components/catalog/DayItinerary';
import { MapView } from '@/components/catalog/MapView';
import { PlaceCard } from '@/components/catalog/PlaceCard';
import { WeatherStrip } from '@/components/catalog/WeatherStrip';

/**
 * Maps each catalog component to its React component. The catalog types `props`,
 * so a missing component or a prop the catalog doesn't have fails to compile.
 */
export const { registry } = defineRegistry(catalog, {
  components: {
    PlaceCard: ({ props }) => <PlaceCard place={props} />,
    WeatherStrip: ({ props }) => <WeatherStrip forecast={props} />,
    DayItinerary: ({ props }) => <DayItinerary day={props} />,
    MapView: ({ props }) => <MapView map={props} />,
    ConnectionList: ({ props }) => <ConnectionList list={props} />,
  },
});
