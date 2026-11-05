import type { ReactNode } from 'react';
import { AlertCircleIcon } from 'lucide-react';
import { Alert, AlertAction, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { Spinner } from '@/components/shadcn/spinner';
import { useAccessQuery } from '@/lib/access-code';
import { AccessCodeForm } from './AccessCodeForm';

type AccessGateProps = {
  children: ReactNode;
};

/** Shows the app only once the server accepts this browser's access code. */
export function AccessGate({ children }: AccessGateProps) {
  const { data: allowed, isError, refetch } = useAccessQuery();

  if (isError) {
    return (
      <div className="mx-auto flex h-dvh max-w-md items-center px-4">
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not reach the server.</AlertTitle>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertAction>
        </Alert>
      </div>
    );
  }
  if (allowed === undefined) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner aria-label="Loading" />
      </div>
    );
  }
  return allowed ? children : <AccessCodeForm />;
}
