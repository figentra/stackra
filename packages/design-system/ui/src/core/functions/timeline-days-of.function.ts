/**
 * Stackra file contract:
 * Purpose: `timelineDaysOf(items, now, timeZone)`, a Timeline's entries in day groups, in the order given: each
 *          group's day key in the time zone and how many days before `now` it is.
 * Boundary: pure; consecutive entries of one day form one group, so a feed in time order gives one group per day.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { TimelineItem } from "#contracts/types/timeline-item.type";
import type { TimelineDay } from "#core/types/timeline-day.type";

/** Milliseconds in a day. */
const DAY = 86_400_000;

/**
 * The day groups.
 * @param items - the entries, in the order shown
 * @param now - the moment "today" is counted from
 * @param timeZone - the zone days are counted in; the runtime's own when left out
 */
export function timelineDaysOf(
  items: readonly TimelineItem[],
  now: Date,
  timeZone?: string,
): readonly TimelineDay[] {
  const keyOf = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  });
  const today = Date.parse(keyOf.format(now));
  const days: { key: string; daysAgo: number; at: Date; items: TimelineItem[] }[] = [];
  for (const item of items) {
    const at = new Date(item.at);
    const key = keyOf.format(at);
    const last = days.at(-1);
    if (last?.key === key) last.items.push(item);
    else
      days.push({ key, daysAgo: Math.round((today - Date.parse(key)) / DAY), at, items: [item] });
  }
  return days;
}
