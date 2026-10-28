/**
 * Stackra file contract:
 * Purpose: `checkProductAnalyticsQuery(call, scopeProperty)`, the shape check every `ProductAnalytics` driver applies
 *          before it reaches its store: two to twenty funnel steps, a window of 1 to 90 days, 1 to 52 retention
 *          intervals, a known period, a range of real `YYYY-MM-DD` days at most two years long, event names of 1 to 200
 *          characters, and property matches by safe name with scalar values (at most 100 in a list) that never name
 *          the property the driver isolates scopes by.
 * Boundary: internal; pure. It throws `ProductAnalyticsQueryInvalidError` with the first problem found and never
 *           echoes a property value.
 * Runtime: node
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0160 (no caller text in a query).
 */
import { Enum } from "@stackra/contracts";

import { RetentionPeriod } from "#contracts/enums/retention-period.enum";
import type { AnalyticsDateRange } from "#contracts/types/analytics-date-range.type";
import type { AnalyticsEventMatch } from "#contracts/types/analytics-event-match.type";
import { ProductAnalyticsQueryInvalidError } from "#node/errors/product-analytics-query-invalid.error";
import type { ProductAnalyticsCall } from "#node/types/product-analytics-call.type";

/** A day as `YYYY-MM-DD`. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A property name a match may filter on. */
const PROPERTY = /^[A-Za-z_$][A-Za-z0-9_$.:-]{0,199}$/;

/** The longest range, in days. */
const MAX_SPAN_DAYS = 731;

/** Throws the refusal of `query` for `reason`. */
function refuse(query: string, reason: string): never {
  throw ProductAnalyticsQueryInvalidError.create({ query, reason });
}

/** Whether `value` is an integer from `min` to `max`. */
function within(value: unknown, min: number, max: number): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

/** The epoch day of `text`, or NaN for a day that does not exist. */
function epochDay(text: unknown): number {
  if (typeof text !== "string" || !DAY.test(text)) return Number.NaN;
  const time = Date.parse(`${text}T00:00:00Z`);
  return Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== text
    ? Number.NaN
    : time / 86_400_000;
}

/** Checks a date range. */
function checkRange(query: string, range: AnalyticsDateRange | undefined): void {
  const from = epochDay(range?.from);
  const to = epochDay(range?.to);
  if (Number.isNaN(from) || Number.isNaN(to))
    refuse(query, "range days must be real YYYY-MM-DD days");
  if (from > to) refuse(query, "range.from is after range.to");
  if (to - from + 1 > MAX_SPAN_DAYS) refuse(query, `a range spans at most ${MAX_SPAN_DAYS} days`);
}

/** Checks an event name. */
function checkEvent(query: string, event: unknown): void {
  if (typeof event !== "string" || event.length === 0 || event.length > 200)
    refuse(query, "an event name has 1 to 200 characters");
}

/** Checks a match: its event, property names and values. */
function checkMatch(query: string, match: AnalyticsEventMatch, scopeProperty: string | null): void {
  checkEvent(query, match.event);
  for (const [name, value] of Object.entries(match.where ?? {})) {
    if (!PROPERTY.test(name)) refuse(query, `property name "${name}" is not allowed`);
    if (name === scopeProperty)
      refuse(query, `property "${name}" is the scope and is set by the driver`);
    const values: readonly unknown[] = Array.isArray(value) ? value : [value];
    if (values.length === 0 || values.length > 100)
      refuse(query, `property "${name}" takes 1 to 100 values`);
    for (const item of values)
      if (!["string", "number", "boolean"].includes(typeof item))
        refuse(query, `property "${name}" takes strings, numbers or booleans`);
  }
}

/** Checks a period. */
function checkPeriod(query: string, period: unknown): void {
  if (!(Enum.values(RetentionPeriod) as readonly unknown[]).includes(period))
    refuse(query, "period is day, week or month");
}

/**
 * Checks one product analytics call.
 *
 * @param call - the question and its query.
 * @param scopeProperty - the property the driver isolates scopes by, which a match may not name; null for none.
 * @throws ProductAnalyticsQueryInvalidError for the first problem found.
 * @example
 * checkProductAnalyticsQuery({ kind: "funnel", query: { steps: [{ event: "a" }, { event: "b" }], range } }, "scope_id");
 */
export function checkProductAnalyticsQuery(
  call: ProductAnalyticsCall,
  scopeProperty: string | null,
): void {
  switch (call.kind) {
    case "funnel": {
      const { steps, range, windowDays } = call.query;
      if (!Array.isArray(steps) || steps.length < 2 || steps.length > 20)
        refuse("funnel", "a funnel takes 2 to 20 steps");
      for (const step of steps) checkMatch("funnel", step, scopeProperty);
      checkRange("funnel", range);
      if (windowDays !== undefined && !within(windowDays, 1, 90))
        refuse("funnel", "windowDays is an integer from 1 to 90");
      return;
    }
    case "retention": {
      const { startEvent, returnEvent, period, intervals, range } = call.query;
      checkEvent("retention", startEvent);
      checkEvent("retention", returnEvent);
      checkPeriod("retention", period);
      if (!within(intervals, 1, 52)) refuse("retention", "intervals is an integer from 1 to 52");
      checkRange("retention", range);
      return;
    }
    case "cohort": {
      checkMatch("cohort", call.query.match, scopeProperty);
      checkPeriod("cohort", call.query.period);
      checkRange("cohort", call.query.range);
      break;
    }
  }
}
