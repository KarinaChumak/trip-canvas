import type { UIDataTypes, UIMessage } from 'ai';
import type { EMIT_COMPONENT_TOOL, EmitComponentInput, EmitComponentOutput } from 'catalog/schema';

/** The server's tools as the chat sees them, so tool parts are typed. */
export type ChatTools = {
  [EMIT_COMPONENT_TOOL]: { input: EmitComponentInput; output: EmitComponentOutput };
  // Only the inputs the status line reads; outputs aren't shown directly.
  geocode: { input: { query: string }; output: unknown };
  getWeather: { input: { place: string }; output: unknown };
  searchPlaces: { input: Record<string, unknown>; output: unknown };
  // Run by Anthropic; the page contents come back encrypted, so the UI only reads the query.
  webSearch: { input: { query: string }; output: unknown };
};

export type ChatMessage = UIMessage<unknown, UIDataTypes, ChatTools>;
