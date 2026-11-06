import { SquarePenIcon } from 'lucide-react';
import { Button } from '@/components/shadcn/button';

type ChannelHeaderProps = {
  /** Show the New chat button; hidden while the canvas is already empty. */
  canStartNew: boolean;
  /** A reply is on its way: starting over waits until it finishes or is stopped. */
  busy: boolean;
  onNewChat: () => void;
};

/** Slim top bar; later phases add the quota counter here. */
export function ChannelHeader({ canStartNew, busy, onNewChat }: ChannelHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-end px-4">
      {canStartNew && (
        <Button variant="ghost" size="sm" disabled={busy} onClick={onNewChat}>
          <SquarePenIcon data-icon="inline-start" />
          New chat
        </Button>
      )}
    </header>
  );
}
