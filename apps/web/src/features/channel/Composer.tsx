import { useState, type KeyboardEvent } from 'react';
import { ArrowUpIcon, SquareIcon } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/shadcn/input-group';

type ComposerProps = {
  /** A reply is on its way: Send turns into Stop. */
  busy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
};

export function Composer({ busy, onSend, onStop }: ComposerProps) {
  const [text, setText] = useState('');
  const canSend = !busy && text.trim().length > 0;

  function submit() {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a line; ignore Enter while an IME is composing.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <InputGroup className="mb-4">
      <InputGroupTextarea
        aria-label="Message"
        placeholder="Where to next?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <InputGroupAddon align="block-end">
        {busy ? (
          <InputGroupButton
            className="ml-auto"
            size="icon-sm"
            variant="default"
            aria-label="Stop"
            onClick={onStop}
          >
            <SquareIcon />
          </InputGroupButton>
        ) : (
          <InputGroupButton
            className="ml-auto"
            size="icon-sm"
            variant="default"
            aria-label="Send"
            disabled={!canSend}
            onClick={submit}
          >
            <ArrowUpIcon />
          </InputGroupButton>
        )}
      </InputGroupAddon>
    </InputGroup>
  );
}
