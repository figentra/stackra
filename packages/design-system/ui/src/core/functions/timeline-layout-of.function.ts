/**
 * Stackra file contract:
 * Purpose: `timelineLayoutOf`, a timeline chart laid out as shares of its span: the span runs from the first task's
 *          start to the last task's end, rounded out to whole months (or weeks for a short plan, starting Monday), with
 *          a tick at each; each task becomes a bar in its lane, and today a marker when it falls inside.
 * Boundary: pure; dates are UTC days. A task with an unknown lane or an end before its start is left out.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same layout on web and native); STA-1371.
 */
import type { TimelineRow } from "#contracts/types/timeline-row.type";
import type { TimelineTask } from "#contracts/types/timeline-task.type";
import type { TimelineLayout } from "#core/types/timeline-layout.type";

/** One day in milliseconds. */
const DAY = 86_400_000;

/** The UTC midnight of an ISO date. */
const dayOf = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);

/**
 * The span, ticks and bars of a timeline.
 * @example timelineLayoutOf(rows, tasks, "2026-11-10").unit; // "month" for a quarter's plan
 */
export function timelineLayoutOf(
  rows: readonly TimelineRow[],
  tasks: readonly TimelineTask[],
  today?: string,
): TimelineLayout {
  const lanes = new Map(rows.map((row, index) => [row.key, index]));
  const kept = tasks.filter(
    (task) => lanes.has(task.rowKey) && dayOf(task.end) >= dayOf(task.start),
  );
  if (kept.length === 0) return { from: 0, to: 0, unit: "week", ticks: [], bars: [], today: null };
  const first = Math.min(...kept.map((task) => dayOf(task.start)));
  const last = Math.max(...kept.map((task) => dayOf(task.end))) + DAY;
  const unit = last - first > 62 * DAY ? "month" : "week";
  const floor = (time: number) => {
    const date = new Date(time);
    if (unit === "month") return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
    return time - ((date.getUTCDay() + 6) % 7) * DAY;
  };
  const next = (time: number) => {
    const date = new Date(time);
    return unit === "month"
      ? Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
      : time + 7 * DAY;
  };
  const from = floor(first);
  let to = from;
  const marks: number[] = [];
  while (to < last) {
    marks.push(to);
    to = next(to);
  }
  const span = to - from;
  const share = (time: number) => (time - from) / span;
  const now = today === undefined ? Number.NaN : dayOf(today) + DAY / 2;
  return {
    from,
    to,
    unit,
    ticks: marks.map((date) => ({ date, at: share(date) })),
    bars: kept.map((task) => ({
      task,
      row: lanes.get(task.rowKey) ?? 0,
      at: share(dayOf(task.start)),
      length: (dayOf(task.end) + DAY - dayOf(task.start)) / span,
    })),
    today: now >= from && now <= to ? share(now) : null,
  };
}
