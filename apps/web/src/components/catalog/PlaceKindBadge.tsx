import {
  CoffeeIcon,
  LandmarkIcon,
  LibraryBigIcon,
  MapPinIcon,
  MusicIcon,
  ShoppingBagIcon,
  StoreIcon,
  TelescopeIcon,
  TreesIcon,
  UmbrellaIcon,
  UtensilsIcon,
  type LucideIcon,
} from 'lucide-react';
import type { PlaceKind } from '@trip-canvas/catalog';
import { Badge } from '@/components/shadcn/badge';

type KindStyle = {
  icon: LucideIcon;
  /** Full class strings, so Tailwind can find them. */
  tint: string;
};

// Same tints as DayItinerary's stops, so a museum looks alike on both cards.
const KIND_STYLES: Record<PlaceKind, KindStyle> = {
  museum: { icon: LibraryBigIcon, tint: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300' },
  temple: { icon: LandmarkIcon, tint: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-400/15 dark:text-yellow-300' },
  nature: { icon: TreesIcon, tint: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  beach: { icon: UmbrellaIcon, tint: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' },
  viewpoint: { icon: TelescopeIcon, tint: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  food: { icon: UtensilsIcon, tint: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  cafe: { icon: CoffeeIcon, tint: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300' },
  nightlife: { icon: MusicIcon, tint: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
  shopping: { icon: ShoppingBagIcon, tint: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  market: { icon: StoreIcon, tint: 'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300' },
  other: { icon: MapPinIcon, tint: 'bg-secondary text-secondary-foreground' },
};

type PlaceKindBadgeProps = {
  kind: PlaceKind;
  /** The text shown, e.g. "Thai restaurant"; the kind only picks icon and tint. */
  label: string;
};

export function PlaceKindBadge({ kind, label }: PlaceKindBadgeProps) {
  const { icon: Icon, tint } = KIND_STYLES[kind];
  return (
    <Badge className={tint} data-kind={kind}>
      <Icon data-icon="inline-start" aria-hidden />
      {label}
    </Badge>
  );
}
