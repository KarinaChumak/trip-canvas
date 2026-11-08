import { describe, expect, it, vi } from 'vitest';
import type { Connection, ConnectionSearch, GoogleRoutesClient } from '../../src/services/google-routes.js';
import { createFindConnectionsTool } from '../../src/tools/find-connections.js';

// execute's second argument; the tool only reads its abortSignal.
const options = { toolCallId: 't1', messages: [] } as unknown as Parameters<NonNullable<ReturnType<typeof createFindConnectionsTool>['execute']>>[1];

const SEARCH: ConnectionSearch = { from: 'Berlin', to: 'Munich', when: '2026-11-13T06:00:00+01:00', arriveBy: false };
const ICE: Connection = {
  from: 'Berlin Hauptbahnhof',
  to: 'Munich Central Station',
  departureDate: '2026-11-13',
  departureTime: '06:36',
  arrivalDate: '2026-11-13',
  arrivalTime: '11:20',
  durationMinutes: 284,
  segments: [{ mode: 'train', line: 'ICE 1003', from: 'Berlin Hauptbahnhof', to: 'Munich Central Station', departureTime: '06:36', arrivalTime: '11:20', headsign: 'München Hbf' }],
};

function findConnectionsTool(connections: Connection[]) {
  const googleRoutes: GoogleRoutesClient = { findConnections: vi.fn(async () => connections) };
  return { tool: createFindConnectionsTool({ googleRoutes }), googleRoutes };
}

describe('findConnections tool', () => {
  it('passes the search through and names the source', async () => {
    const { tool, googleRoutes } = findConnectionsTool([ICE]);

    expect(await tool.execute!(SEARCH, options)).toEqual({ connections: [ICE], source: 'Google Maps' });
    expect(googleRoutes.findConnections).toHaveBeenCalledWith(SEARCH, undefined);
  });

  it('returns an error the model can act on when nothing runs', async () => {
    const { tool } = findConnectionsTool([]);
    expect(await tool.execute!(SEARCH, options)).toEqual({
      error: 'No public transport found from "Berlin" to "Munich" at that time. Try another time or nearby cities.',
    });
  });
});
