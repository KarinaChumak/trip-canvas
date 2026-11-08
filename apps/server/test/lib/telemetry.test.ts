import { afterAll, describe, expect, it, vi } from 'vitest';
import { simulateReadableStream, tool } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { z } from 'zod';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { streamAgent } from '../../src/lib/agent.js';
import { createApiClient } from '../../src/lib/api-client.js';
import { memoryCache } from '../../src/lib/cache.js';
import { startTracing } from '../../src/lib/telemetry.js';
import type { AgentTools } from '../../src/tools/index.js';

const usage = {
  inputTokens: { total: 3, noCache: 3, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 2, text: 2, reasoning: undefined },
};

afterAll(() => vi.unstubAllGlobals());

describe('startTracing', () => {
  it('does nothing without a config', async () => {
    await expect(startTracing(undefined).flush()).resolves.toBeUndefined();
  });

  it('traces a chat turn: model steps, tool calls, HTTP requests and cache hits', async () => {
    const exporter = new InMemorySpanExporter();
    const tracing = startTracing({ publicKey: 'pk', secretKey: 'sk', baseUrl: 'http://localhost:1', environment: 'test', exporter });

    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: 1 })));
    const client = createApiClient({ service: 'Fake', cache: { store: memoryCache(), ttlSeconds: 60 } });
    const tools = {
      lookup: tool({
        inputSchema: z.object({}),
        execute: () => client.getJson(new URL('https://api.test/places?key=secret'), z.object({ ok: z.number() })),
      }),
    } as unknown as AgentTools;

    // Calls 1 and 2 look the same thing up (the second from the cache); call 3 answers.
    let call = 0;
    const finish = (unified: 'tool-calls' | 'stop') => ({ type: 'finish' as const, finishReason: { unified, raw: undefined }, usage });
    const model = new MockLanguageModelV4({
      doStream: async () => {
        if (++call <= 2) {
          const lookup = { type: 'tool-call' as const, toolCallId: `c${call}`, toolName: 'lookup', input: '{}' };
          return { stream: simulateReadableStream({ chunks: [lookup, finish('tool-calls')] }) };
        }
        return {
          stream: simulateReadableStream({
            chunks: [
              { type: 'text-start', id: 't' },
              { type: 'text-delta', id: 't', delta: 'Done.' },
              { type: 'text-end', id: 't' },
              finish('stop'),
            ],
          }),
        };
      },
    });

    const flushTracing = vi.fn(tracing.flush);
    const stream = streamAgent({
      model,
      tools,
      context: { system: 'test', messages: [{ role: 'user', content: 'Find lunch' }] },
      chatId: 'chat-1',
      flushTracing,
    });
    for await (const _part of stream);
    await vi.waitFor(() => expect(flushTracing).toHaveBeenCalledOnce());

    const spans = exporter.getFinishedSpans();
    const byName = (name: string) => spans.filter((span) => span.name === name);
    const nth = (name: string, index = 0) => {
      const span = byName(name)[index];
      if (!span) throw new Error(`no span "${name}" #${index}`);
      return span;
    };

    // Every span carries the trace name, chat id and environment.
    for (const span of spans) {
      expect(span.attributes).toMatchObject({ 'langfuse.trace.name': 'chat', 'session.id': 'chat-1', 'langfuse.environment': 'test' });
    }
    const agent = nth('invoke_agent mock-model-id');
    expect(agent.attributes).toMatchObject({ 'gen_ai.usage.input_tokens': 9, 'gen_ai.usage.output_tokens': 6 });

    // One real request, nested under the tool call that made it, without the query string.
    const http = nth('http Fake');
    const miss = nth('execute_tool lookup', 0);
    const hit = nth('execute_tool lookup', 1);
    expect(byName('http Fake')).toHaveLength(1);
    expect(http.parentSpanContext?.spanId).toBe(miss.spanContext().spanId);
    expect(http.attributes).toMatchObject({
      'langfuse.observation.metadata.path': '"/places"',
      'langfuse.observation.metadata.status': '200',
    });
    expect(JSON.stringify(http.attributes)).not.toContain('secret');
    // The second lookup came from the cache: no request, a mark on the tool span.
    expect(hit.attributes['langfuse.observation.metadata.cacheHit']).toBe('"Fake"');
  });
});
