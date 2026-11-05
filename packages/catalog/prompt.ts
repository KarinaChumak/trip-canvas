import { components } from './catalog.js';
import { EMIT_COMPONENT_TOOL } from './schema.js';

/**
 * The catalog part of the system prompt: which components exist and when to use
 * them. The props themselves reach the model through the tool's input schema.
 * (json-render's `catalog.prompt()` describes JSONL patch output, not a tool call.)
 */
export function buildCatalogPrompt(): string {
  const tool = `\`${EMIT_COMPONENT_TOOL}\``;
  const list = Object.entries(components)
    .map(([name, { description }]) => `- ${name}: ${description}`)
    .join('\n');

  return [
    '## UI components',
    `Show structured answers by calling the ${tool} tool with one of these components:`,
    list,
    `Call ${tool} once per component. Keep the text around it short and do not repeat its data in prose.`,
    `If ${tool} returns an error, fix the fields it names and call it again once. If it fails again, answer in plain text.`,
  ].join('\n\n');
}
