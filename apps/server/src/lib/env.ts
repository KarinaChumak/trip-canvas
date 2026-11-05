import { z } from 'zod';

const EnvSchema = z
  .object({
    ANTHROPIC_API_KEY: z.string({ error: 'is required' }).trim().min(1, 'is required'),
    PORT: z.coerce.number().int().positive().default(8787),
    // Small, fast model by default; override in .env if answers are weak.
    CHAT_MODEL: z.string().trim().min(1).default('claude-haiku-5-5'),
    // Shared code the web app sends as a bearer token. Unset locally: no check.
    ACCESS_CODE: z.string().trim().min(1).optional(),
    // Set to "1" by Vercel on every deployment.
    VERCEL: z.string().optional(),
  })
  // A deployed server without a code would let anyone spend the Anthropic key.
  .refine((env) => !env.VERCEL || env.ACCESS_CODE, {
    path: ['ACCESS_CODE'],
    message: 'is required on Vercel',
  })
  .transform(({ VERCEL: _vercel, ...env }) => env);

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
