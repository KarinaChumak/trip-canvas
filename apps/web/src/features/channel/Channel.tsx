import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { ChatError } from './ChatError';
import { Composer } from './Composer';
import { EmptyCanvas } from './EmptyCanvas';
import { MessageList } from './MessageList';

// Created once: a new transport per render would reset the chat.
const transport = new DefaultChatTransport({ api: '/api/chat' });

/** The main channel: conversation (or empty state) above, composer below. */
export function Channel() {
  const { messages, sendMessage, status, stop, error, regenerate } = useChat({ transport });
  const busy = status === 'submitted' || status === 'streaming';
  const send = (text: string) => void sendMessage({ text });

  return (
    <div className="mx-auto flex h-dvh w-full max-w-3xl flex-col px-4">
      {messages.length === 0 ? (
        <EmptyCanvas onPick={send} />
      ) : (
        // Sticks to the bottom while text streams in, with a jump-to-latest button.
        <Conversation>
          <ConversationContent>
            <MessageList messages={messages} waiting={status === 'submitted'} />
            {error && <ChatError onRetry={() => void regenerate()} />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}
      <Composer busy={busy} onSend={send} onStop={stop} />
    </div>
  );
}
