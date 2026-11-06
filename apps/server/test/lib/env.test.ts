import { describe, expect, it } from 'vitest';
import { parseEnv } from '../../src/lib/env.js';

describe('parseEnv', () => {
  it('fails with a message naming the missing key', () => {
    expect(() => parseEnv({})).toThrow(/ANTHROPIC_API_KEY/);
  });

  it('treats an empty key as missing', () => {
    expect(() => parseEnv({ ANTHROPIC_API_KEY: '' })).toThrow(/ANTHROPIC_API_KEY/);
  });

  it('applies defaults for PORT and CHAT_MODEL, including empty values', () => {
    const env = parseEnv({ ANTHROPIC_API_KEY: 'test-key', PORT: '', CHAT_MODEL: '' });
    expect(env).toEqual({
      ANTHROPIC_API_KEY: 'test-key',
      PORT: 8787,
      CHAT_MODEL: 'claude-haiku-5-5',
      redis: undefined,
    });
  });

  it('coerces PORT to a number', () => {
    expect(parseEnv({ ANTHROPIC_API_KEY: 'k', PORT: '9000' }).PORT).toBe(9000);
  });

  it('requires ACCESS_CODE on Vercel', () => {
    expect(() => parseEnv({ ANTHROPIC_API_KEY: 'k', VERCEL: '1' })).toThrow(/ACCESS_CODE/);
    expect(parseEnv({ ANTHROPIC_API_KEY: 'k', VERCEL: '1', ACCESS_CODE: 'c' }).ACCESS_CODE).toBe('c');
  });

  it('leaves ACCESS_CODE optional locally', () => {
    expect(parseEnv({ ANTHROPIC_API_KEY: 'k' }).ACCESS_CODE).toBeUndefined();
  });

  it('reads Redis from the UPSTASH_* or the KV_* names', () => {
    const redis = { url: 'https://example.upstash.io', token: 't' };
    expect(parseEnv({ ANTHROPIC_API_KEY: 'k', UPSTASH_REDIS_REST_URL: redis.url, UPSTASH_REDIS_REST_TOKEN: 't' }).redis).toEqual(redis);
    expect(parseEnv({ ANTHROPIC_API_KEY: 'k', KV_REST_API_URL: redis.url, KV_REST_API_TOKEN: 't' }).redis).toEqual(redis);
  });

  it('leaves Redis off unless both URL and token are set', () => {
    expect(parseEnv({ ANTHROPIC_API_KEY: 'k', UPSTASH_REDIS_REST_URL: 'https://example.upstash.io' }).redis).toBeUndefined();
  });
});
