import { tool } from 'ai';
import { z } from 'zod';
import type { Services } from '../services/index.js';

export const FindConnectionsInput = z.object({
  from: z.string().min(1).describe('City, station or address, e.g. "Bangkok" or "Berlin Hbf"'),
  to: z.string().min(1),
  when: z.iso
    .datetime({ offset: true })
    .describe('Local time at the start with its UTC offset, e.g. "2026-12-10T05:00:00+07:00"; 06:00 if no time is given'),
  arriveBy: z.boolean().describe('true when the user must arrive by `when`'),
});

/** Real train, bus and ferry connections from Google Maps. Never cached (D-043). */
export function createFindConnectionsTool({ googleRoutes }: Pick<Services, 'googleRoutes'>) {
  return tool({
    description:
      'Find real train, bus or ferry connections between two places at a date and time. Show them in one ConnectionList per direction, copied as is.',
    inputSchema: FindConnectionsInput,
    execute: async (search, { abortSignal }) => {
      const connections = await googleRoutes.findConnections(search, abortSignal);
      if (connections.length === 0) {
        return { error: `No public transport found from "${search.from}" to "${search.to}" at that time. Try another time or nearby cities.` };
      }
      return { connections, source: 'Google Maps' };
    },
  });
}
