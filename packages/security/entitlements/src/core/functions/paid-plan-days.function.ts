/**
 * Stackra file contract:
 * Purpose: `paidPlanDays`, the paid-plan age fact of `CapLiftFacts`: whole days since the snapshot's `paidSince`.
 * Boundary: pure; no `paidSince` (a free plan, a trial) or a future one is 0. The plan service sets `paidSince`; the
 *           threshold that lifts a cap is rule-set data.
 * Runtime: isomorphic
 * Governing contract: ADR 0215; owner R1-OS-40 (cap lift); stackra-117 (STA-1247).
 */
import type { PlanSnapshot } from "#contracts/types/plan-snapshot.type";

const DAY_MS = 86_400_000;

/**
 * Whole days the paid plan in `snapshot` has run at `now`.
 *
 * @example
 * const facts: CapLiftFacts = { kybPassed, domainVerified, paidPlanDays: paidPlanDays(snapshot, new Date()) };
 */
export function paidPlanDays(snapshot: Pick<PlanSnapshot, "paidSince">, now: Date): number {
  if (!snapshot.paidSince) return 0;
  return Math.max(0, Math.floor((now.getTime() - snapshot.paidSince.getTime()) / DAY_MS));
}
