/**
 * Stackra file contract:
 * Purpose: `FraudDecision`, the action a fraud scorer recommends with its score: approve, review or decline.
 * Boundary: an `Enum.of` value plus the type of the same name. A recommendation only: what an order does with a score
 *           (hold it, cancel it, ask for a deposit) is the tenant's rule over the `fraud` facts, never this value.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 5); ADR 0331 (rules test facts); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The recommendations a fraud score carries: what to do with the order.
 *
 * @example
 * if (score.decision === FraudDecision.Review) hold(order);
 */
export const FraudDecision = Enum.of({
  /** The scorer sees no risk worth acting on. */
  Approve: "approve",
  /** A person should look before it ships. */
  Review: "review",
  /** The scorer would refuse it. */
  Decline: "decline",
});

/** One of the codes above. */
export type FraudDecision = Enum.Value<typeof FraudDecision>;
