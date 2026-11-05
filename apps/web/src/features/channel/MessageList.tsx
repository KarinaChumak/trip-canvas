import type { UIMessage } from 'ai';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Spinner } from '@/components/shadcn/spinner';

type MessageListProps = {
  messages: UIMessage[];
  /** True between sending and the first streamed token. */
  waiting: boolean;
};

export function MessageList({ messages, waiting }: MessageListProps) {
  return (
    <>
      {messages.map((message) => (
        <Message key={message.id} from={message.role}>
          <MessageContent>
            {message.parts.map((part, i) =>
              // Only text for now; phase 2 renders tool-render_ui parts as blocks.
              // MessageResponse renders markdown and copes with half-streamed syntax.
              part.type === 'text' ? <MessageResponse key={i}>{part.text}</MessageResponse> : null,
            )}
          </MessageContent>
        </Message>
      ))}
      {waiting && (
        <Message from="assistant">
          <MessageContent>
            <Spinner aria-label="Thinking" />
          </MessageContent>
        </Message>
      )}
    </>
  );
}
