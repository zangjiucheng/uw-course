import type { Section } from '../types';

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export const DAY_LABELS: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export const DEFAULT_TIMELINE_START = 8;
export const DEFAULT_TIMELINE_END = 22;
export const TIMELINE_PADDING = 26;

export function sectionKey(section: { course_code: string; class_id: number | null }): string {
  return `${section.course_code}::${section.class_id}`;
}

export function parseClockToMinutes(rawClock: string | null | undefined): number {
  if (!rawClock) return 0;
  const [hours, minutes] = rawClock.split(':').map(Number);
  return hours * 60 + minutes;
}

const DAY_SHORT: Record<string, string> = {
  Mon: 'M',
  Tue: 'T',
  Wed: 'W',
  Thu: 'Th',
  Fri: 'F',
  Sat: 'Sa',
  Sun: 'Su',
};

/** Compact day string, e.g. ["Mon","Wed","Fri"] -> "MWF". */
export function formatDays(days: string[] | null | undefined): string {
  if (!days?.length) return '';
  return days.map((day) => DAY_SHORT[day] ?? day).join('');
}

/** 24h "HH:MM" -> 12h "h:mm" with a trailing lowercase meridiem letter. */
export function formatClock(rawClock: string | null | undefined): string {
  if (!rawClock) return '';
  const [hourStr, minuteStr] = rawClock.split(':');
  let hours = Number(hourStr);
  const meridiem = hours >= 12 ? 'p' : 'a';
  hours %= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minuteStr}${meridiem}`;
}

/** "10:00a–11:20a" style range, omitting empties gracefully. */
export function formatTimeRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  const startLabel = formatClock(start);
  const endLabel = formatClock(end);
  if (startLabel && endLabel) return `${startLabel}–${endLabel}`;
  return startLabel || endLabel || '';
}

/** Full day + time summary, e.g. "MWF 10:00a–11:20a". */
export function formatDayTime(section: {
  days: string[] | null | undefined;
  start_time: string | null;
  end_time: string | null;
}): string {
  const days = formatDays(section.days);
  const time = formatTimeRange(section.start_time, section.end_time);
  return [days, time].filter(Boolean).join(' ');
}

export interface TimelineConfig {
  startHour: number;
  endHour: number;
  totalMinutes: number;
  height: number;
  hours: number[];
}

export function getTimelineConfig(items: Section[]): TimelineConfig {
  const timedItems = items.filter((item) => item.start_time && item.end_time);
  let startHour = DEFAULT_TIMELINE_START;
  let endHour = DEFAULT_TIMELINE_END;

  if (timedItems.length) {
    const earliestStart = Math.min(...timedItems.map((item) => parseClockToMinutes(item.start_time)));
    const latestEnd = Math.max(...timedItems.map((item) => parseClockToMinutes(item.end_time)));
    if (earliestStart <= DEFAULT_TIMELINE_START * 60) startHour = DEFAULT_TIMELINE_START - 1;
    if (latestEnd >= DEFAULT_TIMELINE_END * 60) endHour = DEFAULT_TIMELINE_END + 1;
  }

  return {
    startHour,
    endHour,
    totalMinutes: (endHour - startHour) * 60,
    height: (endHour - startHour) * 60,
    hours: Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i),
  };
}

export interface ConflictEntry {
  day: string;
  first: Section;
  second: Section;
}

export function computeConflictEntries(items: Section[]): ConflictEntry[] {
  const entries: ConflictEntry[] = [];
  WEEK_DAYS.forEach((day) => {
    const dayItems = items
      .filter((item) => item.days?.includes(day) && item.start_time && item.end_time)
      .sort((a, b) => parseClockToMinutes(a.start_time) - parseClockToMinutes(b.start_time));

    for (let i = 0; i < dayItems.length; i++) {
      for (let j = i + 1; j < dayItems.length; j++) {
        if (parseClockToMinutes(dayItems[j].start_time) >= parseClockToMinutes(dayItems[i].end_time)) break;
        entries.push({ day, first: dayItems[i], second: dayItems[j] });
      }
    }
  });
  return entries;
}

export function computeConflictMap(items: Section[]): Map<string, Section[]> {
  const map = new Map<string, Section[]>();
  const timed = items.filter((item) => item.days?.length && item.start_time && item.end_time);

  timed.forEach((item) => {
    item.days.forEach((day) => {
      const overlaps = timed.filter((other) => {
        if (sectionKey(other) === sectionKey(item)) return false;
        if (!other.days?.includes(day)) return false;
        const startA = parseClockToMinutes(item.start_time);
        const endA = parseClockToMinutes(item.end_time);
        const startB = parseClockToMinutes(other.start_time);
        const endB = parseClockToMinutes(other.end_time);
        return startA < endB && startB < endA;
      });
      if (overlaps.length) map.set(`${sectionKey(item)}::${day}`, overlaps);
    });
  });

  return map;
}

export function getSectionConflicts(section: Section, selectedItems: Section[]): Section[] {
  if (!section.start_time || !section.end_time || !section.days?.length) return [];
  return selectedItems.filter((item) => {
    if (sectionKey(item) === sectionKey(section)) return false;
    if (!item.start_time || !item.end_time || !item.days?.length) return false;
    const sameDay = section.days.some((day) => item.days.includes(day));
    if (!sameDay) return false;
    const startA = parseClockToMinutes(section.start_time);
    const endA = parseClockToMinutes(section.end_time);
    const startB = parseClockToMinutes(item.start_time);
    const endB = parseClockToMinutes(item.end_time);
    return startA < endB && startB < endA;
  });
}
