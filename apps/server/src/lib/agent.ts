import { streamText, toUIMessageStream, type LanguageModel } from 'ai';
import type { ChatContext } from './context.js';

type StreamAgentOptions = {
  model: LanguageModel;
  context: ChatContext;
  /** Aborting it (the client pressed Stop or disconnected) cancels the model call. */
  abortSignal?: AbortSignal;
};

/** Runs one agent turn and returns it as a UI message stream for `useChat`. */
export function streamAgent({ model, context, abortSignal }: StreamAgentOptions) {
  const result = streamText({
    model,
    system: context.system,
    messages: context.messages,
    abortSignal,
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
