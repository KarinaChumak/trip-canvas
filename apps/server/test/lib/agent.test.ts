import { describe, expect, it } from 'vitest';
import { simulateReadableStream, type StepResult } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { EMIT_COMPONENT_TOOL } from 'catalog/schema';
import { activeToolsFor, MAX_INVALID_COMPONENTS, streamAgent } from '../../src/lib/agent.js';
import { createTools, type AgentTools } from '../../src/tools/index.js';

const tools = createTools();

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
    expect(activeToolsFor(steps, tools)).toEqual(['getMockDay']);
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
