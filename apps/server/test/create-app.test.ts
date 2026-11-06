import { describe, expect, it } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
import { createApp } from '../src/create-app.js';
import { memoryCache } from '../src/lib/cache.js';
import { createTools } from '../src/tools/index.js';

function appWith(accessCode?: string) {
  const cache = memoryCache();
  const tools = createTools();
  return createApp({ model: new MockLanguageModelV4(), tools, cache, accessCode });
}

function get(app: ReturnType<typeof createApp>, path: string, code?: string) {
  return app.request(path, { headers: code ? { authorization: `Bearer ${code}` } : {} });
}

describe('access code', () => {
  const app = appWith('open-sesame');

  it('rejects API calls without the code or with a wrong one', async () => {
    expect((await get(app, '/api/access')).status).toBe(401);
    expect((await get(app, '/api/access', 'guess')).status).toBe(401);
    const chat = await app.request('/api/chat', { method: 'POST', body: '{}' });
    expect(chat.status).toBe(401);
  });

  it('accepts the right code', async () => {
    expect((await get(app, '/api/access', 'open-sesame')).status).toBe(200);
  });

  it('keeps health and keepalive open', async () => {
    expect((await get(app, '/api/health')).status).toBe(200);
    expect((await get(app, '/api/keepalive')).status).toBe(200);
  });

  it('checks nothing when no code is set', async () => {
    expect((await get(appWith(), '/api/access')).status).toBe(200);
  });
});
