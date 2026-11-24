/**
 * Stackra file contract:
 * Purpose: `ReadinessAnswer`, what `ReadinessService.check` resolves to and `/readyz` sends: a status and each
 *          indicator's status by name.
 * Boundary: a type only; never an indicator's detail.
 * Runtime: node
 * Governing contract: ADR 0190 (health).
 */

/** The answer of the readiness check. */
export interface ReadinessAnswer {
  /** 200 when no indicator is down, else 503. */
  readonly status: 200 | 503;

  /** Each indicator's status by name. */
  readonly body: Readonly<Record<string, string>>;
}
