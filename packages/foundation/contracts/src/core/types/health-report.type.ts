/**
 * Stackra file contract:
 * Purpose: `HealthReport`, what a `HealthIndicator` answers: the status, an optional human detail and an optional
 *          round-trip latency.
 * Boundary: a type only. The detail is for an operator and carries no secret or personal data.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (no personal data in operational output); registry gaps R-27 and R-36 (owner decision
 *                     23).
 */
import type { Duration } from "#core/constants/duration.constant";
import type { HealthStatus } from "#core/enums/health-status.enum";

/** One dependency's health at the moment of the check. */
export interface HealthReport {
  /** Whether the dependency works. */
  readonly status: HealthStatus;

  /** Why, in a sentence, when the status is not `up`. */
  readonly detail?: string;

  /** How long the check took against the dependency. */
  readonly latency?: Duration;
}
