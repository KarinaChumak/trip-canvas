import { useChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { APICallError, DefaultChatTransport } from 'ai';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Spinner } from '@/components/shadcn/spinner';
import { accessHeaders, accessQueryKey } from '@/lib/access-code';
import type { ChatMessage } from '@/lib/chat';
import { useSaveMessagesMutation, useSavedMessagesQuery } from '@/lib/chat-storage';
import { ChannelHeader } from './ChannelHeader';
import { ChatError } from './ChatError';
import { Composer } from './Composer';
import { EmptyCanvas } from './EmptyCanvas';
import { MessageList } from './MessageList';

// Created once: a new transport per render would reset the chat.
const transport = new DefaultChatTransport<ChatMessage>({ api: '/api/chat', headers: accessHeaders });

/** Waits for the saved chat to load from IndexedDB, then shows it. */
export function Channel() {
  const { data: savedMessages } = useSavedMessagesQuery();

  if (!savedMessages) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner aria-label="Loading" />
      </div>
    );
  }
  return <MainChannel initialMessages={savedMessages} />;
}

type MainChannelProps = {
  /** Read once: useChat owns the messages from here on. */
  initialMessages: ChatMessage[];
};

/** The main channel: conversation (or empty state) above, composer below. */
function MainChannel({ initialMessages }: MainChannelProps) {
  const queryClient = useQueryClient();
  const { mutate: saveMessages } = useSaveMessagesMutation();
  const { messages, setMessages, sendMessage, status, stop, error, clearError, regenerate } =
    useChat<ChatMessage>({
      transport,
      messages: initialMessages,
      // Saved once per reply (also after Stop or an error), not on every token.
      onFinish: ({ messages: all }) => saveMessages(all),
      // A 401 means the code changed on the server: recheck it, so the code form comes
      // back instead of every message failing. Other errors show the Retry alert.
      onError: (error) => {
        if (APICallError.isInstance(error) && error.statusCode === 401) {
          void queryClient.invalidateQueries({ queryKey: accessQueryKey });
        }
      },
    });
  const busy = status === 'submitted' || status === 'streaming';
  const send = (text: string) => void sendMessage({ text });

  // Only offered while idle: after Stop, onFinish could still save the old chat back.
  function startNewChat() {
    setMessages([]);
    clearError();
    saveMessages([]);
  }

  return (
    // The conversation scrolls across the full window width, so its scrollbar sits at
    // the window edge; only the content inside is limited to the column width.
    <div className="flex h-dvh w-full flex-col">
      <ChannelHeader canStartNew={messages.length > 0} busy={busy} onNewChat={startNewChat} />
      {messages.length === 0 ? (
        <EmptyCanvas onPick={send} />
      ) : (
        // Sticks to the bottom while text streams in, with a jump-to-latest button.
        <Conversation>
          <ConversationContent className="mx-auto w-full max-w-3xl px-8">
            <MessageList messages={messages} waiting={status === 'submitted'} />
            {error && <ChatError onRetry={() => void regenerate()} />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}
      <div className="mx-auto w-full max-w-3xl px-4">
        <Composer busy={busy} onSend={send} onStop={stop} />
      </div>
    </div>
  );
}
