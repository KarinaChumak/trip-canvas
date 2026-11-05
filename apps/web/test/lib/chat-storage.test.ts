import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadMessages, saveMessages } from '@/lib/chat-storage';

// Node has no IndexedDB, like a browser that blocks it: the chat must still work.
describe('chat storage without IndexedDB', () => {
  afterEach(() => vi.restoreAllMocks());

  it('loads an empty chat and saves without throwing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await loadMessages()).toEqual([]);
    await expect(saveMessages([{ id: '1', role: 'user', parts: [] }])).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
