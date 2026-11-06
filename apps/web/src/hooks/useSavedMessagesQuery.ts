import { useQuery } from '@tanstack/react-query';
import { get } from 'idb-keyval';
import type { ChatMessage } from '@/lib/chat';
import { MESSAGES_KEY, messagesQueryKey } from '@/lib/chat-storage';

/** The saved chat, or an empty one when IndexedDB is empty, missing or blocked. */
export async function loadMessages(): Promise<ChatMessage[]> {
  try {
    const saved = await get<unknown>(MESSAGES_KEY);
    return Array.isArray(saved) ? (saved as ChatMessage[]) : [];
  } catch (error) {
    console.warn('[chat-storage] could not read IndexedDB', error);
    return [];
  }
}

/** The saved chat; `data` is undefined while IndexedDB is still being read. */
export function useSavedMessagesQuery() {
  return useQuery({
    queryKey: messagesQueryKey,
    queryFn: loadMessages,
    // Only this tab writes the chat, and the mutation keeps the cache current,
    // so there is nothing to refetch.
    staleTime: Infinity,
  });
}
