/**
 * Stackra file contract:
 * Purpose: `rateLimitFor(edge, plan)`, the per-IP rate-limit rule a zone on `plan` can hold for the runway's
 *          `edge.rateLimit.perIp`: the window the plan accepts and the request count that keeps the same rate.
 * Boundary: pure; `zoneEdge` turns the answer into the zone's `http_ratelimit` rule. Per-area application limits are
 *           the service pipeline's (ADR 0217 decision 2), not this rule's.
 * Runtime: isomorphic
 * Governing contract: ADR 0217 (decision 2: limits enforced at the edge and in the pipeline), ADR 0290 (decision 13:
 *                     Free until the first public API, then Pro).
 */
import type { ZonePlan } from "#core/enums/zone-plan.enum";
import type { EdgePolicy } from "#core/types/edge-policy.type";

/** The rate-limit windows, in seconds, each plan's rate limiting rules accept. */
const WINDOWS = {
  free: [10],
  pro: [10, 60],
} as const satisfies Record<ZonePlan, readonly [number, ...number[]]>;

/**
 * The rate-limit rule for `plan`, or `null` when the runway sets no per-IP limit.
 *
 * @param edge - the parsed edge policy.
 * @param plan - the zone's plan.
 * @example
 * rateLimitFor(edge, "free"); // runway 600 per 60 s → { period: 10, requestsPerPeriod: 100 }
 * rateLimitFor(edge, "pro"); // → { period: 60, requestsPerPeriod: 600 }
 */
export function rateLimitFor(
  edge: EdgePolicy,
  plan: ZonePlan,
): { period: number; requestsPerPeriod: number } | null {
  const limit = edge.rateLimit.perIp;
  if (limit === undefined) return null;
  const windows: readonly [number, ...number[]] = WINDOWS[plan];
  // shortcut: the longest window the plan allows at or below the runway's, the count scaled to the same rate; add
  // the Business windows when a zone moves to that plan.
  // oxlint-disable-next-line unicorn/prefer-array-find -- reason: findLast is ES2023 and the base lib is ES2022
  const period = windows.filter((window) => window <= limit.periodSeconds).at(-1) ?? windows[0];
  return {
    period,
    requestsPerPeriod: Math.max(1, Math.round((limit.requests * period) / limit.periodSeconds)),
  };
}
