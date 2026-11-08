import { createAnthropic } from '@ai-sdk/anthropic';
import type { Hono } from 'hono';
import { createApp } from './create-app.js';
import { memoryCache, redisCache } from './lib/cache.js';
import { createServices } from './services/index.js';
import { createTools } from './tools/index.js';
import { loadEnv } from './lib/env.js';
import { startTracing } from './lib/telemetry.js';

// Vercel entry. `pnpm build` bundles this file (and the catalog package) into
// dist/index.js, which Vercel serves; its Hono detection needs the `from 'hono'`
// import, so hono stays external. Locally, src/dev.ts wraps the same app in a Node server.
// Exported so src/dev.ts reads the same parsed env instead of checking it twice.
export const env = loadEnv();
// Before any AI SDK call, so every chat turn is traced. A no-op without Langfuse keys.
const tracing = startTracing(env.langfuse);
const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });

// Composition root: everything is created here, once, and handed down.
const cache = env.redis ? redisCache(env.redis) : memoryCache();
const services = createServices({ cache, env });

const app: Hono = createApp({
  model: anthropic(env.CHAT_MODEL),
  tools: createTools(services),
  openTripMap: services.openTripMap,
  cache,
  accessCode: env.ACCESS_CODE,
  flushTracing: tracing.flush,
});

export default app;
