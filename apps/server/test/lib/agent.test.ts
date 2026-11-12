import { describe, expect, it } from 'vitest';
import { convertToModelMessages, readUIMessageStream, simulateReadableStream, type StepResult, type UIMessage } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { EMIT_COMPONENT_TOOL } from '@trip-canvas/catalog/schema';
import { activeToolsFor, MAX_INVALID_COMPONENTS, streamAgent } from '../../src/lib/agent.js';
import { memoryCache } from '../../src/lib/cache.js';
import { createServices } from '../../src/services/index.js';
import { createTools, type AgentTools } from '../../src/tools/index.js';
import { createSearchFlightsTool } from '../../src/tools/search-flights.js';

const tools = createTools(createServices({ cache: memoryCache(), env: { NOMINATIM_USER_AGENT: 'test', GOOGLE_MAPS_API_KEY: 'test', IGNAV_API_KEY: 'test' } }));

const usage = {
  inputTokens: { total: 3, noCache: 3, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 2, text: 2, reasoning: undefined },
};

/** A step whose only tool result is one emit_component output. */
function emitStep(output: object) {
  return { toolResults: [{ toolName: EMIT_COMPONENT_TOOL, output }] } as unknown as StepResult<AgentTools>;
}

describe('activeToolsFor', () => {
  it('keeps all tools while emit_component has failed fewer times than allowed', () => {
    expect(activeToolsFor([], tools)).toBeUndefined();
    expect(activeToolsFor([emitStep({ error: 'bad' }), emitStep({ ok: true })], tools)).toBeUndefined();
  });

  it(`drops emit_component after ${MAX_INVALID_COMPONENTS} invalid components`, () => {
    const steps = Array.from({ length: MAX_INVALID_COMPONENTS }, () => emitStep({ error: 'bad' }));
    expect(activeToolsFor(steps, tools)).toEqual(['findCheapestFlightDates', 'findConnections', 'geocode', 'getWeather', 'searchFlights', 'searchPlaces', 'webSearch']);
  });
});

describe('streamAgent', () => {
  it('sends a broken component back once, then answers in text without the tool', async () => {
    const brokenCall = (id: string) => ({
      type: 'tool-call' as const,
      toolCallId: id,
      toolName: EMIT_COMPONENT_TOOL,
      input: JSON.stringify({ component: { type: 'DayItinerary', props: { title: 'Lisbon' } } }),
    });
    const finish = (unified: 'tool-calls' | 'stop') => ({ type: 'finish' as const, finishReason: { unified, raw: undefined }, usage });
    let call = 0;
    // Calls 1 and 2 send a broken component; call 3 answers in text.
    const model = new MockLanguageModelV4({
      doStream: async () => {
        if (++call <= MAX_INVALID_COMPONENTS) {
          return { stream: simulateReadableStream({ chunks: [brokenCall(`c${call}`), finish('tool-calls')] }) };
        }
        return {
          stream: simulateReadableStream({
            chunks: [
              { type: 'text-start', id: 't1' },
              { type: 'text-delta', id: 't1', delta: 'Here is the plan in text.' },
              { type: 'text-end', id: 't1' },
              finish('stop'),
            ],
          }),
        };
      },
    });

    const stream = streamAgent({ model, tools, context: { system: 'test', messages: [{ role: 'user', content: 'Plan a day in Lisbon' }] } });
    const chunks: { type: string; [key: string]: unknown }[] = [];
    for await (const chunk of stream) chunks.push(chunk);

    const toolNames = model.doStreamCalls.map((c) => (c.tools ?? []).map((t) => t.name));
    expect(toolNames[0]).toContain(EMIT_COMPONENT_TOOL);
    expect(toolNames[1]).toContain(EMIT_COMPONENT_TOOL);
    expect(toolNames[2]).not.toContain(EMIT_COMPONENT_TOOL);

    const outputs = chunks.filter((c) => c.type === 'tool-output-available');
    expect(outputs).toHaveLength(2);
    expect(outputs[0]!.output).toHaveProperty('error');
    expect(chunks.some((c) => c.type === 'text-delta' && c.delta === 'Here is the plan in text.')).toBe(true);
  });
});

describe('streamAgent errors', () => {
  const finish = (unified: 'tool-calls' | 'stop') => ({ type: 'finish' as const, finishReason: { unified, raw: undefined }, usage });
  const ignav = {
    searchFlights: async () => {
      throw new Error('Ignav returned 424: upstream_error');
    },
    findCheapestFlightDates: async () => [],
  };
  const failingTools = { ...tools, searchFlights: createSearchFlightsTool({ ignav }) };

  it('saves a failed tool call with the error text the model saw, so the next turn replays it unchanged', async () => {
    let call = 0;
    const flightsInput = { from: ['FRA'], to: ['BKK'], departureDate: '2027-01-09', market: 'DE' };
    // Call 1 searches flights, which throws; call 2 answers in text.
    const model = new MockLanguageModelV4({
      doStream: async () => {
        if (++call === 1) {
          const search = { type: 'tool-call' as const, toolCallId: 'c1', toolName: 'searchFlights', input: JSON.stringify(flightsInput) };
          return { stream: simulateReadableStream({ chunks: [search, finish('tool-calls')] }) };
        }
        return {
          stream: simulateReadableStream({
            chunks: [
              { type: 'text-start', id: 't1' },
              { type: 'text-delta', id: 't1', delta: 'Ignav is down.' },
              { type: 'text-end', id: 't1' },
              finish('stop'),
            ],
          }),
        };
      },
    });

    const stream = streamAgent({ model, tools: failingTools, context: { system: 'test', messages: [{ role: 'user', content: 'Flights FRA to BKK' }] } });
    let reply: UIMessage | undefined;
    for await (const message of readUIMessageStream({ stream })) reply = message;

    const replayed = await convertToModelMessages([reply!]);
    const seen = model.doStreamCalls[1]!.prompt.find((message) => message.role === 'tool');
    expect(replayed.find((message) => message.role === 'tool')!.content).toEqual(seen!.content);
    expect(JSON.stringify(seen!.content)).toContain('Ignav returned 424');
  });

  it('still hides provider errors from the client', async () => {
    const model = new MockLanguageModelV4({
      doStream: async () => {
        throw new Error('401 invalid x-api-key sk-secret');
      },
    });

    const stream = streamAgent({ model, tools: failingTools, context: { system: 'test', messages: [{ role: 'user', content: 'Hi' }] } });
    const chunks: { type: string; [key: string]: unknown }[] = [];
    for await (const chunk of stream) chunks.push(chunk);

    const errors = chunks.filter((c) => c.type === 'error');
    expect(errors).toEqual([{ type: 'error', errorText: 'The assistant could not answer. Please try again.' }]);
  });
});
