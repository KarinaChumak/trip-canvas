import { readFileSync } from 'node:fs';
import { convertToModelMessages, type ModelMessage, type UIMessage } from 'ai';

/** Context rule from the design: only the last 20 messages reach the model. */
export const MAX_HISTORY = 20;

// Read once at startup; the prompt is static until the catalog joins it in phase 2.
const SYSTEM_PROMPT = readFileSync(new URL('../prompts/system.md', import.meta.url), 'utf8').trim();

export type ChatContext = { system: string; messages: ModelMessage[] };

/**
 * Builds what the model sees for one turn. Phase 5 extends this with the
 * locked summary and the thread anchor, in the order the design fixes.
 */
export async function buildContext(messages: UIMessage[]): Promise<ChatContext> {
  return {
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages.slice(-MAX_HISTORY)),
  };
}
