import { describe, expect, it } from 'vitest';
import { hoursToday, isOpenAt, type OpeningHours } from '@/lib/opening-hours-utils';

const BANGKOK = 420;

/** A moment by Bangkok's clock: 8 Nov 2026 is a Sunday, so 13 Nov is a Friday. */
const bangkok = (date: number, hour: number, minute = 0) => new Date(Date.UTC(2026, 10, date, hour, minute) - BANGKOK * 60_000);

const week = (day: string | null): OpeningHours => Array<string | null>(7).fill(day);

describe('isOpenAt', () => {
  it('is null when the hours or the offset are unknown', () => {
    expect(isOpenAt(null, BANGKOK, bangkok(13, 12))).toBeNull();
    expect(isOpenAt(week('09:00-17:00'), null, bangkok(13, 12))).toBeNull();
  });

  it('reads the time at the place, not on this machine', () => {
    const hours = week('09:00-17:00');
    // 10:00 in Bangkok is 03:00 UTC, before opening at a place on UTC+0.
    expect(isOpenAt(hours, BANGKOK, bangkok(13, 10))).toBe(true);
    expect(isOpenAt(hours, 0, bangkok(13, 10))).toBe(false);
  });

  it('opens at the start and closes at the end of a range', () => {
    const hours = week('09:00-17:00');
    expect(isOpenAt(hours, BANGKOK, bangkok(13, 8, 59))).toBe(false);
    expect(isOpenAt(hours, BANGKOK, bangkok(13, 9))).toBe(true);
    expect(isOpenAt(hours, BANGKOK, bangkok(13, 17))).toBe(false);
  });

  it('handles several ranges in one day', () => {
    const hours = week('11:00-14:00,17:00-22:00');
    expect(isOpenAt(hours, BANGKOK, bangkok(13, 12))).toBe(true);
    expect(isOpenAt(hours, BANGKOK, bangkok(13, 15, 30))).toBe(false);
    expect(isOpenAt(hours, BANGKOK, bangkok(13, 21, 59))).toBe(true);
  });

  it('keeps a range past midnight open into the next morning', () => {
    const fridayNights: OpeningHours = [null, null, null, null, null, '18:00-02:00', null];
    expect(isOpenAt(fridayNights, BANGKOK, bangkok(13, 23))).toBe(true);
    expect(isOpenAt(fridayNights, BANGKOK, bangkok(14, 1))).toBe(true);
    expect(isOpenAt(fridayNights, BANGKOK, bangkok(14, 2))).toBe(false);
    // Thursday is closed, so early Friday is too.
    expect(isOpenAt(fridayNights, BANGKOK, bangkok(13, 1))).toBe(false);
  });

  it('wraps a Saturday night into Sunday morning', () => {
    const saturdayNights: OpeningHours = [null, null, null, null, null, null, '20:00-03:00'];
    expect(isOpenAt(saturdayNights, BANGKOK, bangkok(15, 2))).toBe(true);
  });

  it('is open all day when open 24 hours, and until midnight on 24:00', () => {
    expect(isOpenAt(week('00:00-24:00'), BANGKOK, bangkok(13, 0))).toBe(true);
    expect(isOpenAt(week('00:00-24:00'), BANGKOK, bangkok(13, 23, 59))).toBe(true);
    expect(isOpenAt(week('18:00-24:00'), BANGKOK, bangkok(13, 23, 59))).toBe(true);
    expect(isOpenAt(week('18:00-24:00'), BANGKOK, bangkok(13, 0, 30))).toBe(false);
  });

  it('is closed on a day with no hours', () => {
    const weekdays: OpeningHours = [null, '09:00-17:00', '09:00-17:00', '09:00-17:00', '09:00-17:00', '09:00-17:00', null];
    expect(isOpenAt(weekdays, BANGKOK, bangkok(14, 12))).toBe(false);
    expect(isOpenAt(weekdays, BANGKOK, bangkok(13, 12))).toBe(true);
  });
});

describe('hoursToday', () => {
  it("gives the place's own today, or null when closed or unknown", () => {
    const hours: OpeningHours = ['10:00-16:00', null, null, null, null, '18:00-02:00', null];
    // 06:00 on Sunday in Bangkok is still Saturday in UTC.
    expect(hoursToday(hours, BANGKOK, bangkok(8, 6))).toBe('10:00-16:00');
    expect(hoursToday(hours, BANGKOK, bangkok(13, 20))).toBe('18:00-02:00');
    expect(hoursToday(hours, BANGKOK, bangkok(14, 12))).toBeNull();
    expect(hoursToday(null, BANGKOK, bangkok(13, 20))).toBeNull();
  });
});
