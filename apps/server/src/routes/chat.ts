import { Hono } from 'hono';
import { consumeStream, createUIMessageStreamResponse, type LanguageModel, type UIMessage } from 'ai';
import { z } from 'zod';
import { streamAgent } from '../lib/agent.js';
import { buildContext } from '../lib/context.js';

// Loose on purpose: the AI SDK owns the part shapes; we only check the envelope.
const ChatBodySchema = z.object({
  messages: z
    .array(
      z.looseObject({
        id: z.string(),
        role: z.enum(['system', 'user', 'assistant']),
        parts: z.array(z.looseObject({ type: z.string() })),
      }),
    )
    .min(1),
});

/** HTTP only: validate the request, hand it to the agent, return the stream. */
export function createChatRoute({ model }: { model: LanguageModel }) {
  const route = new Hono();

  route.post('/chat', async (c) => {
    const parsed = ChatBodySchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json({ error: 'Invalid request body' }, 400);
    }

    const context = await buildContext(parsed.data.messages as UIMessage[]);
    const stream = streamAgent({ model, context, abortSignal: c.req.raw.signal });

    // consumeSseStream keeps the stream draining after a disconnect so abort cleanup runs.
    return createUIMessageStreamResponse({ stream, consumeSseStream: consumeStream });
  });

  return route;
}
