import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveMessages } from '@/hooks/useSaveMessagesMutation';

// Node has no IndexedDB, like a browser that blocks it: the chat must still work.
describe('saveMessages without IndexedDB', () => {
  afterEach(() => vi.restoreAllMocks());

  it('saves without throwing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(saveMessages([{ id: '1', role: 'user', parts: [] }])).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
