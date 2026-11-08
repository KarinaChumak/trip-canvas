import { describe, expect, it } from 'vitest';
import { parseEnv } from '../../src/lib/env.js';

// The variables every environment needs.
const REQUIRED = { ANTHROPIC_API_KEY: 'k', RAPIDAPI_KEY: 'rapid', GOOGLE_MAPS_API_KEY: 'google' };

describe('parseEnv', () => {
  it('fails with a message naming the missing key', () => {
    expect(() => parseEnv({})).toThrow(/ANTHROPIC_API_KEY/);
  });

  it('treats an empty key as missing', () => {
    expect(() => parseEnv({ ANTHROPIC_API_KEY: '' })).toThrow(/ANTHROPIC_API_KEY/);
  });

  it('applies defaults for PORT and CHAT_MODEL, including empty values', () => {
    const env = parseEnv({ ...REQUIRED, ANTHROPIC_API_KEY: 'test-key', PORT: '', CHAT_MODEL: '' });
    expect(env).toEqual({
      ANTHROPIC_API_KEY: 'test-key',
      PORT: 8787,
      CHAT_MODEL: 'claude-haiku-5-5',
      NOMINATIM_USER_AGENT: expect.stringContaining('trip-canvas'),
      RAPIDAPI_KEY: 'rapid',
      GOOGLE_MAPS_API_KEY: 'google',
      redis: undefined,
    });
  });

  it('requires RAPIDAPI_KEY', () => {
    expect(() => parseEnv({ ANTHROPIC_API_KEY: 'k' })).toThrow(/RAPIDAPI_KEY/);
  });

  it('requires GOOGLE_MAPS_API_KEY', () => {
    expect(() => parseEnv({ ...REQUIRED, GOOGLE_MAPS_API_KEY: ' ' })).toThrow(/GOOGLE_MAPS_API_KEY/);
  });

  it('coerces PORT to a number', () => {
    expect(parseEnv({ ...REQUIRED, PORT: '9000' }).PORT).toBe(9000);
  });

  it('requires ACCESS_CODE on Vercel', () => {
    expect(() => parseEnv({ ...REQUIRED, VERCEL: '1' })).toThrow(/ACCESS_CODE/);
    expect(parseEnv({ ...REQUIRED, VERCEL: '1', ACCESS_CODE: 'c' }).ACCESS_CODE).toBe('c');
  });

  it('leaves ACCESS_CODE optional locally', () => {
    expect(parseEnv(REQUIRED).ACCESS_CODE).toBeUndefined();
  });

  it('reads Redis from the UPSTASH_* or the KV_* names', () => {
    const redis = { url: 'https://example.upstash.io', token: 't' };
    expect(parseEnv({ ...REQUIRED, UPSTASH_REDIS_REST_URL: redis.url, UPSTASH_REDIS_REST_TOKEN: 't' }).redis).toEqual(redis);
    expect(parseEnv({ ...REQUIRED, KV_REST_API_URL: redis.url, KV_REST_API_TOKEN: 't' }).redis).toEqual(redis);
  });

  it('leaves Redis off unless both URL and token are set', () => {
    expect(parseEnv({ ...REQUIRED, UPSTASH_REDIS_REST_URL: 'https://example.upstash.io' }).redis).toBeUndefined();
  });

  it('turns tracing on only when both Langfuse keys are set', () => {
    expect(parseEnv(REQUIRED).langfuse).toBeUndefined();
    expect(parseEnv({ ...REQUIRED, LANGFUSE_PUBLIC_KEY: 'pk', LANGFUSE_SECRET_KEY: 'sk' }).langfuse).toEqual({
      publicKey: 'pk',
      secretKey: 'sk',
      baseUrl: 'https://cloud.langfuse.com',
      environment: 'local',
    });
  });

  it('tags traces with the Vercel environment', () => {
    const env = parseEnv({ ...REQUIRED, LANGFUSE_PUBLIC_KEY: 'pk', LANGFUSE_SECRET_KEY: 'sk', VERCEL_ENV: 'preview' });
    expect(env.langfuse?.environment).toBe('preview');
  });

  it('rejects only one Langfuse key', () => {
    expect(() => parseEnv({ ...REQUIRED, LANGFUSE_PUBLIC_KEY: 'pk' })).toThrow(/LANGFUSE_SECRET_KEY/);
  });
});
