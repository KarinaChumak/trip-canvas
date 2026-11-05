import { TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';

type FallbackBlockProps = {
  /** The component type the block asked for. */
  type: string;
};

/**
 * Shown for a stored block the current catalog can't render, e.g. after a component
 * was removed or its props changed. Phase 8 adds a "regenerate" action here.
 */
export function FallbackBlock({ type }: FallbackBlockProps) {
  return (
    <Alert>
      <TriangleAlertIcon />
      <AlertTitle>This {type} can't be shown</AlertTitle>
      <AlertDescription>It was made for an older version of the app. Ask again to get a new one.</AlertDescription>
    </Alert>
  );
}
