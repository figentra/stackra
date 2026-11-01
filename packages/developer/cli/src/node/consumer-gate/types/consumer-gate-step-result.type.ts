/**
 * Stackra file contract:
 * Purpose: `ConsumerGateStepResult`, how one step ended: passed, excused, failed or skipped.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** The result of one step. */
export type ConsumerGateStepResult = {
  readonly id: string;
  readonly code?: number;
  readonly status: "pass" | "allowed" | "fail" | "skipped";

  /** The STA issues that excused an `allowed` step. */
  readonly issues?: readonly string[];

  /** The failure lines no live entry covers, on a `fail`. */
  readonly uncovered?: readonly string[];

  /** The issues of expired entries that would have excused a `fail`. */
  readonly expired?: readonly string[];

  /** Why a step was `skipped`. */
  readonly reason?: string;
};
