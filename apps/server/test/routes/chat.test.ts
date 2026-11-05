import { describe, expect, it } from 'vitest';
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { createApp } from '../../src/create-app.js';

const usage = {
  inputTokens: { total: 3, noCache: 3, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 2, text: 2, reasoning: undefined },
};

function mockModel(words: string[]) {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'text-start', id: 't1' },
          ...words.map((delta) => ({ type: 'text-delta' as const, id: 't1', delta })),
          { type: 'text-end', id: 't1' },
          { type: 'finish', finishReason: { unified: 'stop', raw: undefined }, usage },
        ],
      }),
    }),
  });
}

function postChat(app: ReturnType<typeof createApp>, body: unknown) {
  return app.request('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/chat', () => {
  it('rejects a body without messages', async () => {
    const app = createApp({ model: mockModel([]) });
    expect((await postChat(app, {})).status).toBe(400);
    expect((await postChat(app, { messages: [] })).status).toBe(400);
    expect((await postChat(app, 'not json')).status).toBe(400);
  });

  it('streams the model text as UI message parts', async () => {
    const app = createApp({ model: mockModel(['Hello', ', ', 'Lisbon!']) });
    const res = await postChat(app, {
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const body = await res.text();
    expect(body).toContain('"type":"text-delta"');
    for (const word of ['Hello', 'Lisbon!']) expect(body).toContain(word);
  });
});
