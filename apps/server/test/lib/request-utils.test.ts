import { describe, expect, it } from 'vitest';
import { settleRequests } from '../../src/lib/request-utils.js';

const run = async (code: string) => {
  if (code.startsWith('!')) throw new Error(`${code} failed`);
  return code.toLowerCase();
};

describe('settleRequests', () => {
  it('keeps the answers that came back and names the requests that failed', async () => {
    expect(await settleRequests(['BKK', '!DMK', 'CNX'], run, (code) => `to ${code}`)).toEqual({ results: ['bkk', 'cnx'], failed: ['to !DMK'] });
  });

  it('throws the first error when every request failed', async () => {
    await expect(settleRequests(['!BKK', '!DMK'], run, String)).rejects.toThrow('!BKK failed');
  });
});
