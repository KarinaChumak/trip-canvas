import { useEffect, useRef } from 'react';
import { LngLatBounds, Map as MapLibreMap, Marker, Popup, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapViewData } from 'catalog';

// MapLibre looks for its worker next to its own file, which Vite's bundling moves;
// `?url` makes Vite serve and emit the worker, so point MapLibre at it.
setWorkerUrl(workerUrl);

const LIBERTY_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// Liberty recoloured to the Golden hour palette: [layer, paint property, colour].
// A layer OpenFreeMap renames later keeps Liberty's own colour.
type ColorProperty = 'background-color' | 'fill-color' | 'line-color';
const GOLDEN_HOUR_PAINT: [layer: string, property: ColorProperty, color: string][] = [
  ['background', 'background-color', '#fbf6ef'],
  ['water', 'fill-color', '#bcd5d9'],
  ['park', 'fill-color', '#e3e6c6'],
  ['landcover_grass', 'fill-color', '#d9dfb4'],
  ['landcover_wood', 'fill-color', '#cfd8a8'],
  ['landuse_residential', 'fill-color', '#f3ebe0'],
  ['building', 'fill-color', '#ebdfd1'],
  ['road_motorway', 'line-color', '#f0b98a'],
  ['road_trunk_primary', 'line-color', '#f6d6a8'],
  ['road_trunk_primary_casing', 'line-color', '#e2b98a'],
  ['road_secondary_tertiary', 'line-color', '#f9e4c3'],
  ['road_secondary_tertiary_casing', 'line-color', '#e6c7a3'],
];

/** Flat 2D buildings instead of Liberty's 3D ones, and the app's colours. */
function applyGoldenHour(map: MapLibreMap) {
  if (map.getLayer('building-3d')) map.setLayoutProperty('building-3d', 'visibility', 'none');
  if (map.getLayer('building')) map.setLayerZoomRange('building', 13, 24);
  for (const [layer, property, color] of GOLDEN_HOUR_PAINT) {
    if (map.getLayer(layer)) map.setPaintProperty(layer, property, color);
  }
}

type PlacesMapProps = {
  places: MapViewData['places'];
};

/** MapLibre map with a pin per place; clicking a pin shows its name and category. */
export function PlacesMap({ places }: PlacesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // MapLibre isn't a React component: it draws into a DOM element it is given and
  // manages that element itself. The ref hands it our div once React has created it,
  // and the effect is where that happens: it runs after the div is in the page, builds
  // the map once per set of places, and its cleanup removes the map (WebGL context,
  // listeners, worker messages) when the card unmounts or the places change.
  useEffect(() => {
    if (!containerRef.current) return;
    const bounds = new LngLatBounds();
    for (const place of places) bounds.extend([place.longitude, place.latitude]);

    const map = new MapLibreMap({
      container: containerRef.current,
      style: LIBERTY_STYLE,
      bounds,
      fitBoundsOptions: { padding: 48, maxZoom: 16 },
      attributionControl: false, // MapView's footer carries the credit
      cooperativeGestures: true, // the chat keeps scrolling; Ctrl/⌘ + scroll zooms
    });
    map.on('load', () => applyGoldenHour(map));

    const pinColor = getComputedStyle(document.documentElement).getPropertyValue('--primary');
    for (const place of places) {
      new Marker({ color: pinColor })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(new Popup({ offset: 28, closeButton: false }).setText(`${place.name} · ${place.category}`))
        .addTo(map);
    }
    return () => map.remove();
  }, [places]);

  // MapLibre needs a plain element to draw into; there is no library component for it.
  return <div ref={containerRef} className="h-72 w-full overflow-hidden rounded-md" />;
}
