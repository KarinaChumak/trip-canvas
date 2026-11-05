import { Suggestion } from '@/components/ai-elements/suggestion';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/shadcn/empty';

// Hard-coded for phase 1; phase 8 generates these from the available tools.
const SUGGESTED_PROMPTS = [
  'Plan a day in Lisbon',
  "What's the weather in Porto this weekend?",
  'Train from Nuremberg to Munich on Friday morning',
];

type EmptyCanvasProps = {
  onPick: (prompt: string) => void;
};

export function EmptyCanvas({ onPick }: EmptyCanvasProps) {
  return (
    <Empty className="flex-1">
      <EmptyHeader className="w-full max-w-xl">
        <EmptyTitle className="text-3xl font-semibold md:text-4xl">Where are you headed?</EmptyTitle>
        <EmptyDescription>Ask about a trip, or start with one of these.</EmptyDescription>
      </EmptyHeader>
      {/* Chips wrap onto centred lines; AI Elements' Suggestions row scrolls sideways
          and clips long prompts on narrow screens. */}
      <EmptyContent className="max-w-xl flex-row flex-wrap justify-center">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <Suggestion
            key={prompt}
            className="h-auto py-1.5 whitespace-normal"
            suggestion={prompt}
            onClick={onPick}
          />
        ))}
      </EmptyContent>
    </Empty>
  );
}
