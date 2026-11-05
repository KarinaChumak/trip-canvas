import { EMIT_COMPONENT_TOOL } from 'catalog/schema';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Spinner } from '@/components/shadcn/spinner';
import { Block, BlockSkeleton } from '@/blocks/Block';
import type { ChatMessage } from '@/lib/chat';

type MessageListProps = {
  messages: ChatMessage[];
  /** True between sending and the first streamed token. */
  waiting: boolean;
};

type MessagePartProps = {
  part: ChatMessage['parts'][number];
};

/** One part of a message: text, a component, or nothing for data tools and step markers. */
function MessagePart({ part }: MessagePartProps) {
  if (part.type === 'text') {
    // MessageResponse renders markdown and copes with half-streamed syntax.
    return <MessageResponse>{part.text}</MessageResponse>;
  }
  if (part.type === `tool-${EMIT_COMPONENT_TOOL}`) {
    if (part.state === 'input-streaming' || part.state === 'input-available') return <BlockSkeleton />;
    // Rejected components are hidden: the model retries or answers in text instead.
    if (part.state === 'output-available' && 'ok' in part.output) return <Block input={part.input} />;
  }
  return null;
}

export function MessageList({ messages, waiting }: MessageListProps) {
  return (
    <>
      {messages.map((message) => (
        <Message key={message.id} from={message.role}>
          {/* Assistant replies take the full width so components aren't squeezed. MessageContent
              clips its overflow, and a card's border is a ring drawn just outside it, so p-px
              keeps that border visible. */}
          <MessageContent className={message.role === 'assistant' ? 'w-full p-px' : undefined}>
            {message.parts.map((part, i) => (
              <MessagePart key={i} part={part} />
            ))}
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
