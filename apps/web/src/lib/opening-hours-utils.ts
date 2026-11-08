// Worked out here rather than taken from Google's openNow, so a trip reopened later
// still shows whether a place is open at that moment.
// Known limits: the offset is the one at search time, so a daylight-saving change
// after the search is off by an hour; and holidays are not in the regular hours.

/** 7 days from Sunday: "HH:MM-HH:MM" ranges joined by commas, null when closed. */
export type OpeningHours = readonly (string | null)[];

type Range = { start: number; end: number };

const minutesOf = (clock: string) => {
  const [hours, minutes] = clock.split(':').map(Number);
  return hours! * 60 + minutes!;
};

/** "11:00-14:00,17:00-22:00" → minutes since midnight; an end before the start runs past midnight. */
function rangesOf(day: string | null | undefined): Range[] {
  if (!day) return [];
  return day.split(',').map((range) => {
    const [start, end] = range.split('-');
    return { start: minutesOf(start!), end: minutesOf(end!) };
  });
}

/** The weekday (Sunday=0) and minutes since midnight at the place, for `now`. */
function localTime(utcOffsetMinutes: number, now: Date) {
  const local = new Date(now.getTime() + utcOffsetMinutes * 60_000);
  return { day: local.getUTCDay(), minutes: local.getUTCHours() * 60 + local.getUTCMinutes() };
}

/** Whether the place is open at `now`; null when its hours or offset are unknown. */
export function isOpenAt(hours: OpeningHours | null, utcOffsetMinutes: number | null, now: Date): boolean | null {
  if (hours === null || utcOffsetMinutes === null) return null;
  const { day, minutes } = localTime(utcOffsetMinutes, now);

  const openToday = rangesOf(hours[day]).some(({ start, end }) => minutes >= start && (end <= start || minutes < end));
  // Yesterday's ranges past midnight, e.g. Friday's "18:00-02:00" at 01:00 on Saturday.
  const openFromYesterday = rangesOf(hours[(day + 6) % 7]).some(({ start, end }) => end <= start && minutes < end);
  return openToday || openFromYesterday;
}

/** The place's hours for its own today at `now`, e.g. "11:00-14:00,17:00-22:00"; null when closed or unknown. */
export function hoursToday(hours: OpeningHours | null, utcOffsetMinutes: number | null, now: Date): string | null {
  if (hours === null || utcOffsetMinutes === null) return null;
  return hours[localTime(utcOffsetMinutes, now).day] ?? null;
}
