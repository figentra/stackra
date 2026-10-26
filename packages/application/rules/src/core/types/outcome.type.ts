/**
 * Stackra file contract:
 * Purpose: `Outcome`, what a matched rule yields: the key of a registered outcome kind and its parameter values.
 * Boundary: a type only, and data only: stored with a rule set revision, checked against the consumer's outcome kinds
 *           (`Rules.checkOutcomes`), guarded against the market-pack floors (`guardFloors`) and applied by the
 *           consumer's own handler (`OutcomeDispatcher`). A money value is `{ minor, currency }`, a date ISO 8601 text.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 9 and 10).
 */
import type { Json } from "@stackra/contracts";

/**
 * One outcome a matching rule yields: a kind and its parameter values.
 *
 * @example
 * const outcome: Outcome = { kind: "refundWindow", params: { days: 30 } };
 */
export interface Outcome {
  /** The outcome kind's key. */
  readonly kind: string;

  /** The parameter values, by the kind's parameter keys. */
  readonly params: Readonly<Record<string, Json>>;
}
