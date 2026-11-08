import { Hono } from 'hono';
import { except } from 'hono/combine';
import { logger } from 'hono/logger';
import type { LanguageModel } from 'ai';
import type { Cache } from './lib/cache.js';
import { requireAccessCode } from './middleware/access-code.js';
import { createChatRoute } from './routes/chat.js';
import { createPlacesRoute } from './routes/places.js';
import type { Services } from './services/index.js';
import type { AgentTools } from './tools/index.js';

export type AppDeps = {
  /** The model the agent loop calls. Injected so tests can pass a mock. */
  model: LanguageModel;
  /** The tools the agent can call, already wired to their services. */
  tools: AgentTools;
  /** Serves place details to the web app's PlaceCards, outside the agent loop. */
  openTripMap: Services['openTripMap'];
  /** Redis on Vercel, memory locally and in tests; the keepalive route writes to it. */
  cache: Cache;
  /** When set, every /api route except health and keepalive needs `Authorization: Bearer <code>`. */
  accessCode?: string;
  /** Sends waiting trace spans after each chat turn; left out where tracing is off. */
  flushTracing?: () => Promise<void>;
};

/** Builds the Hono app with every route; no server is started here. */
export function createApp({ model, tools, openTripMap, cache, accessCode, flushTracing }: AppDeps) {
  const app = new Hono();

  // One line per request: method, path, status and time.
  app.use('/api/*', logger());
  // Vercel Cron can't send the access code; keepalive only writes one small key.
  app.use('/api/*', except(['/api/health', '/api/keepalive'], requireAccessCode(accessCode)));
  app.get('/api/health', (c) => c.json({ ok: true }));
  // A daily cron calls this so Upstash doesn't archive the idle free database.
  app.get('/api/keepalive', async (c) => {
    await cache.set('keepalive', new Date().toISOString(), 7 * 24 * 60 * 60);
    return c.json({ ok: true });
  });
  // The web app calls this to check a code before showing the chat.
  app.get('/api/access', (c) => c.json({ ok: true }));
  app.route('/api', createChatRoute({ model, tools, flushTracing }));
  app.route('/api', createPlacesRoute({ openTripMap }));

  return app;
}
