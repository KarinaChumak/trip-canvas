import { serve } from '@hono/node-server';
import app from './index.js';
import { loadEnv } from './lib/env.js';

// Local dev server only; on Vercel, src/index.ts is the entry and no server is started.
const { PORT, CHAT_MODEL } = loadEnv();

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`server listening on http://localhost:${info.port} (model ${CHAT_MODEL})`);
});
