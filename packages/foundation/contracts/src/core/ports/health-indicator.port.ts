/**
 * Stackra file contract:
 * Purpose: the HealthIndicator port: one named dependency (a database, a queue, a provider) that can say whether it
 *          works, for the app's health probe.
 * Boundary: an abstract class that is its own token; each infra package ships the driver of its own dependency. A check
 *           reports a failure as `down`, it does not throw.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0263 (ports resolve by type); registry gaps R-27 and R-36
 *                     (owner decision 23).
 */
import { Port } from "#core/bases/port.base";
import type { HealthReport } from "#core/types/health-report.type";

/** Checks one dependency. */
export abstract class HealthIndicator extends Port {
  /** The dependency's name in the probe's answer (`postgres`, `redis`). */
  abstract readonly name: string;

  /** Probes the dependency now. */
  abstract check(): Promise<HealthReport>;
}
