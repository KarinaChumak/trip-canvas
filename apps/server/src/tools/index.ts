import { EMIT_COMPONENT_TOOL } from 'catalog/schema';
import { emitComponent } from './emit-component.js';
import { getMockDay } from './mock-day.js';

/** Every tool the agent can call, keyed by the name the model sees. */
export function createTools() {
  return {
    [EMIT_COMPONENT_TOOL]: emitComponent,
    getMockDay,
  };
}

export type AgentTools = ReturnType<typeof createTools>;
