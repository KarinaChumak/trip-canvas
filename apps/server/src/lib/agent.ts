import { stepCountIs, streamText, toUIMessageStream, type LanguageModel, type StepResult } from 'ai';
import { EMIT_COMPONENT_TOOL } from 'catalog/schema';
import type { AgentTools } from '../tools/index.js';
import type { ChatContext } from './context.js';

/** Enough for: fetch data → emit → one retry → closing text, with room to spare. */
export const MAX_STEPS = 6;

/** The first invalid component plus one retry; after that the model answers in text. */
export const MAX_INVALID_COMPONENTS = 2;

/**
 * Tools for the next step. Once `emit_component` has failed validation
 * MAX_INVALID_COMPONENTS times in this turn, it is taken away so the model falls
 * back to text instead of retrying forever.
 */
export function activeToolsFor(
  steps: StepResult<AgentTools>[],
  tools: AgentTools,
): (keyof AgentTools)[] | undefined {
  const failures = steps
    .flatMap((step) => step.toolResults)
    .filter((result) => result.toolName === EMIT_COMPONENT_TOOL && 'error' in (result.output as object)).length;

  if (failures < MAX_INVALID_COMPONENTS) return undefined; // all tools
  return (Object.keys(tools) as (keyof AgentTools)[]).filter((name) => name !== EMIT_COMPONENT_TOOL);
}

type StreamAgentOptions = {
  model: LanguageModel;
  tools: AgentTools;
  context: ChatContext;
  /** Aborting it (the client pressed Stop or disconnected) cancels the model call. */
  abortSignal?: AbortSignal;
};

/** Runs one agent turn and returns it as a UI message stream for `useChat`. */
export function streamAgent({ model, tools, context, abortSignal }: StreamAgentOptions) {
  const result = streamText({
    model,
    system: context.system,
    messages: context.messages,
    tools,
    stopWhen: stepCountIs(MAX_STEPS),
    prepareStep: ({ steps }) => ({ activeTools: activeToolsFor(steps, tools) }),
    abortSignal,
    onToolExecutionEnd: ({ toolCall, toolOutput, toolExecutionMs }) => {
      const line = `[tool] ${toolCall.toolName} in ${Math.round(toolExecutionMs)} ms`;
      if (toolOutput.type === 'tool-error') console.error(`${line}: failed`, toolCall.input, toolOutput.error);
      else console.log(line, toolCall.input);
    },
    onStepEnd: ({ stepNumber, finishReason, usage }) => {
      console.log(`[agent] step ${stepNumber + 1} ${finishReason}`, { in: usage.inputTokens, out: usage.outputTokens });
    },
  });

  return toUIMessageStream({
    stream: result.stream,
    onError: (error) => {
      console.error('[agent] stream error', error);
      // Never forward provider errors: they can echo request details.
      return 'The assistant could not answer. Please try again.';
    },
    onEnd: ({ isAborted, isCancelled }) => {
      if (isAborted || isCancelled) console.log('[agent] aborted by client');
    },
  });
}
