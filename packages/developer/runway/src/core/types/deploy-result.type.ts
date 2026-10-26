/**
 * Stackra file contract:
 * Purpose: `DeployResult`, one target's outcome in a deploy, promotion or rollback: its record and the provider's
 *          verify report.
 * Boundary: type only; `deploy`, `promote` and `rollback` return one per target, in release order.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 3: apply then verify), ADR 0294 (the `HealthReport` vocabulary).
 */
import type { HealthReport } from "@stackra/contracts";

import type { DeployRecord } from "#core/types/deploy-record.type";

/** One target's outcome. */
export interface DeployResult {
  /** What was shipped. */
  readonly record: DeployRecord;

  /** Whether it serves: `up`, `degraded` while a build still runs, or `down`. */
  readonly report: HealthReport;
}
