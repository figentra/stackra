/**
 * Stackra file contract:
 * Purpose: `ReadinessCheck`, what `/readyz` runs: a name for the probe's answer and a check that reports a
 *          `HealthReport`. Every `HealthIndicator` satisfies it, and so do this service's own checks.
 * Boundary: a type only; a check reports a failure as `down`, it does not throw.
 * Runtime: node
 * Governing contract: ADR 0190 (health); contracts `HealthIndicator` and `HealthReport`.
 */
import type { HealthReport } from "@stackra/contracts";

/** One dependency of this service that can say whether it works. */
export interface ReadinessCheck {
  /** The dependency's name in the probe's answer. */
  readonly name: string;

  /** Probes the dependency now. */
  readonly check: () => Promise<HealthReport>;
}
