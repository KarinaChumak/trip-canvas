import { InfoIcon } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/shadcn/tooltip';

type SourceCreditProps = {
  /** The credit the data's licence asks for, e.g. "Weather data by Open-Meteo". */
  credit: string;
  href: string;
};

/**
 * A small info icon that shows where a card's data comes from on hover or focus,
 * and opens the source when clicked. The credit is also its accessible name.
 */
export function SourceCredit({ credit, href }: SourceCreditProps) {
  return (
    // Its own provider, so a card works wherever it is rendered.
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild size="icon-xs" variant="ghost" className="text-muted-foreground">
            <a href={href} target="_blank" rel="noreferrer" aria-label={credit}>
              <InfoIcon />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{credit}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
