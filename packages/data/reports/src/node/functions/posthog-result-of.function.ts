/**
 * Stackra file contract:
 * Purpose: `posthogResultOf(call, reply)`, the `ProductAnalytics` result of a PostHog query API reply: funnel steps
 *          (people, conversion over the first step, median seconds from the previous step), retention rows (size and
 *          people retained per period) or a cohort's distinct people per period.
 * Boundary: internal; pure. It reads only counts, dates and median times; a reply that does not have the expected
 *           shape refuses with `ProductAnalyticsUnavailableError` (never a guessed zero), and nothing of the reply's
 *           body is copied into the error.
 * Runtime: node
 * Governing contract: ADR 0163 (decision 5 as amended 2026-10-28); ADR 0140 (refusals).
 */
import type { CohortResult } from "#contracts/types/cohort-result.type";
import type { FunnelResult } from "#contracts/types/funnel-result.type";
import type { RetentionResult } from "#contracts/types/retention-result.type";
import { ProductAnalyticsUnavailableError } from "#node/errors/product-analytics-unavailable.error";
import type { ProductAnalyticsCall } from "#node/types/product-analytics-call.type";

/** The call of one question. */
type CallOf<K extends ProductAnalyticsCall["kind"]> = Extract<ProductAnalyticsCall, { kind: K }>;

/** Throws the refusal for an unreadable reply. */
function unreadable(what: string): never {
  throw ProductAnalyticsUnavailableError.create({
    driver: "posthog",
    reason: `PostHog answered a ${what} result this driver does not read`,
  });
}

/** `value` as a non-negative count, or the refusal. */
function countOf(value: unknown, what: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) unreadable(what);
  return value;
}

/** The day of a PostHog date or timestamp, or the refusal. */
function dayOf(value: unknown, what: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) unreadable(what);
  return value.slice(0, 10);
}

/** The `results` array of `reply`, or the refusal. */
function resultsOf(reply: unknown, what: string): readonly unknown[] {
  const results = (reply as { readonly results?: unknown } | null)?.results;
  if (!Array.isArray(results)) unreadable(what);
  return results as readonly unknown[];
}

/** The funnel of a `FunnelsQuery` reply, one step per query step (a breakdown's first group). */
function funnelOf({ query }: CallOf<"funnel">, reply: unknown): FunnelResult {
  let results = resultsOf(reply, "funnel");
  if (Array.isArray(results[0])) results = results[0] as readonly unknown[];
  if (results.length !== query.steps.length) unreadable("funnel");
  const counts = results.map((step) => countOf((step as { count?: unknown }).count, "funnel"));
  const first = counts[0] ?? 0;
  return {
    steps: query.steps.map((step, index) => {
      const median = (results[index] as { median_conversion_time?: unknown })
        .median_conversion_time;
      const people = counts[index] ?? 0;
      return {
        event: step.event,
        people,
        conversion: first === 0 ? 0 : people / first,
        medianSeconds: index === 0 || typeof median !== "number" ? null : median,
      };
    }),
  };
}

/** The retention table of a `RetentionQuery` reply. */
function retentionOf({ query }: CallOf<"retention">, reply: unknown): RetentionResult {
  const cohorts = resultsOf(reply, "retention").map((row) => {
    const { date, values } = row as { date?: unknown; values?: unknown };
    if (!Array.isArray(values)) unreadable("retention");
    const retained = (values as readonly unknown[]).map((cell) =>
      countOf((cell as { count?: unknown }).count, "retention"),
    );
    return { start: dayOf(date, "retention"), size: retained[0] ?? 0, retained };
  });
  return { period: query.period, cohorts };
}

/** The sized cohort of a `TrendsQuery` reply of distinct people. */
function cohortOf({ query }: CallOf<"cohort">, reply: unknown): CohortResult {
  const results = resultsOf(reply, "cohort");
  if (results.length === 0) return { period: query.period, buckets: [] };
  const { data, days } = results[0] as { data?: unknown; days?: unknown };
  if (!Array.isArray(data) || !Array.isArray(days) || data.length !== days.length)
    unreadable("cohort");
  return {
    period: query.period,
    buckets: (days as readonly unknown[]).map((day, index) => ({
      start: dayOf(day, "cohort"),
      people: countOf((data as readonly unknown[])[index], "cohort"),
    })),
  };
}

/**
 * The result of `call` read from PostHog's `reply`.
 *
 * @throws ProductAnalyticsUnavailableError for a reply of another shape.
 * @example
 * posthogResultOf({ kind: "funnel", query }, { results: [{ count: 10 }, { count: 4, median_conversion_time: 90 }] });
 */
export function posthogResultOf(call: CallOf<"funnel">, reply: unknown): FunnelResult;
/** The retention result of `call` read from PostHog's `reply`. */
export function posthogResultOf(call: CallOf<"retention">, reply: unknown): RetentionResult;
/** The cohort result of `call` read from PostHog's `reply`. */
export function posthogResultOf(call: CallOf<"cohort">, reply: unknown): CohortResult;
/** Reads the result of any `call` kind from PostHog's `reply`, documented above. */
export function posthogResultOf(
  call: ProductAnalyticsCall,
  reply: unknown,
): FunnelResult | RetentionResult | CohortResult {
  switch (call.kind) {
    case "funnel": {
      return funnelOf(call, reply);
    }
    case "retention": {
      return retentionOf(call, reply);
    }
    case "cohort": {
      return cohortOf(call, reply);
    }
  }
}
