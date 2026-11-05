import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkAccessCode } from '@/lib/access-code';

function stubFetch(status: number) {
  const fetch = vi.fn(async () => new Response(null, { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('checkAccessCode', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends the code as a bearer token and reports acceptance', async () => {
    const fetch = stubFetch(200);
    expect(await checkAccessCode('open-sesame')).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/access', {
      headers: { Authorization: 'Bearer open-sesame' },
    });
  });

  it('reports a rejected code as false', async () => {
    stubFetch(401);
    expect(await checkAccessCode('guess')).toBe(false);
  });

  it('throws when the server fails, so the gate can offer a retry', async () => {
    stubFetch(500);
    await expect(checkAccessCode('x')).rejects.toThrow(/500/);
  });
});
