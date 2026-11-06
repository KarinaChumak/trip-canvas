// Phase 2 saves the chat as one list. Phase 4 replaces this with a store that also
// keeps per-component state.
export const MESSAGES_KEY = 'trip-canvas:messages';
export const messagesQueryKey = ['chat', 'messages'] as const;
