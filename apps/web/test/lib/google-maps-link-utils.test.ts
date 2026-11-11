import { describe, expect, it } from 'vitest';
import type { DayItineraryData } from '@trip-canvas/catalog';
import { buildWalkingDirectionsLinks } from '@/lib/google-maps-link-utils';

type Stop = DayItineraryData['stops'][number];

function makeStop(n: number, location: Partial<Pick<Stop, 'placeId' | 'latitude' | 'longitude'>> = {}): Stop {
  return {
    id: `s${n}`,
    time: `${String(8 + n).padStart(2, '0')}:00`,
    title: `Stop ${n}`,
    kind: 'sight',
    durationMinutes: null,
    note: null,
    placeId: `place${n}`,
    // (18780 + n) / 1000 rather than 18.78 + n / 1000, which adds float noise.
    latitude: (18_780 + n) / 1000,
    longitude: (98_980 + n) / 1000,
    ...location,
  };
}

function readParams(url: string): Record<string, string> {
  return Object.fromEntries(new URL(url).searchParams);
}

describe('buildWalkingDirectionsLinks', () => {
  it('walks from the first stop to the last through the ones between, with their place ids', () => {
    const [link] = buildWalkingDirectionsLinks([makeStop(1), makeStop(2), makeStop(3)]);

    expect(link!.url.startsWith('https://www.google.com/maps/dir/?')).toBe(true);
    expect(readParams(link!.url)).toEqual({
      api: '1',
      origin: '18.781,98.981',
      destination: '18.783,98.983',
      travelmode: 'walking',
      origin_place_id: 'place1',
      destination_place_id: 'place3',
      waypoints: '18.782,98.982',
      waypoint_place_ids: 'place2',
    });
    expect([link!.from.id, link!.to.id]).toEqual(['s1', 's3']);
  });

  it('encodes the separators in the query', () => {
    const [link] = buildWalkingDirectionsLinks([makeStop(1), makeStop(2), makeStop(3), makeStop(4)]);

    expect(link!.url).toContain('waypoints=18.782%2C98.982%7C18.783%2C98.983');
  });

  it('skips stops without coordinates', () => {
    const tram = makeStop(2, { placeId: null, latitude: null, longitude: null });
    const [link] = buildWalkingDirectionsLinks([makeStop(1), tram, makeStop(3)]);

    expect(readParams(link!.url).waypoints).toBeUndefined();
    expect([link!.from.id, link!.to.id]).toEqual(['s1', 's3']);
  });

  it('leaves out the waypoint ids unless every waypoint has one', () => {
    const [link] = buildWalkingDirectionsLinks([makeStop(1), makeStop(2, { placeId: null }), makeStop(3), makeStop(4)]);

    expect(readParams(link!.url).waypoints).toBe('18.782,98.982|18.783,98.983');
    expect(readParams(link!.url).waypoint_place_ids).toBeUndefined();
  });

  it('returns no link for fewer than two stops with coordinates', () => {
    expect(buildWalkingDirectionsLinks([makeStop(1)])).toEqual([]);
    expect(buildWalkingDirectionsLinks([makeStop(1), makeStop(2, { latitude: null, longitude: null })])).toEqual([]);
  });

  it('fits 11 stops in one link: 9 waypoints at most', () => {
    const links = buildWalkingDirectionsLinks(Array.from({ length: 11 }, (_, i) => makeStop(i + 1)));

    expect(links).toHaveLength(1);
    expect(readParams(links[0]!.url).waypoints!.split('|')).toHaveLength(9);
  });

  it('splits 12 stops in two halves that share the middle stop', () => {
    const links = buildWalkingDirectionsLinks(Array.from({ length: 12 }, (_, i) => makeStop(i + 1)));

    expect(links.map((link) => [link.from.id, link.to.id])).toEqual([
      ['s1', 's7'],
      ['s7', 's12'],
    ]);
    expect(readParams(links[0]!.url).waypoints!.split('|')).toHaveLength(5);
    expect(readParams(links[1]!.url).waypoints!.split('|')).toHaveLength(4);
  });
});
