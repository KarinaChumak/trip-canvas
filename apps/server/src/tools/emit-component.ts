import { jsonSchema, tool } from 'ai';
import {
  emitComponentJsonSchema,
  validateEmitComponent,
  type EmitComponentInput,
} from 'catalog/schema';

export type EmitComponentOutput = { ok: true } | { error: string };

/**
 * The model calls this to hand one catalog component to the web app, which displays
 * it. Nothing is rendered here: `execute` only checks the input, and the result goes
 * back to the model so it can fix a bad spec once (see `lib/agent.ts`).
 */
export const emitComponent = tool({
  description:
    'Show the user one UI component from the catalog. Pass the component type and all of its props.',
  // No `validate` on purpose: invalid input must reach `execute`, so the model gets
  // a readable error it can fix instead of a failed tool call.
  inputSchema: jsonSchema<EmitComponentInput>(emitComponentJsonSchema),
  execute: async (input): Promise<EmitComponentOutput> => {
    const result = validateEmitComponent(input);
    if (result.ok) return { ok: true };
    console.warn('[emit_component] invalid input', result.error);
    return { error: `The component is invalid. Fix these fields and call the tool again:\n${result.error}` };
  },
});
