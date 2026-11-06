import { createAnthropic } from '@ai-sdk/anthropic';
import type { Hono } from 'hono';
import { createApp } from './create-app.js';
import { memoryCache, redisCache } from './lib/cache.js';
import { createTools } from './tools/index.js';
import { loadEnv } from './lib/env.js';

// Vercel entry. `pnpm build` bundles this file (and the catalog package) into
// dist/index.js, which Vercel serves; its Hono detection needs the `from 'hono'`
// import, so hono stays external. Locally, src/dev.ts wraps the same app in a Node server.
const env = loadEnv();
const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });

// Composition root: everything is created here, once, and handed down.
const cache = env.redis ? redisCache(env.redis) : memoryCache();

const app: Hono = createApp({
  model: anthropic(env.CHAT_MODEL),
  tools: createTools(),
  cache,
  accessCode: env.ACCESS_CODE,
});

export default app;
