import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadMessages } from '@/hooks/useSavedMessagesQuery';

// Node has no IndexedDB, like a browser that blocks it: the chat must still work.
describe('loadMessages without IndexedDB', () => {
  afterEach(() => vi.restoreAllMocks());

  it('loads an empty chat', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await loadMessages()).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
