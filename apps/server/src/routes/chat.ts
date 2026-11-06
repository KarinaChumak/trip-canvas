import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { consumeStream, createUIMessageStreamResponse, type LanguageModel, type UIMessage } from 'ai';
import { z } from 'zod';
import { streamAgent } from '../lib/agent.js';
import { buildContext } from '../lib/context.js';
import type { AgentTools } from '../tools/index.js';

/** Far above 20 turns with tool results; anything bigger is not a real chat. */
export const MAX_BODY_BYTES = 1024 * 1024;

// Loose on purpose: the AI SDK owns the part shapes; we only check the envelope.
// No `system` role: the server writes the system prompt, a client never sends one.
const ChatBodySchema = z.object({
  messages: z
    .array(
      z.looseObject({
        id: z.string(),
        role: z.enum(['user', 'assistant']),
        parts: z.array(z.looseObject({ type: z.string() })),
      }),
    )
    .min(1),
});

type ChatRouteDeps = { model: LanguageModel; tools: AgentTools };

/** HTTP only: validate the request, hand it to the agent, return the stream. */
export function createChatRoute({ model, tools }: ChatRouteDeps) {
  const route = new Hono();

  route.post(
    '/chat',
    bodyLimit({ maxSize: MAX_BODY_BYTES, onError: (c) => c.json({ error: 'Request body is too large' }, 413) }),
    async (c) => {
      const parsed = ChatBodySchema.safeParse(await c.req.json().catch(() => null));
      if (!parsed.success) {
        return c.json({ error: 'Invalid request body' }, 400);
      }

      const context = await buildContext(parsed.data.messages as UIMessage[]);
      const stream = streamAgent({ model, tools, context, abortSignal: c.req.raw.signal });

      // consumeSseStream keeps the stream draining after a disconnect so abort cleanup runs.
      return createUIMessageStreamResponse({ stream, consumeSseStream: consumeStream });
    },
  );

  return route;
}
