import { readFileSync } from 'node:fs';
import { convertToModelMessages, type ModelMessage, type UIMessage } from 'ai';
import { buildCatalogPrompt } from 'catalog/prompt';

/** Context rule from the design: only the last 20 messages reach the model. */
export const MAX_HISTORY = 20;

// Built once at startup: the base prompt, then the catalog part (design: context assembly, step 1).
const SYSTEM_PROMPT = [
  readFileSync(new URL('../prompts/system.md', import.meta.url), 'utf8').trim(),
  buildCatalogPrompt(),
].join('\n\n');

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
