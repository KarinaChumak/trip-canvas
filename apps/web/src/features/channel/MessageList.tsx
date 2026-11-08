import { EMIT_COMPONENT_TOOL } from '@trip-canvas/catalog/schema';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources';
import { Block, BlockSkeleton } from '@/blocks/Block';
import { activityLabel, isToolRunning } from '@/lib/activity-status';
import type { ChatMessage } from '@/lib/chat';
import { StatusLine } from './StatusLine';

type MessageListProps = {
  messages: ChatMessage[];
  /** A reply is on its way: the status line shows what the assistant is doing. */
  busy: boolean;
};

/** Shared by the components that read a whole message's parts. */
type MessagePartsProps = {
  parts: ChatMessage['parts'];
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
    if (isToolRunning(part)) return <BlockSkeleton />;
    // Rejected components are hidden: the model retries or answers in text instead.
    if (part.state === 'output-available' && 'ok' in part.output) return <Block input={part.input} />;
  }
  return null;
}

/** The status line under a reply that is still streaming. */
function MessageActivity({ parts }: MessagePartsProps) {
  const label = activityLabel(parts);
  return label ? <StatusLine label={label} /> : null;
}

/** The pages webSearch cited in this reply, once each, in a collapsed list. */
function MessageSources({ parts }: MessagePartsProps) {
  // Keyed by url, so a page cited twice is listed once.
  const urls = new Map(
    parts.filter((part) => part.type === 'source-url').map((part) => [part.url, part.title ?? part.url]),
  );
  if (urls.size === 0) return null;

  return (
    <Sources>
      <SourcesTrigger count={urls.size} />
      <SourcesContent>
        {[...urls].map(([url, title]) => (
          <Source key={url} href={url} title={title} />
        ))}
      </SourcesContent>
    </Sources>
  );
}

export function MessageList({ messages, busy }: MessageListProps) {
  const last = messages.at(-1);
  const streamingId = busy && last?.role === 'assistant' ? last.id : null;
  // Before the reply's first chunk there is no assistant message to put the line under.
  const waiting = busy && last?.role === 'user';

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
            {message.id === streamingId && <MessageActivity parts={message.parts} />}
            <MessageSources parts={message.parts} />
          </MessageContent>
        </Message>
      ))}
      {waiting && (
        <Message from="assistant">
          <MessageContent>
            <StatusLine label="Thinking" />
          </MessageContent>
        </Message>
      )}
    </>
  );
}
