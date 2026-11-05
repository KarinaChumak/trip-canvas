import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, set } from 'idb-keyval';
import type { ChatMessage } from './chat';

// Phase 2 saves the chat as one list. Phase 4 replaces this with a store that also
// keeps per-component state.
const MESSAGES_KEY = 'trip-canvas:messages';
const messagesQueryKey = ['chat', 'messages'] as const;

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

/** Saves the whole chat; the app keeps working (without saving) if this fails. */
export async function saveMessages(messages: ChatMessage[]): Promise<void> {
  try {
    await set(MESSAGES_KEY, messages);
  } catch (error) {
    console.warn('[chat-storage] could not write IndexedDB', error);
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

/**
 * Saves the chat to IndexedDB. The cached copy is updated too, so anything that
 * reads the query (e.g. after a remount) sees the saved chat without reloading it.
 */
export function useSaveMessagesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveMessages,
    onMutate: (messages) => queryClient.setQueryData(messagesQueryKey, messages),
  });
}
