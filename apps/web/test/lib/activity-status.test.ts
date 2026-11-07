import { describe, expect, it } from 'vitest';
import { activityLabel, isToolRunning } from '@/lib/activity-status';
import type { ChatMessage } from '@/lib/chat';

type Part = ChatMessage['parts'][number];

const geocode = (state: 'input-streaming' | 'input-available' | 'output-available'): Part =>
  state === 'output-available'
    ? { type: 'tool-geocode', toolCallId: 'g', state, input: { query: 'Porto' }, output: {} }
    : { type: 'tool-geocode', toolCallId: 'g', state, input: { query: 'Porto' } };

describe('activityLabel', () => {
  it('thinks before any part arrives and between steps', () => {
    expect(activityLabel([])).toBe('Thinking');
    expect(activityLabel([{ type: 'step-start' }])).toBe('Thinking');
    expect(activityLabel([geocode('output-available')])).toBe('Thinking');
  });

  it('names a running tool with its input', () => {
    expect(activityLabel([geocode('input-available')])).toBe('Looking up Porto');
    expect(
      activityLabel([{ type: 'tool-getWeather', toolCallId: 'w', state: 'input-available', input: { place: 'Porto' } }]),
    ).toBe('Checking the weather in Porto');
  });

  it('copes with a half-streamed input', () => {
    expect(
      activityLabel([{ type: 'tool-webSearch', toolCallId: 's', state: 'input-streaming', input: undefined }]),
    ).toBe('Searching the web');
  });

  it('picks the latest of several running tools', () => {
    const places: Part = { type: 'tool-searchPlaces', toolCallId: 'p', state: 'input-available', input: {} };
    expect(activityLabel([geocode('input-available'), places])).toBe('Finding places nearby');
  });

  it('stays quiet while text streams or a component is drawn', () => {
    expect(activityLabel([{ type: 'text', text: 'Porto is', state: 'streaming' }])).toBeNull();
    expect(
      activityLabel([{ type: 'tool-emit_component', toolCallId: 'e', state: 'input-streaming', input: undefined }]),
    ).toBeNull();
  });

  it('thinks again after a finished paragraph', () => {
    expect(activityLabel([{ type: 'text', text: 'Let me check.', state: 'done' }])).toBe('Thinking');
  });
});

describe('isToolRunning', () => {
  it('is true until the tool has a result, and false for non-tool parts', () => {
    expect(isToolRunning(geocode('input-streaming'))).toBe(true);
    expect(isToolRunning(geocode('input-available'))).toBe(true);
    expect(isToolRunning(geocode('output-available'))).toBe(false);
    expect(isToolRunning({ type: 'text', text: 'Hi', state: 'streaming' })).toBe(false);
  });
});
