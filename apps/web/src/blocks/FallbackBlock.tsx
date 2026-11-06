import { TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';

type FallbackBlockProps = {
  /** The component type the block asked for. */
  type: string;
  /** `outdated`: the current catalog rejects it; `failed`: it threw while rendering. */
  reason: 'outdated' | 'failed';
};

const DESCRIPTIONS: Record<FallbackBlockProps['reason'], string> = {
  outdated: 'It was made for an older version of the app. Ask again to get a new one.',
  failed: 'Something went wrong while showing it. Ask again to get a new one.',
};

/**
 * Shown for a block that can't be displayed: a stored one the current catalog rejects
 * (a component removed or its props changed), or one that crashed while rendering.
 * Phase 8 adds a "regenerate" action here.
 */
export function FallbackBlock({ type, reason }: FallbackBlockProps) {
  return (
    <Alert>
      <TriangleAlertIcon />
      <AlertTitle>This {type} can't be shown</AlertTitle>
      <AlertDescription>{DESCRIPTIONS[reason]}</AlertDescription>
    </Alert>
  );
}
