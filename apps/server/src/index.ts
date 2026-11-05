import { createAnthropic } from '@ai-sdk/anthropic';
import type { Hono } from 'hono';
import { createApp } from './create-app.js';
import { loadEnv } from './lib/env.js';

// Vercel entry: Vercel detects this file and serves its default export as a function.
// Its Hono detection only accepts an entry that imports from 'hono' itself.
// Locally, src/dev.ts wraps the same app in a Node server.
const env = loadEnv();
const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });

const app: Hono = createApp({ model: anthropic(env.CHAT_MODEL) });

export default app;
