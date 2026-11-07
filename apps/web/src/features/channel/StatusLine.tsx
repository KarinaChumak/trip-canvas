import { TypingLoader } from '@/components/shadcn/loader';

type StatusLineProps = {
  /** What the assistant is doing, e.g. "Thinking" or "Searching the web for …". */
  label: string;
};

/** A quiet line with wave-moving dots while the assistant works, like a "thinking" status. */
export function StatusLine({ label }: StatusLineProps) {
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
      {label}
      <TypingLoader size="sm" />
    </div>
  );
}
