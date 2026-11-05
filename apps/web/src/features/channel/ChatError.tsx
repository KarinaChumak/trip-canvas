import { AlertCircleIcon } from 'lucide-react';
import { Alert, AlertAction, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';

type ChatErrorProps = {
  onRetry: () => void;
};

/** Shown when a reply fails; Retry resends the last message. */
export function ChatError({ onRetry }: ChatErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>The assistant could not answer.</AlertTitle>
      <AlertAction>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </AlertAction>
    </Alert>
  );
}
