import { useMutation, useQueryClient } from '@tanstack/react-query';
import { set } from 'idb-keyval';
import type { ChatMessage } from '@/lib/chat';
import { MESSAGES_KEY, messagesQueryKey } from '@/lib/chat-storage';

/** Saves the whole chat; the app keeps working (without saving) if this fails. */
export async function saveMessages(messages: ChatMessage[]): Promise<void> {
  try {
    await set(MESSAGES_KEY, messages);
  } catch (error) {
    console.warn('[chat-storage] could not write IndexedDB', error);
  }
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
