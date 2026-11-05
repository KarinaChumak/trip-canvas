import { useMemo } from 'react';
import { JSONUIProvider, Renderer } from '@json-render/react';
import { validateEmitComponent, type EmitComponentInput } from 'catalog/schema';
import { Skeleton } from '@/components/shadcn/skeleton';
import { registry } from '@/registry';
import { FallbackBlock } from './FallbackBlock';

/** Placeholder while a component's spec streams in. */
export function BlockSkeleton() {
  return <Skeleton aria-label="Loading component" className="h-40 w-full max-w-xl rounded-xl" />;
}

type BlockProps = {
  /** The `emit_component` input the server accepted. */
  input: EmitComponentInput;
};

/**
 * Renders one emitted component through the catalog registry. The input is checked
 * again because saved chats can outlive the catalog version that accepted them.
 */
export function Block({ input }: BlockProps) {
  const result = useMemo(() => validateEmitComponent(input), [input]);

  // Saved input may not even have the current shape, hence the optional chaining.
  if (!result.ok) return <FallbackBlock type={input?.component?.type ?? 'component'} />;

  return (
    <JSONUIProvider registry={registry}>
      <Renderer spec={result.spec} registry={registry} />
    </JSONUIProvider>
  );
}
