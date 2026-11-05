import { describe, expect, it } from 'vitest';
import { MockLanguageModelV4 } from 'ai/test';
import { createApp } from '../src/create-app.js';

const model = new MockLanguageModelV4();

function get(app: ReturnType<typeof createApp>, path: string, code?: string) {
  return app.request(path, { headers: code ? { authorization: `Bearer ${code}` } : {} });
}

describe('access code', () => {
  const app = createApp({ model, accessCode: 'open-sesame' });

  it('rejects API calls without the code or with a wrong one', async () => {
    expect((await get(app, '/api/access')).status).toBe(401);
    expect((await get(app, '/api/access', 'guess')).status).toBe(401);
    const chat = await app.request('/api/chat', { method: 'POST', body: '{}' });
    expect(chat.status).toBe(401);
  });

  it('accepts the right code', async () => {
    expect((await get(app, '/api/access', 'open-sesame')).status).toBe(200);
  });

  it('keeps health open', async () => {
    expect((await get(app, '/api/health')).status).toBe(200);
  });

  it('checks nothing when no code is set', async () => {
    expect((await get(createApp({ model }), '/api/access')).status).toBe(200);
  });
});
