import { registerTelemetry } from 'ai';
import { LangfuseSpanProcessor, type LangfuseSpanProcessorParams } from '@langfuse/otel';
import { LangfuseVercelAiSdkIntegration } from '@langfuse/vercel-ai-sdk';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import type { Env } from './env.js';

export type TracingConfig = NonNullable<Env['langfuse']> & {
  /** Replaces the OTLP exporter to Langfuse; tests pass an in-memory one. */
  exporter?: LangfuseSpanProcessorParams['exporter'];
};

export type Tracing = {
  /** Sends the spans still waiting. Serverless can freeze the function right after the reply. */
  flush(): Promise<void>;
};

/**
 * Starts tracing to Langfuse: every AI SDK call (model steps with tokens, tool calls)
 * and every `startActiveObservation` span becomes part of one trace per chat turn.
 * Call it once, before the first AI SDK call. Without a config it does nothing.
 */
export function startTracing(config?: TracingConfig): Tracing {
  if (!config) return { flush: async () => {} };

  const processor = new LangfuseSpanProcessor({
    publicKey: config.publicKey,
    secretKey: config.secretKey,
    baseUrl: config.baseUrl,
    environment: config.environment,
    exporter: config.exporter,
    // Send each span as it ends: a Vercel function can be frozen before a batch is due.
    exportMode: 'immediate',
  });
  new NodeTracerProvider({ spanProcessors: [processor] }).register();
  registerTelemetry(new LangfuseVercelAiSdkIntegration());
  console.log(`[tracing] Langfuse on (${config.environment})`);

  return { flush: () => processor.forceFlush() };
}
