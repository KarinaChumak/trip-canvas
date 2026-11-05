import { EMIT_COMPONENT_TOOL } from 'catalog/schema';
import { emitComponent } from './emit-component.js';
import { getMockDay } from './mock-day.js';

/** Every tool the agent can call, keyed by the name the model sees. */
export const tools = {
  [EMIT_COMPONENT_TOOL]: emitComponent,
  getMockDay,
} as const;

export type AgentTools = typeof tools;
