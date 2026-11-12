import { propagateAttributes } from '@langfuse/tracing';
import { waitUntil } from '@vercel/functions';
import { stepCountIs, streamText, toUIMessageStream, type LanguageModel, type StepResult, type TextStreamPart } from 'ai';
import { EMIT_COMPONENT_TOOL } from '@trip-canvas/catalog/schema';
import type { AgentTools } from '../tools/index.js';
import type { ChatContext } from './context.js';

/** Enough for: fetch data → emit → one retry → closing text, with room to spare. */
export const MAX_STEPS = 6;

/** The first invalid component plus one retry; after that the model answers in text. */
export const MAX_INVALID_COMPONENTS = 2;

/**
 * A failed tool call's error as the AI SDK words it in the tool result it sends the
 * model (`getErrorMessage` of `@ai-sdk/provider`, which `ai` doesn't re-export).
 */
function describeToolError(error: unknown): string {
  if (error == null) return 'unknown error';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.toString();
  return JSON.stringify(error);
}

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
  /** The client's chat id; all turns of one chat share a Langfuse session. */
  chatId?: string;
  /** Aborting it (the client pressed Stop or disconnected) cancels the model call. */
  abortSignal?: AbortSignal;
  /** Called once the turn has ended, so its trace leaves before the function is frozen. */
  flushTracing?: () => Promise<void>;
};

/** Runs one agent turn and returns it as a UI message stream for `useChat`. */
export function streamAgent({ model, tools, context, chatId, abortSignal, flushTracing }: StreamAgentOptions) {
  // Names the trace and groups it by chat. Without tracing set up, it changes nothing.
  const result = propagateAttributes({ traceName: 'chat', sessionId: chatId }, () => streamText({
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
    telemetry: { functionId: 'chat' },
  }));

  // Errors of our own tools (a throw in `execute`, or input that failed the schema).
  // The model gets their message as the tool result, and the saved reply must keep that
  // same text: the next turn replays it, and a changed tool result breaks the signature
  // of every thinking block after it, so all later turns fail.
  const toolErrors = new WeakSet<object>();
  const stream = result.stream.pipeThrough(
    new TransformStream<TextStreamPart<AgentTools>, TextStreamPart<AgentTools>>({
      transform(part, controller) {
        const isOwnToolError = (part.type === 'tool-error' && !part.providerExecuted) || (part.type === 'tool-call' && part.invalid);
        if (isOwnToolError && part.error instanceof Object) toolErrors.add(part.error);
        controller.enqueue(part);
      },
    }),
  );

  return toUIMessageStream({
    stream,
    // webSearch's cited pages, shown under the reply.
    sendSources: true,
    onError: (error) => {
      // The AI SDK's own wording of the error, as sent to the model.
      if (error instanceof Object && toolErrors.has(error)) return describeToolError(error);
      console.error('[agent] stream error', error);
      // Never forward provider errors: they can echo request details.
      return 'The assistant could not answer. Please try again.';
    },
    onEnd: ({ isAborted, isCancelled }) => {
      if (isAborted || isCancelled) console.log('[agent] aborted by client');
      // On Vercel this keeps the function alive until the spans are sent.
      if (flushTracing) waitUntil(flushTracing().catch((err) => console.warn('[tracing] flush failed', err)));
    },
  });
}
