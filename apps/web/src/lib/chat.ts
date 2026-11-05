import type { UIDataTypes, UIMessage } from 'ai';
import type { EMIT_COMPONENT_TOOL, EmitComponentInput, EmitComponentOutput } from 'catalog/schema';

/** The server's tools as the chat sees them, so tool parts are typed. */
export type ChatTools = {
  [EMIT_COMPONENT_TOOL]: { input: EmitComponentInput; output: EmitComponentOutput };
  getMockDay: { input: { city: string }; output: unknown };
};

export type ChatMessage = UIMessage<unknown, UIDataTypes, ChatTools>;
