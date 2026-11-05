import type { Spec } from '@json-render/core';
import { z } from 'zod';
import { catalog, components, type ComponentName } from './catalog.js';

// json-render's own `catalog.jsonSchema({ strict: true })` turns the `elements` map
// into an empty object, so the model would see no props. Instead the tool input is
// one component, `{ type, props }`, built from the same Zod props; the server wraps
// it into a json-render spec. Wrapped in `component` because a tool's input schema
// must be an object at the top level, not a union.

/**
 * The tool the model calls to hand one component to the web app, which displays it.
 * The server only checks the input; nothing is rendered there.
 */
export const EMIT_COMPONENT_TOOL = 'emit_component';

function variant<T extends ComponentName>(type: T) {
  return z.strictObject({ type: z.literal(type), props: components[type].props });
}

// Listed by hand so the union stays typed; a test checks it covers every component.
export const EmitComponentInput = z.strictObject({
  component: z.discriminatedUnion('type', [
    variant('PlaceCard'),
    variant('WeatherStrip'),
    variant('DayItinerary'),
  ]),
});

/** One catalog component, as the model passes it to `emit_component`. */
export type EmitComponentInput = z.infer<typeof EmitComponentInput>;

/** What `emit_component` returns to the model: the web app shows only `ok` results. */
export type EmitComponentOutput = { ok: true } | { error: string };

/**
 * The `emit_component` input as strict JSON Schema: every object closed with
 * `additionalProperties: false` and every property required (optional ones are nullable).
 */
export const emitComponentJsonSchema = z.toJSONSchema(EmitComponentInput, {
  target: 'draft-7',
  io: 'input',
  // Zod writes a discriminated union as `oneOf`; Anthropic tool schemas support `anyOf`.
  // The branches never overlap (each has its own `type` const), so the two mean the same.
  override: ({ jsonSchema }) => {
    if (jsonSchema.oneOf) {
      jsonSchema.anyOf = jsonSchema.oneOf;
      delete jsonSchema.oneOf;
    }
  },
});

/** The element key of the single component in a block's spec. */
export const ROOT_KEY = 'root';

/** Wraps one component into the flat spec format the json-render Renderer takes. */
export function toSpec({ component }: EmitComponentInput): Spec {
  return {
    root: ROOT_KEY,
    elements: { [ROOT_KEY]: { type: component.type, props: component.props, children: [] } },
  };
}

export type ValidationResult = { ok: true; spec: Spec } | { ok: false; error: string };

/**
 * Checks an `emit_component` input against the catalog. The error text goes back to the
 * model as the tool result, so it names each bad field by path.
 */
export function validateEmitComponent(input: unknown): ValidationResult {
  const parsed = EmitComponentInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: z.prettifyError(parsed.error) };
  return validateSpec(toSpec(parsed.data));
}

/**
 * Checks a stored or received spec, e.g. before rendering a block from IndexedDB.
 * `catalog.validate()` checks the tree and component names but lets any props
 * through (they may hold `$state` expressions), so each element's props are
 * parsed against the catalog too.
 */
export function validateSpec(spec: unknown): ValidationResult {
  const result = catalog.validate(spec);
  if (!result.success || !result.data) {
    return { ok: false, error: result.error ? z.prettifyError(result.error) : 'Invalid spec' };
  }

  const checked = result.data as Spec;
  for (const [key, element] of Object.entries(checked.elements)) {
    const definition = components[element.type as ComponentName];
    if (!definition) return { ok: false, error: `Unknown component "${element.type}" at elements.${key}` };
    const props = definition.props.safeParse(element.props);
    if (!props.success) return { ok: false, error: `At elements.${key}.props:\n${z.prettifyError(props.error)}` };
  }
  return { ok: true, spec: checked };
}
