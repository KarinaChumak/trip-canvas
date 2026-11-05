import { Hono } from 'hono';
import { except } from 'hono/combine';
import type { LanguageModel } from 'ai';
import { requireAccessCode } from './middleware/access-code.js';
import { createChatRoute } from './routes/chat.js';

export type AppDeps = {
  /** The model the agent loop calls. Injected so tests can pass a mock. */
  model: LanguageModel;
  /** When set, every /api route except health needs `Authorization: Bearer <code>`. */
  accessCode?: string;
};

/** Builds the Hono app with every route; no server is started here. */
export function createApp({ model, accessCode }: AppDeps) {
  const app = new Hono();

  app.use('/api/*', except('/api/health', requireAccessCode(accessCode)));
  app.get('/api/health', (c) => c.json({ ok: true }));
  // The web app calls this to check a code before showing the chat.
  app.get('/api/access', (c) => c.json({ ok: true }));
  app.route('/api', createChatRoute({ model }));

  return app;
}
