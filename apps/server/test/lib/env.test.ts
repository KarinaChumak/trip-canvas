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
    });
  });

  it('coerces PORT to a number', () => {
    expect(parseEnv({ ANTHROPIC_API_KEY: 'k', PORT: '9000' }).PORT).toBe(9000);
  });
});
