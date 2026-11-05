import { Hono } from 'hono';
import type { LanguageModel } from 'ai';
import { createChatRoute } from './routes/chat.js';

export type AppDeps = {
  /** The model the agent loop calls. Injected so tests can pass a mock. */
  model: LanguageModel;
};

/** Builds the Hono app with every route; no server is started here. */
export function createApp({ model }: AppDeps) {
  const app = new Hono();

  app.get('/api/health', (c) => c.json({ ok: true }));
  app.route('/api', createChatRoute({ model }));

  return app;
}
