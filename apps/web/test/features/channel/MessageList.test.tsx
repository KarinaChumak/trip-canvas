import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MessageList } from '@/features/channel/MessageList';
import type { ChatMessage } from '@/lib/chat';

const question: ChatMessage = { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Hours?' }] };

function render(parts: ChatMessage['parts'], busy = false) {
  const reply: ChatMessage = { id: 'a1', role: 'assistant', parts };
  return renderToStaticMarkup(<MessageList messages={[question, reply]} busy={busy} />);
}

const searching: ChatMessage['parts'][number] = {
  type: 'tool-webSearch',
  toolCallId: 't1',
  state: 'input-available',
  input: { query: 'Belém Tower opening hours' },
  providerExecuted: true,
};

describe('MessageList status line', () => {
  it('says "Thinking" before the reply starts', () => {
    const html = renderToStaticMarkup(<MessageList messages={[question]} busy />);
    expect(html).toContain('Thinking');
  });

  it('names the running tool under the streaming reply', () => {
    expect(render([searching], true)).toContain('Searching the web for “Belém Tower opening hours”');
  });

  it('is gone once the reply is done', () => {
    const html = render([searching], false);
    expect(html).not.toContain('Searching the web');
    expect(html).not.toContain('role="status"');
  });
});

describe('MessageList sources', () => {
  it('lists each cited page once', () => {
    const html = render([
      { type: 'source-url', sourceId: 's1', url: 'https://example.org/tower', title: 'Belém Tower' },
      { type: 'text', text: 'Open 10:00–17:30.', state: 'done' },
      { type: 'source-url', sourceId: 's2', url: 'https://example.org/tower', title: 'Belém Tower' },
      { type: 'source-url', sourceId: 's3', url: 'https://example.org/tickets' },
    ]);
    expect(html).toContain('Used 2 sources');
  });

  it('shows no source list for a reply without sources', () => {
    expect(render([{ type: 'text', text: 'Hello', state: 'done' }])).not.toContain('sources');
  });
});
