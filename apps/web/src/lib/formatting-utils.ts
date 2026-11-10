// Catalog dates are plain YYYY-MM-DD days, so format them in UTC: a local time zone
// would shift "2026-11-07" to the 6th west of Greenwich.
const dayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

/** "2026-11-07" → "Sat 7 Nov". */
export function formatDay(isoDate: string): string {
  return dayFormat.format(new Date(`${isoDate}T00:00:00Z`));
}

/** 90 → "1 h 30 min", 45 → "45 min", 120 → "2 h". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from one catalog date to another: "+1" on an overnight arrival. */
export function daysBetween(fromIsoDate: string, toIsoDate: string): number {
  return Math.round((Date.parse(toIsoDate) - Date.parse(fromIsoDate)) / DAY_MS);
}

/** (1290, "THB") → "THB 1,290", (89.5, "EUR") → "€89.50": cents only when there are any. */
export function formatPrice(amount: number, currency: string): string {
  const digits = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}
