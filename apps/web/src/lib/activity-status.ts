import type { ChatMessage } from './chat';

type Part = ChatMessage['parts'][number];

/** Words for a tool call that is still running; inputs may be half-streamed. */
function toolLabel(part: Part): string | null {
  switch (part.type) {
    case 'tool-geocode':
      return part.input?.query ? `Looking up ${part.input.query}` : 'Looking up the place';
    case 'tool-getWeather':
      return part.input?.place ? `Checking the weather in ${part.input.place}` : 'Checking the weather';
    case 'tool-searchPlaces':
      return 'Finding places nearby';
    case 'tool-webSearch':
      return part.input?.query ? `Searching the web for “${part.input.query}”` : 'Searching the web';
    default:
      return null;
  }
}

/** True while a tool call's input streams in or the tool is running; false once it has a result. */
export function isToolRunning(part: Part): boolean {
  return 'state' in part && (part.state === 'input-streaming' || part.state === 'input-available');
}

/**
 * What the assistant is doing while a reply streams, for the status line under it:
 * the running tool, or "Thinking" between steps. Null when reply text is streaming
 * or a component is being drawn (it shows its own skeleton), since those already
 * show progress.
 */
export function activityLabel(parts: ChatMessage['parts']): string | null {
  const last = parts.at(-1);
  if (last?.type === 'text' && last.state !== 'done') return null;
  if (last?.type === 'tool-emit_component' && isToolRunning(last)) return null;

  // The latest running tool wins; the model can call several in one step.
  const running = parts.filter(isToolRunning).map(toolLabel).filter((label) => label !== null);
  return running.at(-1) ?? 'Thinking';
}
