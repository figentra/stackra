/**
 * Stackra file contract:
 * Purpose: `findSlots`, the start times a booking fits: every part that holds the resource lies inside an open window
 *          and overlaps no busy block, while processing gaps may overlap anything. Bookings, classes and court rooms
 *          use it over working hours from `openIntervals` and busy time from their own records.
 * Boundary: pure over its input. Candidates step from the start of each merged open window by `step` minutes; the
 *           returned interval spans the whole booking, gaps included. Throws a `RangeError` for a step or segment that
 *           is not a positive whole number of minutes, no segments, or a bad instant.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 7).
 */
import { instantMs } from "#core/functions/instant-ms.function";
import { mergeRanges } from "#core/functions/merge-ranges.function";
import type { Interval } from "#core/types/interval.type";
import type { SlotQuery } from "#core/types/slot-query.type";

/** An interval as epoch milliseconds. */
function range(interval: Interval): [number, number] {
  return [instantMs(interval.start), instantMs(interval.end)];
}

/**
 * The slots of `query`, earliest first.
 *
 * @example
 * findSlots({ open, busy, segments: [{ minutes: 30, occupies: true }, { minutes: 45, occupies: false },
 *   { minutes: 30, occupies: true }], step: 15 });
 */
export function findSlots(query: SlotQuery): Interval[] {
  const positive = (value: number): boolean => Number.isInteger(value) && value > 0;
  if (!positive(query.step))
    throw new RangeError(`The step must be whole minutes above zero: ${query.step}`);
  if (query.segments.length === 0 || !query.segments.every((segment) => positive(segment.minutes)))
    throw new RangeError("A booking needs segments of whole minutes above zero");
  const open = mergeRanges(query.open.map(range));
  const busy = query.busy.map(range);
  const held: [number, number][] = [];
  let total = 0;
  for (const segment of query.segments) {
    const length = segment.minutes * 60_000;
    if (segment.occupies) held.push([total, total + length]);
    total += length;
  }
  const fits = (at: number): boolean =>
    held.every(([offset, end]) => {
      const start = at + offset;
      const stop = at + end;
      return (
        open.some(([from, to]) => from <= start && stop <= to) &&
        !busy.some(([from, to]) => from < stop && start < to)
      );
    });
  const slots: Interval[] = [];
  for (const [from, to] of open) {
    for (let at = from; at < to; at += query.step * 60_000) {
      if (!fits(at)) continue;
      slots.push({ start: new Date(at).toISOString(), end: new Date(at + total).toISOString() });
      if (slots.length === query.limit) return slots;
    }
  }
  return slots;
}
