import { afterEach, describe, expect, it, vi } from 'vitest';

const PRODUCTION_REWRITE = {
  source: '/api/:path*',
  destination: 'https://trip-canvas-server.vercel.app/api/:path*',
};
const BRANCH_HOST = 'trip-canvas-server-git-feat-map-view-karinachumaks-projects.vercel.app';

function stubRelatedProjects(branch?: string) {
  vi.stubEnv(
    'VERCEL_RELATED_PROJECTS',
    JSON.stringify([
      {
        project: { id: 'prj_server', name: 'trip-canvas-server' },
        production: { alias: 'trip-canvas-server.vercel.app' },
        preview: { branch },
      },
    ]),
  );
}

// vercel.ts builds its config on import, so each test imports it afresh after stubbing env.
async function loadConfig() {
  vi.resetModules();
  return (await import('../vercel')).config;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('vercel config', () => {
  it('rewrites production to the production server, as vercel.json did', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    stubRelatedProjects(BRANCH_HOST);

    const config = await loadConfig();
    expect(config.rewrites).toEqual([PRODUCTION_REWRITE]);
    expect(config.routes).toBeUndefined();
  });

  it('routes a preview to the same branch server preview, with the bypass secret', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('SERVER_PROTECTION_BYPASS', 'the-secret');
    stubRelatedProjects(BRANCH_HOST);

    const config = await loadConfig();
    expect(config.rewrites).toBeUndefined();
    expect(config.routes).toEqual([
      expect.objectContaining({
        dest: `https://${BRANCH_HOST}/api/$1`,
        transforms: [
          {
            type: 'request.headers',
            op: 'set',
            target: { key: 'x-vercel-protection-bypass' },
            args: '$SERVER_PROTECTION_BYPASS',
            env: ['SERVER_PROTECTION_BYPASS'],
          },
        ],
      }),
    ]);
    // Vercel resolves the secret per request; it is never baked into the config.
    expect(JSON.stringify(config)).not.toContain('the-secret');
  });

  it('falls back to the production server when a preview has no branch server', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('VERCEL_ENV', 'preview');
    stubRelatedProjects();

    expect((await loadConfig()).rewrites).toEqual([PRODUCTION_REWRITE]);
  });
});
