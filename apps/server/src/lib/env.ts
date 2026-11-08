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
    // Google Maps Platform key with the Routes API enabled, for findConnections.
    GOOGLE_MAPS_API_KEY: z.string({ error: 'is required' }).trim().min(1, 'is required'),
    // Ignav fare search (D-046), for searchFlights.
    IGNAV_API_KEY: z.string({ error: 'is required' }).trim().min(1, 'is required'),
    // Cache store. Unset locally: an in-memory cache. Vercel's Upstash integration
    // may inject the KV_* names instead, as @upstash/redis also accepts.
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().trim().min(1).optional(),
    KV_REST_API_URL: z.url().optional(),
    KV_REST_API_TOKEN: z.string().trim().min(1).optional(),
    // Langfuse project keys for tracing (tokens, cost, tool and API calls per chat
    // turn). Unset: tracing is off. cloud.langfuse.com is the EU region.
    LANGFUSE_PUBLIC_KEY: z.string().trim().min(1).optional(),
    LANGFUSE_SECRET_KEY: z.string().trim().min(1).optional(),
    LANGFUSE_BASE_URL: z.url().default('https://cloud.langfuse.com'),
    // Set to "1" by Vercel on every deployment.
    VERCEL: z.string().optional(),
    // "production", "preview" or "development", set by Vercel.
    VERCEL_ENV: z.string().optional(),
  })
  // A deployed server without a code would let anyone spend the Anthropic key.
  .refine((env) => !env.VERCEL || env.ACCESS_CODE, {
    path: ['ACCESS_CODE'],
    message: 'is required on Vercel',
  })
  // One key without the other is a typo, not "tracing off".
  .refine((env) => !env.LANGFUSE_PUBLIC_KEY === !env.LANGFUSE_SECRET_KEY, {
    path: ['LANGFUSE_SECRET_KEY'],
    message: 'set both Langfuse keys or neither',
  })
  .transform(
    ({
      VERCEL: _vercel,
      UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN,
      KV_REST_API_URL,
      KV_REST_API_TOKEN,
      LANGFUSE_PUBLIC_KEY,
      LANGFUSE_SECRET_KEY,
      LANGFUSE_BASE_URL,
      VERCEL_ENV,
      ...env
    }) => {
      const url = UPSTASH_REDIS_REST_URL ?? KV_REST_API_URL;
      const token = UPSTASH_REDIS_REST_TOKEN ?? KV_REST_API_TOKEN;
      const langfuse =
        LANGFUSE_PUBLIC_KEY && LANGFUSE_SECRET_KEY
          ? {
              publicKey: LANGFUSE_PUBLIC_KEY,
              secretKey: LANGFUSE_SECRET_KEY,
              baseUrl: LANGFUSE_BASE_URL,
              // Keeps prod, preview and local runs apart in Langfuse.
              environment: VERCEL_ENV ?? 'local',
            }
          : undefined;
      return { ...env, redis: url && token ? { url, token } : undefined, langfuse };
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
