import { serve } from '@hono/node-server';
import app, { env } from './index.js';

// Local dev server only; on Vercel, src/index.ts is the entry and no server is started.
const { PORT, CHAT_MODEL } = env;

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`server listening on http://localhost:${info.port} (model ${CHAT_MODEL})`);
});
