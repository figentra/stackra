/**
 * Stackra file contract:
 * Purpose: `TrialTerms`, a product's trial: the tier it runs on, its length and whether a card is asked for.
 * Boundary: a type only; catalogue data (the shared default is a 14-day Pro trial without a card, seeded, not coded).
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 1); config-model section 2 (C8, C9).
 */

/** A trial. */
export interface TrialTerms {
  /** The tier the trial runs on. */
  readonly tier: string;

  /** Its length in days. */
  readonly days: number;

  /** Whether a card is asked for at sign-up. */
  readonly cardRequired: boolean;
}
