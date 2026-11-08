/** Which options of a ConnectionList are shown: indexes `start` up to, not including, `end`. */
export type ConnectionWindow = { start: number; end: number };

/** How many more options one click on "Earlier" or "Later" shows. */
export const STEP = 2;

/** The recommended option and the one after it; the first two without a recommendation. */
export function initialWindow(count: number, recommendedIndex: number | null): ConnectionWindow {
  // Claude's index can point past the list; fall back to the first option then.
  const start = recommendedIndex !== null && recommendedIndex < count ? recommendedIndex : 0;
  return { start, end: Math.min(count, start + STEP) };
}

export function showEarlier({ start, end }: ConnectionWindow): ConnectionWindow {
  return { start: Math.max(0, start - STEP), end };
}

export function showLater({ start, end }: ConnectionWindow, count: number): ConnectionWindow {
  return { start, end: Math.min(count, end + STEP) };
}
