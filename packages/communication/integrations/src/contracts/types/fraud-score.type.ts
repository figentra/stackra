/**
 * Stackra file contract:
 * Purpose: `FraudScore`, a fraud scorer's answer, shaped as the `fraud` facts a rule tests: the risk score from 0 to
 *          100, the scorer's recommendation and the reason codes.
 * Boundary: a type only, and a fact value as it stands: `score` is a number field, `decision` an enum field and
 *           `reasons` a list field of the consumer's `fraud` fact source (ADR 0331), so `fraud.score > 70` holds an
 *           order without code. The consumer registers that source with its own labels; the thresholds are the
 *           tenant's rules, never constants. `providerRef` is kept for the scorer's feedback calls, not tested.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 5); ADR 0331 (decisions 4 and 10).
 */
import type { FraudDecision } from "#contracts/enums/fraud-decision.enum";

/**
 * A fraud score.
 *
 * @example
 * const facts = { fraud: { score: 82, decision: FraudDecision.Review, reasons: ["ip_country_mismatch"] } };
 */
export interface FraudScore {
  /** The risk, 0 (none) to 100 (certain fraud), normalised by the connector from the scorer's own scale. */
  readonly score: number;

  /** The scorer's recommendation. */
  readonly decision: FraudDecision;

  /** The scorer's reason codes, snake_case, most important first. */
  readonly reasons: readonly string[];

  /** The scorer's id of this assessment. */
  readonly providerRef: string;
}
