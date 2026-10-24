/**
 * Stackra file contract:
 * Purpose: `ConsentRecord`, the stored decision: the policy version it answered, when it was made and the choice per
 *          category. It is what a `ConsentStore` keeps (the decision cookie on the web, the `prefs` area on a device).
 * Boundary: a type only, in this leaf entry, so a category is its code as a string (the `ConsentCategory` enum sits in
 *           `.`, which this entry never imports). A required category is never stored: it is always granted.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 3: the decision carries a policy version); ADR 0294 (decision 15).
 */

/** One stored consent decision. */
export interface ConsentRecord {
  /** The `ConsentConfig.policyVersion` the visitor answered; another version reads as undecided. */
  readonly policyVersion: string;

  /** When the decision was last changed, as an ISO 8601 instant; it expires `expiryDays` later. */
  readonly decidedAt: string;

  /** Category code to the choice: `true` granted, `false` refused; a category absent here is undecided. */
  readonly categories: Readonly<Record<string, boolean>>;
}
