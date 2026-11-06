import { deploymentEnv, routes, type VercelConfig } from '@vercel/config/v1';
import { withRelatedProject } from '@vercel/related-projects';

// Vercel runs this file at build time and uses `config` in place of a vercel.json.
// Production sends `/api/*` to the production server, as vercel.json did. Each preview sends it
// to the server preview built from the same branch, so catalog and prompt changes can be tried
// on the web preview before they merge.
// Only `config` is exported: Vercel may read other named exports as config keys.

const PRODUCTION_SERVER = 'https://trip-canvas-server.vercel.app';
const SERVER_PROJECT_NAME = 'trip-canvas-server';
// trip-canvas-server → Settings → General → Project ID. Vercel then sets
// VERCEL_RELATED_PROJECTS on web deployments, with the server's branch preview host.
const SERVER_PROJECT_ID = 'prj_REPLACE_WITH_SERVER_PROJECT_ID';
// Server previews sit behind Vercel Authentication. This web env var (Preview only) holds the
// server project's "Protection Bypass for Automation" secret. Vercel fills it in per request,
// so the secret stays out of the build output and never reaches the browser.
const BYPASS_ENV = 'SERVER_PROTECTION_BYPASS';

function branchServer(): string | undefined {
  if (process.env.VERCEL_ENV !== 'preview') return undefined;
  const origin = withRelatedProject({ projectName: SERVER_PROJECT_NAME, defaultHost: '' });
  if (!origin) {
    console.warn(`[vercel.ts] no ${SERVER_PROJECT_NAME} preview found; /api goes to production`);
    return undefined;
  }
  if (!process.env[BYPASS_ENV]) {
    console.warn(`[vercel.ts] ${BYPASS_ENV} is not set; the server preview will refuse /api`);
  }
  return origin;
}

const server = branchServer();

export const config: VercelConfig = {
  relatedProjects: [SERVER_PROJECT_ID],
  // A rewrite that sets a request header compiles to a `routes` entry, and vercel.json can't
  // mix `routes` with `rewrites`, so each case uses one of them.
  ...(server
    ? {
        routes: [
          routes.rewrite('/api/:path*', `${server}/api/:path*`, {
            requestHeaders: { 'x-vercel-protection-bypass': deploymentEnv(BYPASS_ENV) },
          }),
        ],
      }
    : { rewrites: [routes.rewrite('/api/:path*', `${PRODUCTION_SERVER}/api/:path*`)] }),
};
