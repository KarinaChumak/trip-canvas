import { describe, expect, it } from 'vitest';
import type { UIMessage } from 'ai';
import { buildContext, MAX_HISTORY } from '../../src/lib/context.js';

function userMessage(i: number): UIMessage {
  return { id: String(i), role: 'user', parts: [{ type: 'text', text: `message ${i}` }] };
}

describe('buildContext', () => {
  it('uses the system prompt from prompts/system.md', async () => {
    const { system } = await buildContext([userMessage(0)]);
    expect(system).toMatch(/^You are Trip canvas/);
  });

  it(`keeps only the last ${MAX_HISTORY} messages`, async () => {
    const all = Array.from({ length: MAX_HISTORY + 5 }, (_, i) => userMessage(i));
    const { messages } = await buildContext(all);

    expect(messages).toHaveLength(MAX_HISTORY);
    const text = JSON.stringify(messages);
    expect(text).not.toContain('"message 4"');
    expect(text).toContain('"message 5"');
    expect(text).toContain(`"message ${MAX_HISTORY + 4}"`);
  });
});
