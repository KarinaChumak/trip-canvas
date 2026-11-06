import { describe, expect, it } from 'vitest';
import type { UIMessage } from 'ai';
import { buildContext, MAX_HISTORY, recentHistory } from '../../src/lib/context.js';

function userMessage(i: number): UIMessage {
  return { id: String(i), role: 'user', parts: [{ type: 'text', text: `message ${i}` }] };
}

function assistantMessage(i: number): UIMessage {
  return { id: String(i), role: 'assistant', parts: [{ type: 'text', text: `reply ${i}` }] };
}

describe('buildContext', () => {
  it('starts with the base system prompt', async () => {
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

  it('never starts the history with an assistant reply', () => {
    // Alternating turns: the plain cut would start at an assistant message.
    const all = Array.from({ length: MAX_HISTORY + 1 }, (_, i) => (i % 2 === 0 ? userMessage(i) : assistantMessage(i)));
    const recent = recentHistory(all);

    expect(recent[0]?.role).toBe('user');
    expect(recent).toHaveLength(MAX_HISTORY - 1);
    expect(recent.at(-1)?.id).toBe(String(MAX_HISTORY));
  });

  it('keeps nothing when no user message is left', () => {
    expect(recentHistory([assistantMessage(0)])).toEqual([]);
  });
});
