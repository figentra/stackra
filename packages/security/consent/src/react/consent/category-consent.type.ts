/**
 * Stackra file contract:
 * Purpose: `CategoryConsent`, what `useConsent(category)` returns: whether the client has read the stored decision,
 *          the category's status, and the three ways to change it (the banner's buttons).
 * Boundary: a type only. `isLoaded` is `false` in a server render and during hydration, so shared HTML never carries
 *           decision state; the functions write through the `ConsentLedger`.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decisions 2, 3 and 6); ADR 0294 (decision 8).
 */
import type { ConsentStatus } from "#core/index";

/** One category's consent in a component. */
export interface CategoryConsent {
  /** Whether the client has read the stored decision; render no decision state until it has. */
  readonly isLoaded: boolean;

  /** The category's status; `undecided` until loaded. */
  readonly status: ConsentStatus;

  /** Grants the category. */
  readonly grant: () => void;

  /** Refuses the category. */
  readonly deny: () => void;

  /** Forgets the category's decision, so it is asked again. */
  readonly reset: () => void;
}
