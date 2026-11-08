import { describe, expect, it } from 'vitest';
import type { ToolExecutionOptions } from 'ai';
import { emitComponent } from '../../src/tools/emit-component.js';

const options = { toolCallId: 'call-1', messages: [], context: {} } as ToolExecutionOptions<Record<string, unknown>>;

const place = {
  component: {
    type: 'PlaceCard',
    props: { name: 'MAAT', category: 'Museum', kind: 'museum', placeId: null, description: null, address: null, rating: 4.5, reviewCount: null, priceLevel: null, url: null, hours: null, utcOffsetMinutes: null },
  },
} as const;

describe('emit_component', () => {
  it('returns ok for a valid component', async () => {
    expect(await emitComponent.execute!(place, options)).toEqual({ ok: true });
  });

  it('returns an error naming the bad field, for the model to fix', async () => {
    const broken = { component: { ...place.component, props: { ...place.component.props, rating: 9 } } };
    const output = await emitComponent.execute!(broken, options);
    expect(output).toEqual({ error: expect.stringContaining('component.props.rating') });
  });

  it('returns an error for an unknown component instead of throwing', async () => {
    const unknown = { component: { type: 'Carousel', props: {} } } as never;
    expect(await emitComponent.execute!(unknown, options)).toHaveProperty('error');
  });
});
