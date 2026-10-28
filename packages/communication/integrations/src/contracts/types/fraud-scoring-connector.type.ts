/**
 * Stackra file contract:
 * Purpose: `FraudScoringConnector`, what a fraud scorer's Connection implements (Signifyd, Riskified, Sift, Stripe
 *          Radar): score an order or a payment, and report how it turned out so the scorer learns.
 * Boundary: an interface a Connection implements when its Integration declares `ConnectorKind.FraudScoring` under
 *           `IntegrationCategory.Fraud`. The score is a fact for the tenant's rules (`FraudScore`); this contract
 *           holds, cancels and refunds nothing. `score` is idempotent on the request's reference.
 * Runtime: isomorphic
 * Governing contract: ADR 0447 (decision 5); ADR 0355 (decision 1); ADR 0356 (decision 2); ADR 0331.
 */
import type { FraudScore } from "#contracts/types/fraud-score.type";
import type { FraudScoreRequest } from "#contracts/types/fraud-score-request.type";

/**
 * A fraud scorer account.
 *
 * @example
 * const fraud = await gateway.fraud();
 * const facts = { fraud: await fraud.score(request) };
 */
export interface FraudScoringConnector {
  /** Scores `request`; a second call with the same reference returns the first score. */
  score: (request: FraudScoreRequest) => Promise<FraudScore>;

  /** Tells the scorer how `reference` ended: paid out fine, charged back as fraud, or cancelled before it shipped. */
  outcome: (reference: string, outcome: "legitimate" | "fraudulent" | "cancelled") => Promise<void>;
}
