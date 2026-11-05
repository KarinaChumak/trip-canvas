import type { MiddlewareHandler } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';

/**
 * Requires `Authorization: Bearer <code>` when a code is set; lets every request
 * through when it is not (local dev without ACCESS_CODE).
 */
export function requireAccessCode(code: string | undefined): MiddlewareHandler {
  if (!code) return (_c, next) => next();
  return bearerAuth({ token: code });
}
