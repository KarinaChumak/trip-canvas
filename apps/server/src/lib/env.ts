import { z } from 'zod';

const EnvSchema = z
  .object({
    ANTHROPIC_API_KEY: z.string({ error: 'is required' }).trim().min(1, 'is required'),
    PORT: z.coerce.number().int().positive().default(8787),
    // Small, fast model by default; override in .env if answers are weak.
    CHAT_MODEL: z.string().trim().min(1).default('claude-haiku-5-5'),
    // Shared code the web app sends as a bearer token. Unset locally: no check.
    ACCESS_CODE: z.string().trim().min(1).optional(),
    // Nominatim asks for a User-Agent that identifies the app.
    NOMINATIM_USER_AGENT: z.string().trim().min(1).default('trip-canvas-demo'),
    // RapidAPI account key, for OpenTripMap's places API (free Basic plan). Required
    // everywhere so searchPlaces always works.
    RAPIDAPI_KEY: z.string({ error: 'is required' }).trim().min(1, 'is required'),
    // Cache store. Unset locally: an in-memory cache. Vercel's Upstash integration
    // may inject the KV_* names instead, as @upstash/redis also accepts.
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().trim().min(1).optional(),
    KV_REST_API_URL: z.url().optional(),
    KV_REST_API_TOKEN: z.string().trim().min(1).optional(),
    // Set to "1" by Vercel on every deployment.
    VERCEL: z.string().optional(),
  })
  // A deployed server without a code would let anyone spend the Anthropic key.
  .refine((env) => !env.VERCEL || env.ACCESS_CODE, {
    path: ['ACCESS_CODE'],
    message: 'is required on Vercel',
  })
  .transform(
    ({
      VERCEL: _vercel,
      UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN,
      KV_REST_API_URL,
      KV_REST_API_TOKEN,
      ...env
    }) => {
      const url = UPSTASH_REDIS_REST_URL ?? KV_REST_API_URL;
      const token = UPSTASH_REDIS_REST_TOKEN ?? KV_REST_API_TOKEN;
      return { ...env, redis: url && token ? { url, token } : undefined };
    },
  );

export type Env = z.infer<typeof EnvSchema>;

/** Parses the environment, throwing a readable error that names each bad variable. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  // Treat empty strings as unset so `PORT=` in .env falls back to the default.
  const cleaned = Object.fromEntries(
    Object.entries(source).filter(([, v]) => v !== undefined && v !== ''),
  );
  const result = EnvSchema.safeParse(cleaned);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`);
    throw new Error(
      `Invalid server environment:\n${lines.join('\n')}\nSet these in apps/server/.env (see .env.example).`,
    );
  }
  return result.data;
}

/** Fail fast on start: print the problem and exit instead of failing on the first request. */
export function loadEnv(): Env {
  try {
    return parseEnv(process.env);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}
