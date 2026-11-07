import type { Meta, StoryObj } from '@storybook/react-vite';
import { MessageList } from '@/features/channel/MessageList';
import type { ChatMessage } from '@/lib/chat';

const meta = {
  title: 'Channel/MessageList',
  component: MessageList,
  args: { messages: [], busy: false },
} satisfies Meta<typeof MessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

const question: ChatMessage = {
  id: 'u1',
  role: 'user',
  parts: [{ type: 'text', text: 'When is Belém Tower open this weekend?' }],
};

function reply(parts: ChatMessage['parts']): ChatMessage {
  return { id: 'a1', role: 'assistant', parts };
}

const search = {
  type: 'tool-webSearch',
  toolCallId: 't1',
  input: { query: 'Belém Tower opening hours November 2026' },
  providerExecuted: true,
} as const;

/** Sent, before the reply's first chunk. */
export const Waiting: Story = {
  args: { messages: [question], busy: true },
};

/** A tool is running: the status line names it. */
export const LookingUpAPlace: Story = {
  args: {
    busy: true,
    messages: [
      question,
      reply([{ type: 'tool-geocode', toolCallId: 't0', state: 'input-available', input: { query: 'Belém, Lisbon' } }]),
    ],
  },
};

/** webSearch is running; the line shows the model's query. */
export const SearchingTheWeb: Story = {
  args: {
    busy: true,
    messages: [question, reply([{ ...search, state: 'input-available' }])],
  },
};

/** A tool has finished and the model is working out the next step. */
export const ThinkingBetweenSteps: Story = {
  args: {
    busy: true,
    messages: [question, reply([{ ...search, state: 'output-available', output: [] }])],
  },
};

/** A text answer from a web search, with its cited pages (the same page twice is listed once). */
export const AnswerWithSources: Story = {
  args: {
    messages: [
      question,
      reply([
        { ...search, state: 'output-available', output: [] },
        { type: 'source-url', sourceId: 's1', url: 'https://example.org/belem-tower', title: 'Belém Tower — visiting hours' },
        { type: 'source-url', sourceId: 's2', url: 'https://example.org/tickets', title: 'Monuments of Lisbon — tickets' },
        { type: 'source-url', sourceId: 's3', url: 'https://example.org/belem-tower', title: 'Belém Tower — visiting hours' },
        {
          type: 'text',
          text: 'Belém Tower is open **10:00–17:30** on Saturday and Sunday; last entry is 30 minutes before closing.',
          state: 'done',
        },
      ]),
    ],
  },
};
