import { serve } from '@hono/node-server';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createApp } from './app.js';
import { loadEnv } from './lib/env.js';

const env = loadEnv();
const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
const app = createApp({ model: anthropic(env.CHAT_MODEL) });

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`server listening on http://localhost:${info.port} (model ${env.CHAT_MODEL})`);
});
