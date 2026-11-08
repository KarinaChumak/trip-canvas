import { describe, expect, it } from 'vitest';
import { componentNames } from '../src/catalog.js';
import { emitComponentJsonSchema, ROOT_KEY, toSpec, validateEmitComponent, validateSpec } from '../src/schema.js';
import { validInputs } from './fixtures.js';

/** Every object in a JSON Schema, depth first. */
function objectsIn(node: unknown): Record<string, unknown>[] {
  if (Array.isArray(node)) return node.flatMap(objectsIn);
  if (node === null || typeof node !== 'object') return [];
  const record = node as Record<string, unknown>;
  const nested = Object.values(record).flatMap(objectsIn);
  return record.type === 'object' ? [record, ...nested] : nested;
}

describe('emitComponentJsonSchema', () => {
  it('has one anyOf branch per catalog component', () => {
    type Branch = { properties: { type: { const: string } } };
    const { component } = emitComponentJsonSchema.properties as { component: { anyOf: Branch[] } };
    const types = component.anyOf.map((branch) => branch.properties.type.const);
    expect(types).toEqual(componentNames);
    expect(JSON.stringify(emitComponentJsonSchema)).not.toContain('oneOf');
  });

  it('is strict: every object is closed and requires all its properties', () => {
    const objects = objectsIn(emitComponentJsonSchema);
    expect(objects.length).toBeGreaterThan(5);
    for (const object of objects) {
      expect(object.additionalProperties).toBe(false);
      expect(object.required).toEqual(Object.keys(object.properties as object));
    }
  });
});

describe('validateEmitComponent', () => {
  it.each(componentNames)('accepts a valid %s and wraps it into a one-element spec', (name) => {
    const result = validateEmitComponent(validInputs[name]);
    expect(result).toEqual({ ok: true, spec: toSpec(validInputs[name]) });
    if (result.ok) expect(result.spec.elements[ROOT_KEY]?.type).toBe(name);
  });

  it('rejects an unknown component type', () => {
    const result = validateEmitComponent({ component: { type: 'Carousel', props: {} } });
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('component.type') });
  });

  it('names each bad field by path', () => {
    const { props } = validInputs.DayItinerary.component;
    const broken = {
      component: { type: 'DayItinerary', props: { ...props, stops: [{ ...props.stops[0], time: '9.30am' }] } },
    };
    const result = validateEmitComponent(broken);
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('component.props.stops[0].time') });
  });

  it('rejects missing nullable fields and extra fields', () => {
    const { description: _dropped, ...rest } = validInputs.PlaceCard.component.props;
    expect(validateEmitComponent({ component: { type: 'PlaceCard', props: rest } }).ok).toBe(false);
    expect(validateEmitComponent({ component: { type: 'PlaceCard', props: { ...rest, description: null, extra: 1 } } }).ok).toBe(false);
  });

  it.each([
    ['an unknown kind', { kind: 'castle' }],
    ['a price level above 4', { priceLevel: 5 }],
    ['a fractional review count', { reviewCount: 12.5 }],
    ['a negative review count', { reviewCount: -1 }],
    ['hours for six days', { hours: Array(6).fill(null) }],
    ['hours not as HH:MM-HH:MM', { hours: ['9-17', null, null, null, null, null, null] }],
    ['hours starting at 24:00', { hours: ['24:00-02:00', null, null, null, null, null, null] }],
  ])('rejects a PlaceCard with %s', (_name, change) => {
    const props = { ...validInputs.PlaceCard.component.props, ...change };
    expect(validateEmitComponent({ component: { type: 'PlaceCard', props } }).ok).toBe(false);
  });
});

describe('validateSpec', () => {
  it('accepts a spec built by toSpec', () => {
    expect(validateSpec(toSpec(validInputs.WeatherStrip)).ok).toBe(true);
  });

  it('rejects a stored spec whose props no longer match the catalog', () => {
    const spec = toSpec(validInputs.PlaceCard);
    (spec.elements[ROOT_KEY]!.props as Record<string, unknown>).rating = 'five';
    expect(validateSpec(spec)).toMatchObject({ ok: false, error: expect.stringContaining('rating') });
  });

  it('rejects a stored spec whose component left the catalog', () => {
    const spec = { root: 'root', elements: { root: { type: 'OldWidget', props: {}, children: [] } } };
    expect(validateSpec(spec).ok).toBe(false);
  });
});
